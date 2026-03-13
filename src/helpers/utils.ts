
import { OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from "openai";
import { useQuery } from "azion/sql";
import { SourceFilter } from "../types";
import { config } from "../config/environment";
import { RULES_ENGINE_FIREWALL_SOURCE, RULES_ENGINE_APPLICATION_SOURCE, RULES_ENGINE_PROMPT, REAL_TIME_METRICS_SOURCE, REAL_TIME_EVENTS_SOURCE, ACCOUNTING_SOURCE, CONSUMPTION_SOURCE } from "../helpers/constants";
import { zodResponseFormat } from "openai/helpers/zod";
import { FirewallRuleSchema, ApplicationRuleSchema } from "./rulesEngineSchema";
import { rerankDocuments } from "../core/edgeai";
import { Logger } from "../helpers/logger";
import { sanitizeSQLLikePattern } from "./sanitization";

/**
 * Generates embeddings for the given query.
 * @param {string} query - The query to generate embeddings for.
 * @returns {Promise<number[]>} The embeddings array promise.
 */
async function generateQueryEmbeddings(
    query: string
): Promise<number[]> {
    const embeddingsModel = new OpenAIEmbeddings({
        model: 'text-embedding-3-small',
        verbose: false,
        apiKey: process.env.OPENAI_API_KEY
    });
    const embeddings = await embeddingsModel.embedQuery(query);
    return embeddings;
}

/**
 * Executes a hybrid search using vector and FTS.
 * @param query Query to search for.
 * @param docsAmount Number of documents to return.
 * @returns 
 */
export async function executeHybridSearch(
    query: string,
    docsAmount: number,
    collection: string,
    sourceFilter?: SourceFilter[],
    fieldsToUseOnRerank?: string[]
): Promise<any[]> {

    const { vectorQuery, queryFts } = await buildQueries(query, docsAmount, collection, sourceFilter)

    const { data, error } = await useQuery(config.database.name, [queryFts, vectorQuery])

    if (error) {
        // TODO: Should receive logger as parameter
        const logger = new Logger();
        logger.logError(`Error executing hybrid search: ${JSON.stringify(error)}`)
        return []
    }
    const mappedDocuments = mapDbResults(data)
    const rerankedDocuments = await rerankDocuments(query, mappedDocuments, fieldsToUseOnRerank)
    return rerankedDocuments.slice(0, docsAmount)
}

/**
 * Builds the queries for the hybrid search
 * @param query The query to search for
 * @param docsAmount The number of documents to return
 * @param collection The collection to search in
 * @param sourceFilter The source filter to apply
 * @returns The vector query and the FTS query
 */
async function buildQueries(
    query: string,
    docsAmount: number,
    collection: string,
    sourceFilter?: SourceFilter[]
): Promise<{ vectorQuery: string, queryFts: string }> {

    const collectionFilter = buildCollectionFilter(collection)

    const sourceFilterString = buildSourceFilter(sourceFilter)

    const vectorQuery = await buildVectorQuery(query, docsAmount, collectionFilter, sourceFilterString)

    const queryFts = buildFtsQuery(query, docsAmount, collectionFilter, sourceFilterString)

    return { vectorQuery, queryFts }
}

/**
 * Helper to map the results and de duplicate them
 * @param data data returned from SQL search
 * @param docsAmount How many documents to return
 * @returns 
 */
function mapDbResults(data: any): string[] {
    // Deduplicate by composite key keep the highest similarity
    const bestDocs = new Map<string, any>();

    for (const statementResult of data.results) {
        const { columns, rows } = statementResult;
        if (!columns || !rows) continue;
        for (const row of rows) {
            const obj: any = {};
            columns.forEach((col: string, idx: number) => {
                obj[col] = row[idx];
            });
            // Composite key for deduplication
            const key = JSON.stringify([
                obj.source
            ]);
            if (
                !bestDocs.has(key) ||
                (typeof obj.similarity === 'number' && obj.similarity > bestDocs.get(key).similarity)
            ) {
                bestDocs.set(key, obj);
            }
        }
    }

    // Sort by similarity descending
    const deliveredDocuments = Array.from(bestDocs.values()).sort(
        (a, b) => (b.similarity ?? 0) - (a.similarity ?? 0)
    );

    return deliveredDocuments;
}

/**
 * Builds the collection filter
 * @param collection The collection to filter
 * @returns The collection filter
 */
function buildCollectionFilter(collection: string) {
    return collection.includes(',') ? `collection IN ('${collection.replace(",", "','")}') AND` : `collection = '${collection}' AND`
}

/**
 * Builds the source filter
 * @param sourceFilter The source filter to apply
 * @returns The source filter
 */
function buildSourceFilter(sourceFilter?: SourceFilter[]) {
    if (!sourceFilter) return ''

    let filterString = ''

    for (const filter of sourceFilter) {
        // Sanitize the filter value to prevent SQL injection
        const sanitizedValue = sanitizeSQLLikePattern(filter.values);

        if (filter.filter === 'include') {
            filterString += `source like '%${sanitizedValue}%' AND `
        } else {
            filterString += `source not like '%${sanitizedValue}%' AND `
        }
    }
    return filterString
}

/**
 * Builds the vector query
 * @param query The query to search for
 * @param docsAmount The number of documents to return
 * @returns The vector query
 */
async function buildVectorQuery(
    query: string,
    docsAmount: number,
    collectionFilterString: string,
    sourceFilterString: string
): Promise<string> {
    const embeddedContent = await generateQueryEmbeddings(query);
    const vectorQuery = `SELECT title,
                                content,
                                source,
                        1 - vector_distance_cos(embedding, vector('[${embeddedContent}]')) AS similarity,
                        'similarity' AS search_type
                      FROM documents
                      WHERE ${collectionFilterString} ${sourceFilterString} (1 - vector_distance_cos(embedding, vector('[${embeddedContent}]'))) > 0.2
                      ORDER BY vector_distance_cos(embedding, vector('[${embeddedContent}]')) ASC
                      LIMIT ${2 * docsAmount};`
    return vectorQuery;
}

/**
 * Builds the FTS query
 * @param query The query to search for
 * @param docsAmount The number of documents to return
 * @returns The FTS query
 */
function buildFtsQuery(
    query: string,
    docsAmount: number,
    collectionFilterString: string,
    sourceFilterString: string
): string {

    const sanitizedQuery = query
        .replace(/['",.\/\\;:!?]/g, '')
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0);

    let queryParts = [];

    if (sanitizedQuery.length > 1) {

        queryParts.push(`"${sanitizedQuery.join(' ')}"`);

        queryParts.push(`NEAR(${sanitizedQuery.join(' ')}, 20)`);

        queryParts.push(sanitizedQuery.map(w => `${w}*`).join(' AND '));
    } else {

        queryParts.push(`"${sanitizedQuery[0]}" OR ${sanitizedQuery[0]}*`);
    }

    const finalQuery = queryParts.join(' OR ');

    const queryFts = `SELECT 
                            title,
                            content,
                            source,
                        CASE
                            WHEN MAX(-rank) OVER() = MIN(-rank) OVER() THEN 1
                            ELSE ((-rank) - MIN(-rank) OVER()) * 1.0 / NULLIF(MAX(-rank) OVER() - MIN(-rank) OVER(), 0)
                        END as similarity,
                        'fts' AS search_type
                        FROM document_fts
                        WHERE ${collectionFilterString} ${sourceFilterString} document_fts MATCH '${finalQuery}'
                        ORDER BY rank
                        LIMIT ${2 * docsAmount}`;

    return queryFts;
};

function buildRulesEngineQuery(useCase?: string): Record<string, string> {
    // If use case is provided, return documents for that use case
    if (useCase === 'edge_firewall') {
        return { query: `SELECT content FROM documents WHERE source = '${RULES_ENGINE_FIREWALL_SOURCE}'`, source: RULES_ENGINE_FIREWALL_SOURCE }
    }

    if (useCase === 'edge_application') {
        return { query: `SELECT content FROM documents WHERE source = '${RULES_ENGINE_APPLICATION_SOURCE}'`, source: RULES_ENGINE_APPLICATION_SOURCE }
    }

    // If no use case is provided, return all documents
    return { query: `SELECT content FROM documents WHERE source IN ('${RULES_ENGINE_FIREWALL_SOURCE}', '${RULES_ENGINE_APPLICATION_SOURCE}')`, source: RULES_ENGINE_FIREWALL_SOURCE, RULES_ENGINE_APPLICATION_SOURCE }
}

/**
 * Retrieves documents specific to Rules Engine for Applications and Firewall
 * @param useCase The use case to filter the documents. Only inform use it if the user clearly provides its needs. If you don't know, don't inform it.
 * @returns The documents
 */
export async function getSpecificDocument(useCase: string, queryBuilder: (useCase: string) => Record<string, string>): Promise<Record<string, string>> {
    const { query, source } = queryBuilder(useCase)

    const { data, error } = await useQuery(config.database.name, [query])

    if (error || !data) {
        console.error("Error executing hybrid search:", JSON.stringify(error))
        return { document: '', source: source }
    }

    const results = data.results

    const pageContent = results
        ?.flatMap(r => r.rows ?? [])
        .flatMap(row => row)
        .filter(Boolean)
        .join('\n\n');

    if (!results || !pageContent) {
        // No results found - this is normal behavior, not an error
        return { document: '', source: source }
    }
    return { document: pageContent, source: source }
}

export async function callModelForRulesEngine(modelName: string, query: string, useCase: string) {
    try {
        const { document, source } = await getSpecificDocument(useCase, buildRulesEngineQuery)

        const RuleSchema = source === RULES_ENGINE_FIREWALL_SOURCE ? FirewallRuleSchema : ApplicationRuleSchema

        const instructions = RULES_ENGINE_PROMPT.replace('{ragDocuments}', document).replace(/{source}/g, source)

        const openai = new OpenAI({})

        const completion = await openai.chat.completions.parse({
            model: modelName,
            messages: [{ role: 'system', content: instructions }, { role: 'user', content: query }],
            temperature: 0.1,
            response_format: zodResponseFormat(RuleSchema, "rule")
        })

        const rule = RuleSchema.safeParse(completion.choices[0].message.parsed)

        if (!rule.success) {
            // TODO: Should receive logger as parameter
            const logger = new Logger();
            logger.logError(`Error parsing rule: ${rule.error}`)
            throw new Error("Error parsing rule")
        }

        return rule
    } catch (error) {
        // TODO: Should receive logger as parameter
        const logger = new Logger();
        logger.logError(`Error calling model: ${error}`)
        return ''
    }
}


export function buildGraphQlQuery(endpoint?: string): Record<string, string> {
    if (endpoint === 'real-time-metrics') {
        return { query: `SELECT content FROM documents WHERE source IN ('${REAL_TIME_METRICS_SOURCE}','https://www.azion.com/en/documentation/devtools/graphql-api/queries/')`, source: REAL_TIME_METRICS_SOURCE }
    }

    if (endpoint === 'real-time-events') {
        return { query: `SELECT content FROM documents WHERE source IN ('${REAL_TIME_EVENTS_SOURCE}','https://www.azion.com/en/documentation/devtools/graphql-api/queries/')`, source: REAL_TIME_EVENTS_SOURCE }
    }

    if (endpoint === 'accounting') {
        return { query: `SELECT content FROM documents WHERE source = '${ACCOUNTING_SOURCE}'`, source: ACCOUNTING_SOURCE }
    }

    return { query: `SELECT content FROM documents WHERE source = '${CONSUMPTION_SOURCE}'`, source: CONSUMPTION_SOURCE }
}