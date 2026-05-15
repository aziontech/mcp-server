# Architecture — mcp-server (Azion MCP Server)

## Overview

Production MCP (Model Context Protocol) server that bridges AI assistants (Claude Code, Claude Desktop, Cursor) with the Azion Platform. Exposes 9 tools for documentation search, code samples, API reference, Rules Engine generation, and GraphQL query building. Runs as an Azion Edge Function behind `mcp.azion.com`.

## Technology Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript 5.8 |
| Runtime | Node.js 20+ / Azion Edge Runtime |
| Web Framework | Hono 4.7 |
| MCP SDK | @modelcontextprotocol/sdk 1.13 |
| Transport | Streamable HTTP (JSON-RPC 2.0) |
| Search | Hybrid Vector + FTS via Azion SQL |
| LLM | OpenAI (gpt-4.1) via LangChain |
| Auth | Clerk JWT, Azion personal tokens, OAuth |
| Package Manager | Yarn 1.x |
| Deployment | Azion CLI v4 |

## Request Flow

```
AI Client (Claude Code / Cursor / etc.)
    │
    ▼
POST https://mcp.azion.com/
    │
    ▼
Hono App (src/app.ts)
    │
    ├── Auth Middleware (src/middlewares/auth.ts)
    │   ├── Fast Pass (Copilot token, timing-safe)
    │   ├── Personal Token (azion + 35 chars → GET /api/user/me)
    │   ├── JWT (OAuth or direct → userinfo/account validation)
    │   └── OAuth Bearer (→ /oauth/userinfo)
    │
    ▼
MCP Server (src/core/server.ts)
    │
    ├── Tool Registration (src/core/tools.ts)
    │   └── 9 tools registered with Zod schemas
    │
    ▼
StreamableHTTPServerTransport (JSON-RPC 2.0)
    │
    ▼
Tool Execution (src/core/baseTools.ts)
    ├── RAG Tools → Azion SQL hybrid search → Edge AI rerank
    ├── Rules Engine → OpenAI structured output
    └── GraphQL → OpenAI with retry (up to 6 attempts)
```

## Tools

| Tool | Type | Purpose |
|------|------|---------|
| `search_azion_docs_and_site` | RAG | Platform documentation and knowledge base |
| `search_azion_code_samples` | RAG | Code libraries and sample implementations |
| `search_azion_cli_commands` | RAG | CLI usage and command reference |
| `search_azion_api_v3_commands` | RAG | Legacy API v3 endpoints (v3-profile only) |
| `search_azion_api_v4_commands` | RAG | Current API v4 endpoints |
| `search_azion_terraform` | RAG | Terraform provider documentation |
| `create_rules_engine` | LLM | Generate Rules Engine configurations |
| `create_graphql_query` | LLM | Generate analytics GraphQL queries |
| `deploy_azion_static_site` | Guide | Step-by-step deployment workflows |

## Module Structure

```
src/
├── app.ts                    Hono app, routes, OAuth endpoints
├── config/
│   └── environment.ts        Configuration defaults (DB name, URLs, tokens)
├── core/
│   ├── server.ts             MCP server creation, tool/resource registration
│   ├── tools.ts              Tool definitions array (9 tools)
│   ├── baseTools.ts          Tool factory functions (RAG, Rules Engine, GraphQL)
│   ├── resources.ts          MCP resource registration
│   ├── coderStaticSiteResources.ts  Static site deployment guides
│   └── edgeai.ts             Edge AI reranking integration
├── helpers/
│   ├── constants.ts          System prompts, documentation source lists
│   ├── utils.ts              Hybrid search queries, model helpers
│   ├── graphql.ts            GraphQL query generation
│   ├── logger.ts             Per-request UUID logging with sanitization
│   └── sanitization.ts       Input/log sanitization (SQL, tokens)
├── middlewares/
│   └── auth.ts               Multi-method authentication
└── types/
    └── index.ts              TypeScript interfaces
```

## Search Architecture

Knowledge is stored in Azion SQL with both vector embeddings and full-text search indices:

- **Collections**: docs, site, graphql, lib, azionsamples, cli, APIV3, APIV4, terraformproviderazion, azion-queries
- **Hybrid Search**: Combines vector similarity with FTS relevance
- **Re-ranking**: Edge AI re-ranks results for improved relevance
- **Source Filtering**: Excludes blog posts, agreements, and non-technical content

## Authentication

Four authentication methods, checked in order:

1. **Fast Pass** — Copilot server token (timing-safe comparison)
2. **Personal Token** — `azion` + 35 alphanumeric characters, validated against `/api/user/me`
3. **JWT** — OAuth JWTs via `/oauth/userinfo` or direct JWTs via `/v4/account/account`
4. **OAuth Bearer** — Standard Bearer token flow

API profile (v3 vs v4) determined by user's `client_flags`, which controls which tools are exposed.

## Deployment

- **Production**: `mcp.azion.com` — deployed via `deploy-prod.yml` workflow
- **Stage**: `stage-mcp.azion.com` — deployed via `deploy-stage.yml` workflow
- **Local**: `azion dev` on port 3333
- Deploy state persisted to S3 bucket between deployments
