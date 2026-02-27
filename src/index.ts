//@ts-ignore
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getServer } from '@/core/server';
import { Hono } from 'hono';
import { toFetchResponse, toReqRes } from 'fetch-to-node';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { authenticate } from '@/middlewares/auth';
import { Logger } from '@/helpers/logger';

const app = new Hono();

import { config, initializeConfig } from '@/config/environment';

// Flag to ensure config is initialized only once
let configInitialized = false;

// Initialize config on first request and create logger per request
app.use('*', async (c, next) => {
  // Initialize config once
  if (!configInitialized) {
    // @ts-ignore - Azion runtime specific
    const args = c.event.args || {};
    initializeConfig(args);
    configInitialized = true;
  }

  // Create a new logger for each request
  const logger = new Logger();
  // @ts-ignore - Hono context types not configured
  c.set('logger', logger);

  await next();
});

app.get('/.well-known/openid-configuration', async (c) => {
  // OpenID configuration discovery endpoint
  return c.json({
    issuer: config.sso.url,
    authorization_endpoint: `${config.sso.url}/oauth/authorize`,
    token_endpoint: `${config.sso.url}/oauth/token`,
    userinfo_endpoint: `${config.sso.url}/oauth/userinfo`,
    jwks_uri: `${config.sso.url}/oauth/jwks`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256']
  })
})

app.get('/.well-known/oauth-authorization-server', async (c) => {
  // RFC 8414: OAuth 2.0 Authorization Server Metadata
  // Similar to OpenID configuration but focused on OAuth 2.0
  return c.json({
    issuer: config.sso.url,
    authorization_endpoint: `${config.sso.url}/oauth/authorize`,
    token_endpoint: `${config.sso.url}/oauth/token`,
    jwks_uri: `${config.sso.url}/oauth/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    service_documentation: 'https://www.azion.com/en/documentation/devtools/mcp/'
  })
})

app.get('/.well-known/oauth-protected-resource', async (c) => {
  // RFC 9068: OAuth 2.0 Protected Resource Metadata
  // Indicates how to validate tokens for this protected resource
  return c.json({
    resource: config.baseUrl,
    authorization_servers: [config.sso.url],
    jwks_uri: `${config.sso.url}/oauth/jwks`,
    bearer_methods_supported: ['header'],
    resource_signing_alg_values_supported: ['RS256'],
    resource_documentation: 'https://www.azion.com/en/documentation/devtools/mcp/',
    scopes_supported: ['openid', 'profile', 'email', 'offline_access']
  })
})

app.get('/authorize', async (c) => {
  // OAuth authorization endpoint - redirect to SSO
  const url = new URL(c.req.url)
  const params = url.searchParams

  // Redirect to SSO with all the OAuth parameters
  const ssoUrl = new URL(`${config.sso.url}/oauth/authorize`)
  params.forEach((value, key) => {
    ssoUrl.searchParams.set(key, value)
  })

  return c.redirect(ssoUrl.toString())
})

app.post('/oauth/token', async (c) => {
  const logger = new Logger()

  try {
    const body = await c.req.text()
    logger.logInfo('OAuth token exchange request')

    const response = await fetch(`${config.sso.originUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body
    })

    const data = await response.json()

    if (!response.ok) {
      logger.logInfo(`OAuth token exchange failed: ${response.status}`)
    }

    return c.json(data, response.status as any)
  } catch (error) {
    logger.logError(error)
    return c.json({ error: 'Token exchange failed' }, 500)
  }
})

app.use('/*', async (c, next) => {

  if (c.req.method === 'OPTIONS') {
    await next()
    return
  }

  // Skip auth for OAuth endpoints and .well-known discovery endpoints
  if (c.req.path === '/authorize' ||
      c.req.path === '/oauth/callback' ||
      c.req.path === '/oauth/token' ||
      c.req.path === '/.well-known/openid-configuration' ||
      c.req.path === '/.well-known/oauth-authorization-server' ||
      c.req.path === '/.well-known/oauth-protected-resource') {
    await next()
    return
  }

  // Handle browser requests to root - redirect immediately and stop processing
  if (c.req.method === 'GET' && c.req.path === '/') {
    const acceptHeader = c.req.header('Accept') || '';
    const userAgent = c.req.header('User-Agent') || '';
    const isBrowser = acceptHeader.includes('text/html') ||
                       (acceptHeader.includes('*/*') && userAgent.match(/Mozilla|Chrome|Safari|Firefox|Edge|Brave/i));

    if (isBrowser) {
      // Redirect and STOP - don't continue processing
      return c.redirect('https://www.azion.com/en/documentation/devtools/mcp/', 302);
    }
  }

  // @ts-ignore - Hono context types not configured
  const logger = c.get('logger') as any

  const authHeader = c.req.header('Authorization')
  const authentication = await authenticate(authHeader)

  if (!authentication.authenticated) {
    logger.logError(authentication.error)
    return new Response(JSON.stringify(authentication.error), { status: 401 })
  }

  logger.setUser(authentication)

  // Store authentication data and header in Hono context for use in route handlers
  // @ts-ignore - Hono context types not configured
  c.set('authentication', authentication)
  // @ts-ignore - Hono context types not configured
  c.set('authHeader', authHeader)  // Store the original header for API calls

  await next()
})

app.post('/', async (c) => {
  // @ts-ignore - Hono context types not configured
  const logger = c.get('logger') as any

  try {
    const { req, res } = toReqRes(c.req.raw);

    // Get authentication data from context (set by middleware)
    // @ts-ignore - Hono context types not configured
    const authentication = c.get('authentication') as any
    // @ts-ignore - Hono context types not configured
    const authHeader = c.get('authHeader') as any

    // Use authentication.token which has the correct token for API calls
    // (AZION_TOKEN for fastpass, user token for others)
    const server = getServer(authentication.apiProfile, authentication.token);

    let authInfo: AuthInfo = {
      token: authHeader?.replace("Bearer ", "")?.replace("Token ", "") || "",
      clientId: "",
      scopes: []
    }

    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    (req as any).auth = authInfo;

    await server.connect(transport);

    const body = await c.req.json();

    await transport.handleRequest(req, res, body)

    res.on('close', () => {
      logger.logInfo('Connection closed.');
      transport.close();
      server.close();
    });

    return toFetchResponse(res);
  } catch (error) {
    logger.logError(error);
    const { req, res } = toReqRes(c.req.raw);
    if (!res.headersSent) {
      res.writeHead(500).end(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      }));
    }
  }
});

app.get('/', async (c) => {
  // @ts-ignore - Hono context types not configured
  const logger = c.get('logger') as any
  logger.logInfo('Received GET MCP request from application. Returning method not allowed.')

  // Browser requests are already handled by middleware redirect
  // This handler only processes non-browser GET requests (API clients)
  return c.json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }, 405);
});

app.delete('/', async (c) => {
  // @ts-ignore - Hono context types not configured
  const logger = c.get('logger') as any
  logger.logInfo('Received DELETE MCP request. Returning method not allowed.')

  return c.json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }, 405);
});

app.fire();
