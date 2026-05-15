# Runbook — mcp-server (Azion MCP Server)

## Service Identity

| Field | Value |
|-------|-------|
| Name | mcp-server |
| Type | MCP Server (Model Context Protocol) |
| URL | `https://mcp.azion.com` (prod), `https://stage-mcp.azion.com` (stage) |
| Language | TypeScript |
| Runtime | Azion Edge Functions / Node.js 20+ |
| Framework | Hono 4.7 |

## Local Development

```bash
# Install dependencies
yarn install

# Set environment variables
cp .env.sample .env
# Edit .env with AZION_TOKEN, OPENAI_API_KEY, etc.

# Run locally (via Azion CLI)
azion dev

# Type check
yarn type-check

# Lint
yarn lint
yarn lint:fix
```

Local server runs at `http://localhost:3333`.

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| deploy-prod.yml | Manual + main push | Deploy to `mcp.azion.com` |
| deploy-stage.yml | Manual + dev push | Deploy to `stage-mcp.azion.com` |
| ci-compliance.yml | PR, weekly | Azion compliance checks |
| ci-security.yml | PR, weekly | Security scanning |
| security-linter.yml | PR | ESLint security rules |
| security-scan.yml | PR | Vulnerability scanning |
| cla.yml | PR | CLA enforcement |

## Deployment

```bash
# Build for production
BUILD_ENV=production azion build --config-dir azion/production

# Deploy
BUILD_ENV=production azion deploy --local --auto --config-dir azion/production
```

Deploy state is downloaded from / uploaded to an S3 bucket to maintain Edge Function IDs across CI runs.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZION_TOKEN` | Yes (local) | Azion API personal token |
| `OPENAI_API_KEY` | Yes (local) | OpenAI API key for LLM tools |
| `MCP_COPILOT_SERVER_TOKEN` | No | Fast Pass token for Copilot integration |
| `DATABASE_NAME` | No | Azion SQL database (default: `azioncopilot`) |
| `MCP_BASE_URL` | No | Server base URL |
| `BUILD_ENV` | Deploy | `production` or `stage` |

## Common Issues

### 1. Authentication Failures

**Symptoms**: 401 responses, "Unauthorized" errors in client.

**Resolution**: Verify token format. Personal tokens must match `azion` + 35 alphanumeric chars. Check that the token is valid by calling `GET /api/user/me`. For Copilot, verify `MCP_COPILOT_SERVER_TOKEN` matches the expected value.

### 2. Search Returns Empty Results

**Symptoms**: Tools return no documents or irrelevant results.

**Resolution**: Verify the Azion SQL database `azioncopilot` is populated and accessible. Check that the `AZION_TOKEN` used has access to the EdgeSQL database. The hybrid search requires both vector embeddings and FTS indices to be present.

### 3. GraphQL Query Generation Fails

**Symptoms**: `create_graphql_query` returns errors after multiple attempts.

**Resolution**: The tool retries up to 6 times with error recovery. Check OpenAI API key validity and rate limits. Verify the `dataSource` parameter is one of the supported enum values. Review logs for the specific GraphQL validation error returned by the API.

### 4. Deploy State Missing

**Symptoms**: Deployment creates new Edge Functions instead of updating existing ones.

**Resolution**: The deploy state file is stored in S3. Ensure the deployment workflow downloads the state before building. Check the S3 bucket access credentials in GitHub secrets.

### 5. Local Dev — Edge Runtime Differences

**Symptoms**: Features work locally but fail on Azion Edge Runtime (or vice versa).

**Resolution**: Local dev runs on Node.js while production runs on Azion Edge Runtime. Some Node.js APIs may not be available. Use the polyfills configuration in `azion.config.ts`. Test with `azion dev` which simulates the edge runtime more closely.

## Escalation

| Level | Contact | When |
|-------|---------|------|
| L1 | Team Dev Tools & Integrations | Tool bugs, search quality, deployment issues |
| L2 | Platform team | Edge Runtime issues, SQL database problems |
| L3 | Security Office | Authentication, token validation issues |
