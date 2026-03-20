/**
 * Resources registration for MCP server
 */

import { registerCoderStaticSiteResources } from './coderStaticSiteResources';

/**
 * Register all resources with the server
 */
export function registerResources(server: any) {
    // Register static site resources
    registerCoderStaticSiteResources(server);
    
    // Future resources can be added here
    // registerOtherResources(server);
}

export { registerResources as resources };