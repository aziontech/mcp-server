# Azion MCP

Model Context Protocol server for Azion Platform integration

## Features
- Search Azion documentation and knowledge base
- Generate GraphQL queries for analytics
- Create Rules Engine configurations
- Build and deploy applications
- Access CLI and API documentation
- Deploy static sites with guided workflows

## Environments

Choose the appropriate environment based on your needs:

- **Production**: `https://mcp.azion.com` (production console, main branch)
- **Stage**: `https://stage-mcp.azion.com` (stage console, dev branch)
- **Local Development**: `http://localhost:3333` (running `azion dev` locally)
- **Personal Deploy**: Your personal Azion URL after deploying with `azion deploy --config-dir azion/personal`

## Prerequisites
- Azion Personal Token from https://console.azion.com/personal-tokens
- Node.js 18+ (for mcp-remote in some configurations)
- For local/personal development: `OPENAI_API_KEY` environment variable

## Configuration

### Claude Code (Terminal)
```bash
# Add Azion MCP (production)
claude mcp add "azion-mcp" "https://mcp.azion.com" -t http -H "Authorization: Bearer YOUR_PERSONAL_TOKEN"

# Or for stage environment
claude mcp add "azion-mcp-stage" "https://stage-mcp.azion.com" -t http -H "Authorization: Bearer YOUR_PERSONAL_TOKEN"

# Or for local development
claude mcp add "azion-mcp-local" "http://localhost:3333" -t http -H "Authorization: Bearer YOUR_PERSONAL_TOKEN"

# Start Claude service
claude serve
```

**Note for local development**: 
- Set `OPENAI_API_KEY` in your environment or in Azion environment variables for personal deploys
- Run `azion dev` in the mcp directory before connecting

### Claude Desktop
```json
{
    "mcpServers": {
        "azion": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "https://mcp.azion.com",
                "--header",
                "Authorization: Bearer YOUR_PERSONAL_TOKEN"
            ]
        }
    }
}
```

### Cursor
```json
{
    "mcpServers": {
        "azion": {
            "type": "streamable-http",
            "url": "https://mcp.azion.com",
            "headers": {
                "Authorization": "Token YOUR_PERSONAL_TOKEN"
            }
        }
    }
}
```

### Windsurf
`.codeium/windsurf/mcp_config.json`:
```json
{
    "mcpServers": {
        "azion": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "https://mcp.azion.com",
                "--header",
                "Authorization: Bearer YOUR_PERSONAL_TOKEN"
            ]
        }
    }
}
```

### Warp Terminal
Configure in Warp MCP settings:
```json
{
    "azion": {
        "command": "npx",
        "args": [
            "mcp-remote",
            "https://mcp.azion.com",
            "--header",
            "Authorization: Bearer YOUR_PERSONAL_TOKEN"
        ]
    }
}
```

### VS Code with GitHub Copilot
`.vscode/mcp.json`:
```json
{
    "mcpServers": {
        "azion": {
            "type": "http",
            "url": "https://mcp.azion.com",
            "headers": {
                "Authorization": "Bearer YOUR_PERSONAL_TOKEN"
            }
        }
    }
}
```

### Roo Coder
Similar to VS Code configuration. Requires MCP extension.

### Kiro Code  
`.kiro/settings/mcp.json`:
```json
{
    "servers": {
        "azion": {
            "url": "https://mcp.azion.com",
            "token": "YOUR_PERSONAL_TOKEN"
        }
    }
}
```

### OpenCode
`.codex/config.toml`:
```toml
[mcp.servers.azion]
type = "http"
url = "https://mcp.azion.com"
auth = "Bearer YOUR_PERSONAL_TOKEN"
```

## Development Setup

### Local Development
1. Clone the repository:
```bash
git clone https://github.com/aziontech/azion-copilot-api.git
cd azion-copilot-api/mcp
```

2. Install dependencies:
```bash
yarn install
```

3. Set environment variables:
```bash
export OPENAI_API_KEY="your_openai_key"
export MCP_COPILOT_SERVER_TOKEN="your_token"  # Optional for fast pass
```

4. Run locally:
```bash
azion dev
# Server will be available at http://localhost:3333
```

### Personal Deployment
1. Link and deploy your personal instance:
```bash
azion link
azion build --config-dir azion/personal
azion deploy --config-dir azion/personal
```

2. Configure environment variables in Azion Console:
   - Add `OPENAI_API_KEY` in your application's environment variables

3. Use your personal URL in the MCP configuration

## Testing Connection

### MCP Inspector
Use MCP Inspector to validate your connection:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Configure in Inspector as streamable-http:
# URL: https://mcp.azion.com
# Authentication: Bearer YOUR_PERSONAL_TOKEN
npx @modelcontextprotocol/inspector
```

In the Inspector interface:
1. Select "streamable-http" as transport type
2. Enter the URL: `https://mcp.azion.com` (or your environment URL)
3. Add authentication header: `Authorization: Bearer YOUR_PERSONAL_TOKEN`
4. Connect and test available tools

## Capabilities

### Documentation Search
- Platform features and products
- Code samples and libraries
- CLI commands
- API v3 and v4 endpoints
- Terraform provider

### Development Tools
- GraphQL query builder for analytics
- Rules Engine configuration generator
- Static site deployment guides
- Cache testing procedures

### Resources (MCP Resources Protocol)
For clients supporting MCP resources:
- `azion://static-site/deploy/*` - Step-by-step deployment guides
- `azion://static-site/test-cache/*` - Cache testing workflows

## Examples

### Deploy a Next.js application
```
"Help me deploy my Next.js application to Azion"
```

### Create analytics query
```
"Create a GraphQL query to show traffic by application for the last 7 days"
```

### Configure caching rules
```
"Create Rules Engine configuration for image optimization and caching"
```

### Search documentation
```
"How do I configure DDoS protection in Azion?"
```

## Support
- Documentation: https://docs.azion.com
- GitHub: https://github.com/aziontech/azion-copilot-api
- Create Personal Token: https://console.azion.com/personal-tokens

## Security Features

The MCP server implements several security measures:
- **Input Sanitization**: All inputs are sanitized to prevent injection attacks
- **Authentication**: Supports multiple auth methods (Bearer tokens, API keys)
- **ESLint Security**: Custom security rules for code quality
- **Pre-commit Hooks**: Automated security checks before commits

## Notes
- For editors requiring stdio protocol, use `mcp-remote` as a bridge
- Local development requires `OPENAI_API_KEY` for AI features
- Different environments (production/stage/local) serve different purposes - choose accordingly
- All API requests require proper authentication via Personal Token