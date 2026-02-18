import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { GQL_INTEPRETER_SYSTEM_PROMPT } from "./constants";
import { getSpecificDocument, buildGraphQlQuery, executeHybridSearch } from "./utils";
import { Logger } from "./logger";

// TODO: Should receive logger as parameter
const logger = new Logger();

export async function callModelForGraphQL(modelName: string, queryGoal: string, dataSource: string, userToken?: string) {
    try {
        const { document, source } = await getSpecificDocument(dataSource, buildGraphQlQuery)
        const docs = await executeHybridSearch(queryGoal, 5, 'graphql', [{ filter: 'include', values: 'azion-queries' }], ['content'])

        const openai = new OpenAI({})
        // Maximum number of retry attempts
        const MAX_RETRIES = 6;
        let currentAttempt = 0;
        let lastError = null;
        let introspectionInfo = null;
        let wrongGraphqlQuery = null;
        let wrongEndpoint = null;
        let messages = []
        let errorText = ""

        const endpoint = setEndpoint(dataSource)

        let promptText = `Query Goal: ${queryGoal}
                          Endpoint ${source} documentation:\n${JSON.stringify(document)}`;

        const docsText = docs.map(doc => doc.content).join('\n')

        const instructions = GQL_INTEPRETER_SYSTEM_PROMPT.replace('{USER_QUESTION}', queryGoal)

        messages.push({ role: 'system', content: instructions })
        messages.push({ role: 'system', content: promptText })
        messages.push({ role: 'system', content: `Here are some examples of queries: ${docsText}` })

        while (currentAttempt < MAX_RETRIES) {
            try {
                currentAttempt++;

                if (lastError && currentAttempt > 1) {
                    errorText = `\n\nPrevious attempt (${JSON.stringify(wrongGraphqlQuery)}) on endpoint ${wrongEndpoint} failed with error: ${JSON.stringify(lastError)}\nPlease adjust your query to fix this issue.
                    Keep in mind the query goal: ${queryGoal} and build a query to answer it
                    `;
                }

                if (introspectionInfo) {
                    errorText += introspectionInfo
                }

                messages.push({ role: 'user', content: errorText })

                // Create the interpreter model
                const completion = await openai.chat.completions.parse({
                    model: modelName,
                    // @ts-ignore
                    messages: messages,
                    temperature: 0.1,
                    response_format: zodResponseFormat(gqlSchema, "graphql")
                })

                const response = gqlSchema.safeParse(completion.choices[0].message.parsed)

                if (!response || !response.success) {
                    logger.logError(`Invalid response from interpreter:  ${response.error}`)
                    throw new Error("Invalid response from interpreter: ", response.error);
                }

                const { query: graphqlQuery, isQueryAvailable, explanation } = response.data

                // Basic validation - just check if query exists
                if (!graphqlQuery || typeof graphqlQuery !== 'string' || graphqlQuery.trim() === '') {
                    logger.logError(`Empty or invalid GraphQL query generated`);
                    throw new Error("Empty or invalid GraphQL query generated");
                }

                // Use user token
                if (!userToken) {
                    if (process.env.DEBUG) {
                        logger.logError(`No user token provided for GraphQL query`)
                    }
                    throw new Error("User authentication required for GraphQL queries");
                }

                const credential = userToken

                // Execute the GraphQL query - no sanitization needed
                // The query from OpenAI is already well-formed and JSON.stringify handles escaping
                const graphqlResponse = await gqlRequest(
                    endpoint,
                    credential,
                    JSON.stringify({ query: graphqlQuery }),
                );

                // If there was no error, return the successful result
                if (graphqlResponse.status === 200) {
                    logger.logInfo("GraphQL query executed successfully");

                    return `The query ${graphqlQuery} is a possible solution to the customer question.
                            Make sure to inform the right endpoint ${endpoint} to run it properly.
                            ${createGraphQlLink(endpoint, graphqlQuery)}`
                }

                // If the query has reached a system limit, it means that it is valid, but there is too much data and the date filter
                // should be more narrow
                if (graphqlResponse.data.detail.includes('The query has reached a system limit')) {
                    logger.logInfo("GraphQL query executed successfully");

                    return `The query ${graphqlQuery} is a possible solution to the customer question.
                            Make sure to use the right endpoint ${endpoint} to run it properly.
                            However, this query can be limited by graphql, so make
                            sure to reduce the date filter if needed.
                            ${createGraphQlLink(endpoint, graphqlQuery)}`
                }

                // If there was an error, save it for the next attempt
                lastError = graphqlResponse.data;
                wrongGraphqlQuery = graphqlQuery
                wrongEndpoint = endpoint

                logger.logError(`GraphQL error on attempt ${currentAttempt}: ${JSON.stringify(lastError)}`);
                logger.logInfo(`Endpoint: ${endpoint}`)
                logger.logInfo(`Query: ${graphqlQuery}`)

                introspectionInfo = await instrospectionSearcher(graphqlQuery, lastError.detail, endpoint, credential)
                // If this was our last attempt, throw an error to exit the loop
                if (currentAttempt >= MAX_RETRIES) {
                    logger.logError(`Failed after ${MAX_RETRIES} attempts. Last error: ${JSON.stringify(graphqlResponse.data)}`);
                    throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${JSON.stringify(graphqlResponse.data)}`);
                }

                // Wait a short time before retrying
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (attemptError) {
                lastError = attemptError;
                logger.logError(`Error on attempt ${currentAttempt}: ${attemptError}`);

                // If this was our last attempt, throw to exit the loop
                if (currentAttempt >= MAX_RETRIES) {
                    throw attemptError;
                }
            }
        }

    } catch (error) {
        logger.logError(`Error trying to validate graphql query: ${error}`);
        return `It was not possible to retrieve the requested information with GraphQL. 
      Respond that the user can use the documentation: to confirm that the information they need is available on GraphQL: https://www.azion.com/en/documentation/devtools/graphql-api/overview/`
    }
}


const gqlSchema = z.object({
    query: z.string(),
    isQueryAvailable: z.boolean(),
    explanation: z.string()
})

const setEndpoint = (endpoint: string): string => {
    if (endpoint.includes('metrics')) {
        return 'https://api.azion.com/v4/metrics/graphql';
    }
    if (endpoint.includes('events')) {
        return 'https://api.azion.com/v4/events/graphql';
    }
    if (endpoint.includes('accounting')) {
        return 'https://api.azion.com/v4/accounting/graphql';
    }
    if (endpoint.includes('consumption')) {
        return 'https://api.azion.com/v4/consumption/graphql';
    }
    throw new Error('Unknown endpoint type');
}

// Using origin endpoint to avoid CDN loop. This must be used only to fetch the data, 
// not sending to the LLM.
const setOriginEndpoint = (endpoint: string): string => {
    if (endpoint.includes('metrics')) {
        return 'https://api-origin.azionapi.net/metrics/graphql';
    }
    if (endpoint.includes('events')) {
        return 'https://api-origin.azionapi.net/events/graphql';
    }
    if (endpoint.includes('accounting')) {
        return 'https://api-origin.azionapi.net/accounting/graphql';
    }
    if (endpoint.includes('consumption')) {
        return 'https://api-origin.azionapi.net/consumption/graphql';
    }
    throw new Error('Unknown endpoint type');
}

/**
 * Executes a request to the Azion API.
 * @param {string} endpoint - The endpoint to request.
 * @param {string} credential - The API credential to use.
 * @param {string | null} body - The body of the request.
 * @returns {Promise<{status: number, data: any, error: boolean}>} A promise that resolves to the response status, data, and error flag.
 */
async function gqlRequest(
    endpoint: string,
    credential: string,
    body: string | null,
): Promise<{ status: number, data: any, error: boolean }> {
    let headers: Record<string, string> = {
        'Accept': 'application/json; version=3',
        'Content-Type': 'application/json'
    }

    // Set appropriate authorization header based on token type
    if (credential) {
        // Azion Personal Tokens: "azion" + 35 alphanumeric chars (40 total)
        const isPersonalToken = /^azion[a-zA-Z0-9]{35}$/.test(credential);

        if (isPersonalToken) {
            // Personal Tokens use "Token" prefix
            headers.Authorization = `Token ${credential}`
        } else {
            // JWTs and OAuth tokens use "Bearer" prefix
            headers.Authorization = `Bearer ${credential}`
        }
    }

    const request: RequestInit = {
        method: 'POST',
        headers
    }

    if (body) {
        request.body = body
    }


    try {
        const response = await fetch(setOriginEndpoint(endpoint), request);

        const data = await response.json();

        return {
            status: response.status,
            data: data,
            error: false
        };
    } catch (error) {
        // TODO: Should receive logger as parameter
        const logger = new Logger();
        logger.logError(`Error in GQL request: ${String(error)}`);
        return {
            status: 500,
            data: { error: String(error) },
            error: true
        };
    }
}

/**
 * Creates a link to the GraphiQl interface with the provided query.
 * @param endpoint The endpoint to use.
 * @param query The query to use.
 * @returns The link to the GraphiQl interface.
 */
function createGraphQlLink(endpoint: string, query: string) {
    const gqlProduct = endpoint.split('/')[4] + '/graphql'
    return `\n\n [Acesse sua query no GraphiQl](https://api.azion.com/v4/${gqlProduct}#query=${encodeURIComponent(query)})`;
}

function tryAnotherEndpoint(endpoint: string) {
    if (endpoint.includes('metrics')) {
        return 'https://api.azionapi.net/events/graphql'
    }
    return 'https://api.azionapi.net/metrics/graphql'
}

/**
 * 
 * @param query Query that was used
 * @param errorMessage Error message received from GraphQL API
 * @param endpoint Endpoint that was used with the query
 * @param credential Token or cookie to be used in the request
 * @returns 
 */
async function instrospectionSearcher(
    query: string,
    errorMessage: string,
    endpoint: string,
    credential: string
): Promise<string | null> {

    if (errorMessage.includes('No aggregation defined')) {
        //There is no need for introspection in this case
        return null
    }

    // if (errorMessage.includes("Cannot query field") && errorMessage.includes('on type "Query"')) {
    //     return `You are trying to query in the wrong endpoint: ${endpoint} 
    //             Choose the right endpoint for this query: ${tryAnotherEndpoint(endpoint)}`
    // }

    const introspectionQuery = instrospectionGenerator(errorMessage, query)

    if (!introspectionQuery) {
        return null
    }

    // Basic validation for introspection query
    if (!introspectionQuery || introspectionQuery.trim() === '') {
        logger.logError(`Empty introspection query`);
        return null;
    }

    // No sanitization needed - introspection queries are generated internally
    const introspectionResult = await gqlRequest(
        endpoint,
        credential,
        JSON.stringify({ query: introspectionQuery }),
    );

    if (!introspectionResult.error) {
        return "Possible types for this query are this below. Use them to fix your mistakes:\n" + JSON.stringify(introspectionResult.data)
    }

    logger.logError("Error while running introspection query")

    return null
}

/**
 * 
 * @param errorMessage Error message received from GraphQL API
 * @param query GraphQL query that was used
 * @returns 
 */
function instrospectionGenerator(
    errorMessage: string,
    query: string
): string | undefined {

    let typeName = ''
    let match = null

    if (errorMessage.includes("The query includes fields that require grouping.")) {
        //If this case, we can just forward
        return errorMessage
    }

    if (errorMessage.includes('Argument "groupBy" has invalid value')) {
        typeName = 'GroupByFields'
        match = errorMessage.match(/Expected type "([^"]+)"/);
    }

    if (errorMessage.includes('Argument "filter" has invalid value')) {
        typeName = 'Filter'
        match = errorMessage.match(/Expected type "([^"]+)"/);
    }

    if (errorMessage.includes('Did you mean "scheme"?')) {
        typeName = 'Fields'
        match = errorMessage.match(/on type "([^"]+)"/)
    }

    //If matches, it means that we have a type to search for
    if (match) {
        return replaceTypeInQuery(typeName, match[1])
    }

    //If dont, we have to build our type
    const instance = query.match(/\b(\w+)\s*\(/)

    if (instance) {
        const typePrefix = instance[1].charAt(0).toUpperCase() + instance[1].slice(1)
        const type = typePrefix + typeName
        return replaceTypeInQuery(typeName, type)
    }

    return undefined
}

/**
 * 
 * @param typeName Name of the type to run the introspection query
 * @param type Type to run the introspection query
 * @returns The correct introspecion query
 */
function replaceTypeInQuery(
    typeName: string,
    type: string
): string | undefined {

    let groupByQuery = `{
        __type(name: "{FIELD}") {
            enumValues {
                name
                }
            }
        }`

    let filterQuery = `{
        __type(name: "{FIELD}") {
            inputFields{
                name
                }
            }
        }`

    let fieldsQuery = `{
        __type(name: "{FIELD}") {
            fields{
                name
                }
            }
        }`


    switch (typeName) {
        case 'Filter':
            return filterQuery.replace('{FIELD}', type)
        case 'GroupByFields':
            return groupByQuery.replace('{FIELD}', type)
        case 'Fields':
            return fieldsQuery.replace('{FIELD}', type)
        default:
            return undefined
    }
}