# Azion MCP Server

A Model Context Protocol (MCP) server for Azion Copilot and AI assistants like Claude Code to access information about Azion Platform capabilities, helping developers with deployment, configuration, and management tasks.

## Features

This MCP server provides:

- **Resources**: Access information about Azion Platform and how to execute tasks
- **Tools**: Programmatic access to Azion service information
- **Authentication**: Personal Token for general access and Fast Pass for Azion Copilot integration
- **API Profile Support**: Users with v3 profile receive v3-specific responses and tools

## Environments

Choose the appropriate environment based on your needs:

- **Production**: `https://mcp.azion.com` (production console, main branch)
- **Stage**: `https://stage-mcp.azion.com` (stage console, dev branch)
- **Local Development**: `http://localhost:3333` (running `azion dev` locally)
- **Personal Deploy**: Your personal Azion URL after deploying with `azion deploy --config-dir azion/personal`

## Installation

### Prerequisites

- Node.js 20+
- Yarn package manager
- Azion CLI installed: [how to download](https://www.azion.com/en/documentation/products/azion-cli/overview/)
- Git

### Setup

1. Clone the repository
```bash
git clone https://github.com/aziontech/mcp-server.git
cd mcp-server
```

2. Install dependencies
```bash
yarn install
```

3. Build the server
```bash
azion build
```

## Configuration

### Environment Variables

Copy the sample environment file and fill in your values:
```bash
cp .env.sample .env
```

The following environment variables are available:

| Variable | Description | Required |
|---|---|---|
| `MCP_COPILOT_SERVER_TOKEN` | Fast pass authentication token for Azion Copilot integration | No |
| `AZION_TOKEN` | Azion API personal token ([create one here](https://console.azion.com/personal-tokens)) | Yes |
| `EDGE_AI_TOKEN` | Token for Edge AI service | No |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes (local/personal) |
| `EDGE_AI_URL` | Edge AI service endpoint URL | No |
| `API_ORIGIN_URL` | Internal API origin base URL (avoids CDN loop) | No |
| `SSO_ORIGIN_URL` | Internal SSO origin URL | No |
| `NODE_ENV` | Runtime environment (`production`, `development`) | No |

### Azion CLI Configuration

For personal development, create your own configuration directory:
```bash
# Create personal configuration directory
mkdir -p azion/personal

# Link your project
azion link

# Build with personal config
azion build --config-dir azion/personal

# Deploy with personal config
azion deploy --config-dir azion/personal
```

## Usage

### Running the Server

```bash
# Development mode (server available at http://localhost:3333)
azion dev

# Deploy to Azion Platform
azion deploy --config-dir azion/personal
```

### Testing Connection

#### MCP Inspector
Use [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to validate your connection:

```bash
npx @modelcontextprotocol/inspector
```

In the Inspector interface:
1. Select "streamable-http" as transport type
2. Enter the URL: `https://mcp.azion.com` (or your environment URL)
3. Add authentication header: `Authorization: Bearer YOUR_PERSONAL_TOKEN`
4. Connect and test available tools

### Client Configuration

See [AGENTS.md](AGENTS.md) for detailed configuration instructions for:
- Claude Code (Terminal)
- Claude Desktop
- Cursor
- Windsurf
- Warp Terminal
- VS Code with GitHub Copilot
- Kiro Code
- OpenCode

## Available Tools

- `search_azion_docs_and_site` — Provides information about Azion Platform, products, and services
- `search_azion_code_samples` — Retrieves code libraries and samples from Azion's knowledge base
- `search_azion_cli_commands` — Provides information about Azion CLI commands and usage
- `search_azion_api_v3_commands` — Provides information about Azion API v3 (previous version)
- `search_azion_api_v4_commands` — Provides information about Azion API v4 (current version)
- `search_azion_terraform` — Retrieves documents from Azion's Terraform provider
- `create_rules_engine` — Searches documentation and helps create Rules Engine configurations
- `create_graphql_query` — Searches documentation and generates GraphQL queries based on goals
- `deploy_azion_static_site` — Provides guides for deploying and testing static sites

## Available Resources

For clients supporting MCP resources:
- `azion://static-site/deploy/*` — Step-by-step deployment guides
- `azion://static-site/test-cache/*` — Cache testing workflows

## Development

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── config/
│   └── environment.ts       # Environment configuration and defaults
├── core/
│   ├── baseTools.ts         # Base tool definitions
│   ├── tools.ts             # Tool definitions and handlers
│   ├── server.ts            # MCP server setup
│   ├── edgeai.ts            # Edge AI integration
│   ├── resources.ts         # Resource definitions
│   └── coderStaticSiteResources.ts  # Static site deployment resources
├── helpers/
│   ├── constants.ts         # Application constants
│   ├── graphql.ts           # GraphQL query helpers
│   ├── logger.ts            # Logging with sanitization
│   ├── rulesEngineSchema.ts # Rules Engine schema definitions
│   ├── sanitization.ts      # Input sanitization utilities
│   └── utils.ts             # General helper functions
├── middlewares/
│   └── auth.ts              # Authentication middleware
└── types/
    └── index.ts             # TypeScript type definitions
```

### Security

The MCP server includes specific security measures:

- **Input Sanitization**: All user inputs are sanitized to prevent injection attacks
- **Log Sanitization**: Tokens and sensitive fields are masked in logs
- **Timing-Safe Comparison**: Auth token comparison prevents timing attacks
- **ESLint Security Rules** ([`.eslintrc.security.json`](.eslintrc.security.json)): Custom security linting for MCP-specific patterns
- **Pre-commit Hooks** ([`.husky/pre-commit`](.husky/pre-commit)): Automated security checks before commits
- **Authentication Validation**: Multiple auth methods with proper validation

Run security checks locally:
```bash
# Run MCP-specific security linting
yarn lint

# Run type checking
yarn type-check
```

### Extending the Server

To add new Azion functionality:

1. Add new resources in [`src/core/resources.ts`](src/core/resources.ts)
2. Add new tools in [`src/core/tools.ts`](src/core/tools.ts)
3. Update types in [`src/types/index.ts`](src/types/index.ts)

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
- GitHub: https://github.com/aziontech/mcp-server
- Create Personal Token: https://console.azion.com/personal-tokens

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
