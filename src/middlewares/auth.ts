import { RequestAuth, SSOResponse, AuthResponse, AccountInfoResponse } from "../types";
import { Logger } from "../helpers/logger";
import { config } from "../config/environment";
import { decode as decodeJWT } from "azion/jwt";

// TODO: Should receive logger as parameter instead of creating instance
const logger = new Logger();

/**
 * Constant-time string comparison to prevent timing attacks
 * Compatible with Edge Runtime environments
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
}

/**
 * 
 * @param token The provided token from the request
 * @param password The password stored in the environment variables
 * @returns An object with the authentication result
 */
export async function authenticate(authHeader?: string): Promise<AuthResponse> {

    const password = process.env.MCP_COPILOT_SERVER_TOKEN

    // If MCP token is not configured, will require proper authentication
    if (!password) {
        if (process.env.DEBUG) {
            logger.logInfo("MCP copilot token not configured - will require user authentication")
        }
    } 
    
    if (!authHeader) {
        if (process.env.DEBUG) {
            logger.logError("No authentication provided.")
        }
        return { error: { message: 'No authentication provided', status: 401 }, authenticated: false }
    }

    let token: string | undefined;
    
    if (authHeader.includes("Bearer ")) {
        const parts = authHeader.split("Bearer ");
        token = parts[1]?.trim();
    } else if (authHeader.includes("Token ")) {
        const parts = authHeader.split("Token ");
        token = parts[1]?.trim();
    } else {
        if (process.env.DEBUG) {
            logger.logError("Invalid authentication header format")
        }
        return { error: { message: 'Invalid authentication header format', status: 401 }, authenticated: false }
    }

    if (!token) {
        if (process.env.DEBUG) {
            logger.logError("No token found in authentication header")
        }
        return { error: { message: 'Invalid token', status: 401 }, authenticated: false }
    }

    // Use constant-time comparison to prevent timing attacks
    // Only allow fast pass if MCP token is configured and matches
    if (password && timingSafeEqual(token, password)) {
        if (process.env.DEBUG) {
            logger.logInfo("Fast pass token present. User authenticated.")
        }
        // For fastpass, use Azion's token as fallback for API calls
        const azionToken = process.env.AZION_TOKEN;
        return {
            error: null,
            authenticated: true,
            user: 'AI',
            apiProfile: 'v3',
            token: azionToken // Use Azion token for GraphQL and other API calls
        }
    }

    // Debug logging - only log non-fastpass tokens
    if (process.env.DEBUG) {
        logger.logInfo(`Token received: ${token.substring(0, 10)}... (length: ${token.length})`)
    }

    // Determine token type based on header format and token content
    const isBearer = authHeader.includes("Bearer ");
    const isTokenPrefix = authHeader.includes("Token ");
    
    // Check if token is an Azion Personal Token
    // Format: "azion" + 35 alphanumeric characters (total 40 chars)
    const isAzionPersonalToken = /^azion[a-zA-Z0-9]{35}$/.test(token);
    
    // Handle Bearer tokens
    if (isBearer) {
        // If token starts with "azion", it's a Personal Token sent as Bearer
        if (isAzionPersonalToken) {
            if (process.env.DEBUG) {
                logger.logInfo(`Detected Azion Personal Token (length: ${token.length})`)
            }
            return await validatePersonalToken(token);
        }
        
        // For other Bearer tokens, try JWT first, then OAuth
        // First try JWT validation for v4 API tokens
        const jwtResult = await validateJWTToken(token);
        if (jwtResult.authenticated) {
            return jwtResult;
        }
        
        // If JWT validation fails, try OAuth validation
        const oauthResult = await validateOAuthToken(token);
        if (oauthResult.authenticated) {
            return oauthResult;
        }
        
        // Both failed
        return { authenticated: false, error: { message: 'Invalid Bearer token', status: 401 } };
    }
    
    // Handle Token prefix (backwards compatibility)
    if (isTokenPrefix) {
        return await validatePersonalToken(token);
    }
    
    // Unknown token format
    if (process.env.DEBUG) {
        logger.logError("Unknown token format")
    }
    return { authenticated: false, error: { message: 'Invalid token format', status: 401 } };
}

/**
 * Validates a JWT token using the v4 API endpoint
 */
async function validateJWTToken(token: string): Promise<AuthResponse> {
    try {
        // Decode JWT using Azion library
        let decodedToken: { header: any; payload: any };
        try {
            decodedToken = decodeJWT(token);
        } catch (e) {
            if (process.env.DEBUG) {
                logger.logError(`Failed to decode JWT: ${e}`);
            }
            return { authenticated: false, error: { message: 'Invalid JWT format', status: 401 } };
        }

        const { payload } = decodedToken;

        // Check token type - reject refresh tokens
        if (payload.token_type === 'refresh') {
            if (process.env.DEBUG) {
                logger.logError('Refresh token cannot be used for authentication');
            }
            return { authenticated: false, error: { message: 'Invalid token type', status: 401 } };
        }

        // Determine token type and validation endpoint
        let validationUrl: string;
        let isOAuthToken = false;

        if (payload.client_id && payload.token_type === 'access') {
            // OAuth token - validate with SSO userinfo
            isOAuthToken = true;
            validationUrl = `${config.sso.url}/oauth/userinfo`;
        } else if (payload.account && payload.user) {
            // Azion direct JWT - validate with account endpoint
            validationUrl = `${config.api.url}/v4/account/account`;
        } else {
            // Unknown JWT structure
            if (process.env.DEBUG) {
                logger.logError('Unknown JWT structure');
            }
            return { authenticated: false, error: { message: 'Invalid JWT structure', status: 401 } };
        }

        // Validate token with appropriate endpoint
        const response = await fetch(validationUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                return { authenticated: false, error: { message: 'Invalid or expired JWT', status: 401 } };
            }
            if (process.env.DEBUG) {
                logger.logError(`JWT validation failed with status ${response.status}`);
            }
            return { authenticated: false, error: { message: 'JWT validation failed', status: response.status } };
        }

        // Extract user information from response
        const responseData = await response.json();
        let userName = 'JWT User';

        if (isOAuthToken) {
            // OAuth response structure from /oauth/userinfo
            userName = responseData.name || responseData.email || `User ${payload.sub}`;
        } else if (responseData.data) {
            // Account endpoint response structure
            userName = responseData.data.name || 'Azion User';
        } else if (payload.user) {
            // Fallback to JWT payload info if response structure unexpected
            userName = payload.user.first_name && payload.user.last_name
                ? `${payload.user.first_name} ${payload.user.last_name}`
                : payload.user.email || 'Azion User';
        }

        if (process.env.DEBUG) {
            logger.logInfo(`User authenticated via JWT (${isOAuthToken ? 'OAuth' : 'Direct'}): ${userName}`);
        }

        return {
            error: null,
            authenticated: true,
            user: userName,
            apiProfile: 'v4',
            token: token // Store token for API calls
        };

    } catch (error) {
        if (process.env.DEBUG) {
            logger.logError(`JWT validation error: ${error}`);
        }
        return { authenticated: false, error: { message: 'JWT validation error', status: 500 } };
    }
}

/**
 * Validates an OAuth token using the SSO userinfo endpoint
 */
async function validateOAuthToken(token: string): Promise<AuthResponse> {
    try {
        const url = `${config.sso.url}/oauth/userinfo`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return { authenticated: false, error: { message: 'OAuth validation failed', status: response.status } };
        }

        const data = await response.json();
        
        if (!data.sub && !data.email) {
            if (process.env.DEBUG) {
                logger.logError("No user information found in OAuth response!")
            }
            return { authenticated: false, error: { message: 'No user information found!', status: 401 } };
        }
        
        // OAuth tokens default to v4 (modern API)
        const userName = data.name || data.email || 'OAuth User';
        if (process.env.DEBUG) {
            logger.logInfo("User authenticated via OAuth.")
        }
        return { error: null, authenticated: true, user: userName, apiProfile: 'v4', token: token };
    } catch (error) {
        if (process.env.DEBUG) {
            logger.logError(`OAuth validation error: ${error}`);
        }
        return { authenticated: false, error: { message: 'OAuth validation error', status: 500 } };
    }
}

/**
 * Validates a Personal Token using the SSO API
 */
async function validatePersonalToken(token: string): Promise<AuthResponse> {
    try {
        const url = `${config.sso.originUrl}/api/user/me`;
        
        const headers: Record<string, string> = {
            'Accept': 'application/json; version=3'
        };
        
        headers.Authorization = 'Token ' + token;
        
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            if (process.env.DEBUG) {
                logger.logInfo(`Personal token authentication failed. ${response.status}`)
            }
            return { authenticated: false, error: { message: 'Authentication failed', status: response.status } };
        }

        const data = await response.json();
        const ssoData = data as SSOResponse;
        
        if (!ssoData.results.id) {
            if (process.env.DEBUG) {
                logger.logError("No account information found!")
            }
            return { authenticated: false, error: { message: 'No account information found!', status: 401 } };
        }

        const apiProfile = await getApiProfile(token);

        if (process.env.DEBUG) {
            logger.logInfo("User authenticated via Personal Token.")
        }
        const userName = ssoData.results.first_name + " " + ssoData.results.last_name;

        return { error: null, authenticated: true, user: userName, apiProfile, token: token };
    } catch (error) {
        if (process.env.DEBUG) {
            logger.logError(`Personal token validation error: ${error}`);
        }
        return { authenticated: false, error: { message: 'Personal token validation error', status: 500 } };
    }
}

async function getApiProfile(token: string): Promise<'v3' | 'v4'> {
    const url = `${config.sso.url}/api/account/info`;

    const headers: Record<string, string> = {
        'Accept': 'application/json; version=1'
    };

    headers.Authorization = 'Token ' + token;

    const response = await fetch(url, {
        method: 'GET',
        headers
    });

    const data = await response.json() as AccountInfoResponse;

    return data.client_flags.includes('block_apiv4_incompatible_endpoints') ? 'v3' : 'v4'
}
