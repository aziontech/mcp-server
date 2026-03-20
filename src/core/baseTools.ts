import { z } from 'zod';
import { McpTool, McpRagTool } from '../types';
import { executeHybridSearch, callModelForRulesEngine } from "@/helpers/utils";
import { SourceFilter } from "@/types";
import { callModelForGraphQL } from "@/helpers/graphql";
import { Logger } from "@/helpers/logger";
import { sanitizeLogData } from "@/helpers/sanitization";

// TODO: Should receive logger as parameter
const logger = new Logger();

/**
 * Creates a base tool for hybrid search
 * @param {string} name The name of the tool
 * @param {string} title The title of the tool
 * @param {string} description The description of the tool
 * @param {string} collection The collection to search in.
 *  - docs: Azion Functions
 *  - site: Azion Site
 *  - graphl: Azion GraphQL
 *  - useCases: Azion Use Cases
 * @param {string[]} sourceFilter The source filter to apply to the source of the document
 * @returns The tool
 */
export function createRagTool(
    name: string,
    title: string,
    description: string,
    collection: string,
    sourceFilter?: SourceFilter[]
): McpRagTool {
    return {
        name,
        title,
        description,
        inputSchema: {
            query: z.string().describe("Query to search documents. Usually a keyword or small phrases with the topic you want to search."),
            docsAmount: z.number().optional().describe("Number of documents to return. Only inform use it if the user provides a value. Default is 5.").default(5)
        },
        execute: async (args: Record<string, any>) => {
            if (process.env.DEBUG) {
                logger.logInfo(`Executing tool ${name} with args: ${JSON.stringify(sanitizeLogData(args))}`)
            }
            const data = await executeHybridSearch(args.query, args.docsAmount ?? 5, collection, sourceFilter);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            };
        }
    }
}

/**
 * Creates a tool for retrieving documents specific to Rules Engine for Applications and Firewall
 * @param name The name of the tool
 * @param title The title of the tool
 * @param description The description of the tool
 * @returns The tool
 */
export function createRulesEngineTool(
    name: string,
    title: string,
    description: string): McpTool {

    return {
        name,
        title,
        description,
        inputSchema: {
            query: z.string().optional().describe("Query to detail what you want to do with rules engine. Please provide what behavior and in which conditions this behavior should be executed."),
            useCase: z.enum(["edge_application", "edge_firewall", ""]).describe("Use case to filter the documents. Only inform use it if the user clearly provides its needs. If you don't know, don't inform it.")
        },
        execute: async (args: Record<string, any>) => {
            try {
                if (process.env.DEBUG) {
                logger.logInfo(`Executing tool ${name} with args: ${JSON.stringify(sanitizeLogData(args))}`)
            }

                const response = await callModelForRulesEngine('gpt-4.1', args.query, args.useCase)

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(response, null, 2)
                        }
                    ]
                };
            } catch (error) {
                logger.logError(`Error calling RulesEngineTool:  ${error}`)
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(error, null, 2)
                        }
                    ]
                };
            }
        }
    }
}

/**
 * Creates a tool for building GraphQL queries. it searches on the database, builds the query and has 5 attempts to build a valid query.
 * @param name The name of the tool
 * @param title The title of the tool
 * @param description The description of the tool
 * @returns The tool
 */
export function createGraphQlTool(name: string, title: string, description: string): McpTool {
    return {
        name,
        title,
        description,
        inputSchema: {
            query: z.string().describe(`Goal of the GraphQL query that is going to be built. Detail as much as possible so that the model can build a query that answers the user's question. 
        Highlight, if informed:
            - Intended data
            - Filters
            - Aggregations
        Example1: A query to list every request made to all my edge applications grouped by status code and with a filter to only show requests made in the last 24 hours.
        Example2: I want to see how much data was transferred for requests made from the US `),
            dataSource: z.enum(['real-time-metrics', 'real-time-events', 'accounting', 'consumption']).describe(`
            Endpoint to run the query. Only inform use it if the user clearly provides its needs.
            If you don't know, don't inform it. Use the instructions to decide between the endpoints`),
        },
        execute: async (args: Record<string, any>) => {
            try {
                if (process.env.DEBUG) {
                logger.logInfo(`Executing tool ${name} with args: ${JSON.stringify(sanitizeLogData(args))}`)
            }

                const userToken = args.__userToken;
                delete args.__userToken; // Remove from args to avoid sending to model
                const query = await callModelForGraphQL("gpt-4.1", args.query, args.dataSource, userToken);

                return {
                    content: [
                        {
                            type: "text",
                            text: query
                        }
                    ]
                };
            } catch (error) {
                logger.logError(`Error calling GraphQLTool:  ${error}`)
                return {
                    content: [
                        {
                            type: "text",
                            text: "It was not possible to build the query. Please try again. You can consult the documentation for more information: https://www.azion.com/en/documentation/devtools/graphql-api/"
                        }
                    ]
                };
            }
        }
    }
}
