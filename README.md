# Azion MCP Server

A Model Context Protocol (MCP) server for Azion Copilot and AI assistants like Claude Code to access information about Azion Platform capabilities, helping developers with deployment, configuration, and management tasks.

## Features

This MCP server provides:

- **Resources**: Access information about Azion Platform and how to execute some tasks
- **Tools**: Programmatic access to Azion service information 
- **Prompts**: Pre-configured prompts for common Azion development scenarios
- **Authentication**: Personal Token for general access and Fast Pass for Azion Copilot integration
- **API Profile Support**: Users with v3 profile receive v3-specific responses and tools

## Installation

### Prerequisites

- Node.js 20+
- Yarn package manager
- Azion CLI installed: [how to download](https://www.azion.com/en/documentation/products/azion-cli/overview/)
- Git

### Setup

1. Clone the repository
```bash
git clone https://github.com/aziontech/azion-copilot-api.git
cd azion-copilot-api/mcp
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

### Azion CLI Configuration

The project includes two configuration directories:
- `azion/production` - Production environment configuration
- `azion/stage` - Stage environment configuration

For personal development, create your own configuration:
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

### Environment Variables

```bash
# Option 1: Fast pass authentication (for Azion Copilot integration)
export MCP_COPILOT_SERVER_TOKEN=your_fast_pass_token

# Option 2: Use Azion Personal Token for development
# Create token at: https://console.azion.com/personal-tokens
```

## Usage

### Running the server

```bash
# Development mode
azion dev

# Deploy to Azion Platform
azion deploy --config-dir azion/personal
```

### Testing

```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector node build/index.js
```

## Available Tools

- `search_azion_docs_and_site` - Provides information about Azion Platform, products, and services
- `search_azion_code_samples` - Retrieves code libraries and samples from Azion's knowledge base
- `search_azion_cli_commands` - Provides information about Azion CLI commands and usage
- `search_azion_api_v3_commands` - Provides information about Azion API v3 (previous version)
- `search_azion_api_v4_commands` - Provides information about Azion API v4 (current version)
- `search_azion_terraform` - Retrieves documents from Azion's Terraform provider
- `create_rules_engine` - Searches documentation and helps create Rules Engine configurations
- `create_graphql_query` - Searches documentation and generates GraphQL queries based on goals
- `deploy_azion_static_site` - Provides guides for deploying and testing static sites

## Available Resources

- Static Site Deployment Guides (step-by-step workflows)
- Cache Testing Procedures (comprehensive validation)

## Development

### Project Structure

- `src/core/` - Core functionality
  - `tools.ts` - Tool definitions
  - `server.ts` - Azion-specific tools
- `src/index.ts` - Main entry point
- `src/middlewares/auth.ts` - Authentication middleware
- `src/helpers/utils.ts` - Helper functions

### Security

The MCP module includes specific security measures:

- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **ESLint Security Rules** (`.eslintrc.security.json`): Custom security linting for MCP-specific patterns
- **Pre-commit Hooks** (`.husky/pre-commit`): Automated security checks before commits
- **Authentication Validation**: Multiple auth methods with proper validation

Run security checks locally:
```bash
# Run MCP-specific security linting
npm run lint

# Run type checking
npm run type-check

# Run all tests including security validations
npm test
```

### Extending the server

To add new Azion functionality:

1. Create new service methods in `src/core/services`
2. Add new resources in `src/core/resources.ts`
3. Add new tools in `src/core/tools.ts`
4. Add new prompts in `src/core/prompts.ts`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
