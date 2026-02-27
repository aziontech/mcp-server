import { v4 as uuidv4 } from 'uuid';
import { sanitizeLogData } from './sanitization';

/**
 * Logger class for MCP requests
 */
export class Logger {
    private requestId: string;
    private user: string | null;
    public apiProfile: 'v4' | 'v3';

    /**
     * Constructor for Logger
     */
    constructor() {
        this.requestId = uuidv4();
        this.user = null
        this.apiProfile = 'v4' // Here the user that has the flag for API-V3 is marked
        if (process.env.DEBUG) {
            console.log(`[Request Initiated] ID: ${this.requestId}`);
        }
    }

    public setUser(userConfig: any) {
        const userName = userConfig.user
        const apiProfile = userConfig.apiProfile
        if (!this.user) {
            this.user = userName
            this.apiProfile = apiProfile
            if (process.env.DEBUG) {
                console.log(`[${this.requestId}] User: ${userName} - API Profile: ${apiProfile}`)
            }
            this.requestId = this.requestId + ` - ${userName}`
        }
    }

    public logRequest(method: string, path: string, body: any): void {
        if (process.env.DEBUG) {
            console.log(`[${this.requestId}] Request Received: ${method} ${path}`);
            if (body && body.method) {
                console.log(`[${this.requestId}] Tool Requested: ${body.method}`);
                // Sanitize sensitive data before logging
                const sanitizedParams = sanitizeLogData(body.params);
                console.log(`[${this.requestId}] Request Payload: ${JSON.stringify(sanitizedParams, null, 2)}`);
            } else {
                // Sanitize sensitive data before logging
                const sanitizedBody = sanitizeLogData(body);
                console.log(`[${this.requestId}] Request Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
            }
        }
    }

    public logError(error: unknown): void {
        if (error instanceof Error) {
            // Sanitize error message to avoid exposing sensitive data
            const sanitizedMessage = sanitizeLogData(error.message);
            console.error(`[${this.requestId}] Error: ${sanitizedMessage}`);
            if (error.stack && process.env.NODE_ENV === 'development') {
                // Only show stack traces in development
                console.error(`[${this.requestId}] Stack: ${error.stack}`);
            }
        } else {
            // Sanitize error object before logging
            const sanitizedError = sanitizeLogData(error);
            console.error(`[${this.requestId}] An unexpected error occurred: ${JSON.stringify(sanitizedError)}`);
        }
    }

    public logInfo(message: string): void {
        if (process.env.DEBUG) {
            console.log(`[${this.requestId}] INFO: ${message}`);
        }
    }
}

// Export only the class, not a global instance
// Each request should create its own logger instance