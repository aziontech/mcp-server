import { afterEach, beforeAll, describe, expect, it } from 'vitest'

// Fast-pass token used by Azion Copilot: authenticate() accepts it locally,
// without calling the Azion API, so the MCP endpoint can be exercised end to end.
const FAST_PASS = 'functional-test-fast-pass-token'
process.env.MCP_COPILOT_SERVER_TOKEN = FAST_PASS
process.env.AZION_TOKEN = 'functional-test-azion-token'

// The Azion runtime exposes the function args on the FetchEvent; the app reads
// them through `c.event.args` on the first request.
const ARGS = { SSO_URL: 'https://sso.example.test', API_URL: 'https://api.example.test' }
const event = { args: ARGS, respondWith: () => undefined, waitUntil: () => undefined, passThroughOnException: () => undefined }

type App = { request: (input: string, init?: RequestInit, env?: unknown, ctx?: unknown) => Response | Promise<Response> }
let app: App

beforeAll(async () => {
  app = (await import('../../../src/app')).default as unknown as App
})

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return Promise.resolve(app.request(`http://localhost${path}`, init, undefined, event))
}

function rpc(body: object, headers: Record<string, string> = {}): Promise<Response> {
  return request('/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

/** The streamable HTTP transport answers with SSE; extract the JSON-RPC message. */
async function rpcResult(res: Response): Promise<any> {
  const text = await res.text()
  const data = text
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice('data: '.length))
    .join('')
  return JSON.parse(data || text)
}

describe('OAuth discovery endpoints', () => {
  it('serves the authorization server metadata from the runtime args', async () => {
    const res = await request('/.well-known/oauth-authorization-server')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      issuer: ARGS.SSO_URL,
      authorization_endpoint: `${ARGS.SSO_URL}/oauth/authorize`,
      token_endpoint: `${ARGS.SSO_URL}/oauth/token`,
      code_challenge_methods_supported: ['S256'],
    })
  })

  it('serves the OpenID configuration and protected resource metadata', async () => {
    const openid = await (await request('/.well-known/openid-configuration')).json()
    expect(openid.jwks_uri).toBe(`${ARGS.SSO_URL}/oauth/jwks`)

    const resource = await (await request('/.well-known/oauth-protected-resource')).json()
    expect(resource.authorization_servers).toEqual([ARGS.SSO_URL])
    expect(resource.bearer_methods_supported).toEqual(['header'])
  })

  it('redirects /authorize to the SSO keeping every OAuth parameter', async () => {
    const res = await request('/authorize?client_id=abc&state=xyz&code_challenge_method=S256')
    expect(res.status).toBe(302)
    const location = new URL(res.headers.get('location') ?? '')
    expect(`${location.origin}${location.pathname}`).toBe(`${ARGS.SSO_URL}/oauth/authorize`)
    expect(Object.fromEntries(location.searchParams)).toEqual({ client_id: 'abc', state: 'xyz', code_challenge_method: 'S256' })
  })
})

describe('authentication', () => {
  it('redirects browsers on GET / to the documentation', async () => {
    const res = await request('/', { headers: { Accept: 'text/html' } })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://www.azion.com/en/documentation/devtools/mcp/')
  })

  it('rejects MCP calls without credentials', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ message: 'No authentication provided' })
  })

  it('rejects an unknown authorization scheme', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { Authorization: `Basic ${FAST_PASS}` })
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ message: 'Invalid authentication header format' })
  })

  it('rejects a personal token that the Azion API does not accept', async () => {
    const calls: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return new Response(JSON.stringify({ detail: 'Invalid token' }), { status: 401 })
    }) as typeof fetch

    const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { Authorization: 'Token not-a-valid-token' })
    expect(res.status).toBe(401)
    expect(calls.length).toBeGreaterThan(0)
  })
})

describe('MCP endpoint (fast pass)', () => {
  const auth = { Authorization: `Bearer ${FAST_PASS}` }

  it('answers GET / from API clients with JSON-RPC "method not allowed"', async () => {
    const res = await request('/', { headers: { ...auth, Accept: 'application/json' } })
    expect(res.status).toBe(405)
    expect(await res.json()).toMatchObject({ jsonrpc: '2.0', error: { code: -32000 } })
  })

  it('completes the MCP initialize handshake', async () => {
    const res = await rpc(
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'vitest', version: '1.0.0' } },
      },
      auth,
    )
    if (res.status !== 200) console.log('DEBUG', res.status, await res.clone().text())
    expect(res.status).toBe(200)
    const msg = await rpcResult(res)
    expect(msg.id).toBe(1)
    expect(msg.result.serverInfo).toEqual({ name: 'azion-mcp-server', version: '1.0.0' })
    expect(msg.result.capabilities).toHaveProperty('tools')
    expect(msg.result.capabilities).toHaveProperty('resources')
  })

  it('lists the registered tools, including the v3 command search for the v3 profile', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, auth)
    expect(res.status).toBe(200)
    const msg = await rpcResult(res)
    const names: string[] = msg.result.tools.map((t: { name: string }) => t.name)
    expect(names.length).toBeGreaterThan(0)
    expect(names).toContain('search_azion_api_v3_commands')
    expect(names).toContain('create_graphql_query')
    for (const tool of msg.result.tools) {
      expect(tool.description, tool.name).toBeTruthy()
      expect(tool.inputSchema?.type, tool.name).toBe('object')
    }
  })

  it('lists the registered resources', async () => {
    const res = await rpc({ jsonrpc: '2.0', id: 3, method: 'resources/list' }, auth)
    expect(res.status).toBe(200)
    const msg = await rpcResult(res)
    expect(Array.isArray(msg.result.resources)).toBe(true)
  })
})
