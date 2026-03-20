/**
 * Environment configuration
 * Uses Azion args.json with production defaults
 */

// Production defaults (used when no args are provided)
const DEFAULTS = {
    SSO_URL: 'https://sso.azion.com',
    SSO_ORIGIN_URL: '',
    API_URL: 'https://api.azion.com',
    API_ORIGIN_URL: '',
    MCP_BASE_URL: 'https://mcp.azion.com',
    DATABASE_NAME: 'azioncopilot',
    EDGE_AI_URL: ''
};

// Store args from Azion runtime
let runtimeArgs: any = {};

/**
 * Initialize configuration with args from event
 * This must be called before using the config
 */
export function initializeConfig(args: any = {}) {
    runtimeArgs = args || {};
    if (process.env.DEBUG) {
        console.log('[DEBUG] Config initialized with args:', {
            SSO_URL: runtimeArgs.SSO_URL || 'using default',
            API_URL: runtimeArgs.API_URL || 'using default'
        });
    }
}

// Export configuration object
export const config = {
    get sso() {
        return {
            url: runtimeArgs.SSO_URL || DEFAULTS.SSO_URL,
            originUrl: process.env.SSO_ORIGIN_URL || runtimeArgs.SSO_ORIGIN_URL || DEFAULTS.SSO_ORIGIN_URL
        };
    },
    get api() {
        return {
            url: runtimeArgs.API_URL || DEFAULTS.API_URL,
            originUrl: process.env.API_ORIGIN_URL || runtimeArgs.API_ORIGIN_URL || DEFAULTS.API_ORIGIN_URL
        };
    },
    get baseUrl(): string {
        return process.env.MCP_BASE_URL || runtimeArgs.MCP_BASE_URL || DEFAULTS.MCP_BASE_URL;
    },
    get database() {
        return {
            name: process.env.DATABASE_NAME || runtimeArgs.DATABASE_NAME || DEFAULTS.DATABASE_NAME
        };
    },
    get edgeAi() {
        return {
            url: process.env.EDGE_AI_URL || runtimeArgs.EDGE_AI_URL || DEFAULTS.EDGE_AI_URL
        };
    }
};