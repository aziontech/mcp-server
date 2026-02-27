import { ZodRawShape, ZodType, ZodTypeDef, ZodOptional } from 'zod'

/**
 * Interface for a tool that uses the Model Context Protocol (MCP) to retrieve documents from a knowledge base.
 */
export interface McpRagTool {
    name: string;
    title: string;
    description: string;
    inputSchema: ZodRawShape;
    execute: (args: Record<string, any>) => Promise<RagToolResponse>;
}

/**
 * Represents a generic tool for the MCP server.
 */
export interface McpTool {
    name: string;
    title: string;
    description: string;
    inputSchema: ZodRawShape;
    execute: (params: any) => Promise<any>;
}

export type Tool = McpTool | McpRagTool;

/**
 * Type definition for prompt arguments, matching MCP SDK's PromptArgsRawShape
 */
export type PromptArgsRawShape = {
    [k: string]: ZodType<string, ZodTypeDef, string> | ZodOptional<ZodType<string, ZodTypeDef, string>>;
};

/**
 * Interface for MCP Prompts
 */
export interface McpPrompt {
    name: string;
    title: string;
    description: string;
    inputSchema: PromptArgsRawShape;
}

type RagToolResponse = {
    content: {
        type: 'text';
        text: string;
    }[]
}

export type SourceFilter = {
    filter: 'include' | 'exclude';
    values: string;
}

/**
 * Interface representing the authentication request.
 */
export interface RequestAuth {
    urlAuthenticate: string,
    options: RequestInit
}

export interface SSOResponse {
    results: {
        id: string,
        first_name: string,
        last_name: string
    }
}

export interface AccountInfoResponse {
    client_flags: string[]
}

export type AuthResponse = SuccessAuthResponse | FailedAuthResponse;

interface SuccessAuthResponse {
    error: null;
    authenticated: true;
    user: string;
    apiProfile: 'v4' | 'v3';
    token?: string;
}

interface FailedAuthResponse {
    error: { message: string, status: number };
    authenticated: false;
}