/**
 * Environment configuration
 * Uses Azion args.json with production defaults
 */

// Production defaults (used when no args are provided)
const DEFAULTS = {
    SSO_URL: 'https://sso.azion.com',
    SSO_ORIGIN_URL: 'https://sso-origin.azion.com',
    API_URL: 'https://api.azion.com',
    DATABASE_NAME: 'azioncopilotprod5'
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
            originUrl: runtimeArgs.SSO_ORIGIN_URL || DEFAULTS.SSO_ORIGIN_URL
        };
    },
    get api() {
        return {
            url: runtimeArgs.API_URL || DEFAULTS.API_URL
        };
    },
    get database() {
        return {
            name: runtimeArgs.DATABASE_NAME || DEFAULTS.DATABASE_NAME
        };
    }
};