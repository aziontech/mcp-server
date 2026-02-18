import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { tools } from './tools';
import { resources } from './resources';

export const getServer = (apiProfile: 'v4' | 'v3', userToken?: string) => {
    // Create an MCP server with implementation details
    const server = new McpServer({
        name: 'azion-mcp-server',
        version: '1.0.0',
    }, { 
        capabilities: { 
            logging: {},
            resources: {}  // Enable resources capability
        } 
    });

    // Register tools
    for (const tool of tools) {
        const { name, title, description, inputSchema, execute } = tool;

        if (apiProfile === 'v4' && name === 'search_azion_api_v3_commands') {
            continue;
        }

        // Tools that need user token
        const toolsNeedingToken = ['create_graphql_query'];

        // Wrap execute function for tools that need token
        let wrappedExecute = execute;
        if (toolsNeedingToken.includes(name) && userToken) {
            wrappedExecute = async (args: Record<string, any>) => {
                // Inject token into args for tools that need it
                return execute({ ...args, __userToken: userToken });
            };
        }

        // @ts-ignore
        server.registerTool(name, { title, description, inputSchema }, wrappedExecute as any);
    }

    // Register all resources
    resources(server);

    return server;
}