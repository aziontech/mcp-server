/**
 * Security sanitization utilities
 */

/**
 * Sanitizes SQL LIKE pattern input to prevent SQL injection
 * @param input The input string to sanitize for SQL LIKE operations
 * @returns Sanitized string safe for SQL LIKE patterns
 */
export function sanitizeSQLLikePattern(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    // Escape special SQL LIKE wildcards and quotes
    return input
        .replace(/'/g, "''")     // Escape single quotes
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/%/g, '\\%')    // Escape percent wildcard
        .replace(/_/g, '\\_')    // Escape underscore wildcard
        .replace(/\[/g, '\\[')   // Escape bracket
        .replace(/]/g, '\\]');   // Escape bracket
}

/**
 * Sanitizes log data to prevent exposure of sensitive information
 * @param data The data to sanitize for logging
 * @returns Sanitized data safe for logging
 */
export function sanitizeLogData(data: any): any {
    if (!data) return data;
    
    // List of sensitive field names to mask
    const sensitiveFields = [
        'password', 'token', 'secret', 'apikey', 'api_key',
        'authorization', 'auth', 'credential', 'private',
        'access_token', 'refresh_token', 'bearer'
    ];
    
    if (typeof data === 'string') {
        // Mask potential tokens in strings
        return data.replace(/Bearer\s+[\w\-\.]+/gi, 'Bearer [REDACTED]')
                   .replace(/Token\s+[\w\-\.]+/gi, 'Token [REDACTED]');
    }
    
    if (typeof data !== 'object') {
        return data;
    }
    
    // Clone the object to avoid modifying the original
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key in sanitized) {
        if (sanitized.hasOwnProperty(key)) {
            const lowerKey = key.toLowerCase();
            
            // Check if this field should be masked
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                // Recursively sanitize nested objects
                sanitized[key] = sanitizeLogData(sanitized[key]);
            } else if (typeof sanitized[key] === 'string') {
                // Check for patterns in string values
                sanitized[key] = sanitized[key]
                    .replace(/Bearer\s+[\w\-\.]+/gi, 'Bearer [REDACTED]')
                    .replace(/Token\s+[\w\-\.]+/gi, 'Token [REDACTED]');
            }
        }
    }
    
    return sanitized;
}

