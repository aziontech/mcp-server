import { Logger } from "@/helpers/logger";
import { config } from "@/config/environment";

// TODO: Should receive logger as parameter
const logger = new Logger();

export async function rerankDocuments(
    query: string,
    documents: any[],
    fieldsToUse?: string[]
) {
    try {
        const reranker = new EdgeAiModel("baai-bge-reranker-v2-m3");

        const fields = fieldsToUse && fieldsToUse.length > 0
            ? fieldsToUse
            : ["title", "description", "metatags"];

        const documentList = documents.map((document) =>
            fields
                .map(field => (document[field] ?? ""))
                .filter(Boolean)
                .join(" ")
        );

        const rerankerInput = {
            query,
            documents: documentList
        }

        const data = await reranker.execute(rerankerInput)

        // Add relevance scores to original documents
        const documentsWithScores = documents.map((doc, index) => ({
            ...doc,
            relevance_score: data.results[index]?.relevance_score || 0
        }));

        // Sort documents by relevance_score in descending order
        return documentsWithScores.sort((a, b) => b.relevance_score - a.relevance_score);
    } catch (error) {
        if (error instanceof Error) {
            logger.logError(`Error reranking documents with status: ${error.stack}`)
        } else {
            logger.logError(`Unknown error reranking documents with status: ${JSON.stringify(error)}`)
        }
        return documents
    }
}

/**
 * EdgeAI model class
 */
class EdgeAiModel {
    model: string;
    EdgeAI: any;

    /**
     * Constructor for EdgeAiModel
     * @param model The model to use
     */
    constructor(model: string) {
        this.model = model
        this.EdgeAI = (globalThis as any).Azion?.AI
    }

    /**
     * Executes the model
     * @param input The input to the model
     * @returns The result of the model
     */
    async execute(input: any): Promise<any> {
        if (!this.EdgeAI) {
            logger.logInfo(`EdgeAI not found. Calling ${this.model} with external API.`)
            return this.executeExternalAPI(input)
        }
        logger.logInfo(`Calling ${this.model} with internal API.`)
        return this.executeInternalAPI(input)
    }

    /**
     * Executes the model with internal API, using Azion.AI.run
     * @param input The input to the model
     * @returns The result of the model
     */
    async executeInternalAPI(input: any) {
        try {
            const response = await this.EdgeAI.run(this.model, input)

            return response
        } catch (error) {
            if (error instanceof Error) {
                logger.logError(`Error calling internal API with status: ${error.stack}`)
            } else {
                logger.logError(`Unknown error calling internal API with status: ${JSON.stringify(error)}`)
            }
            logger.logInfo(`Fallback - calling ${this.model} with external API.`)
            return this.executeExternalAPI(input)
        }
    }

    /**
     * Executes the model with external API, using fetch
     * @param input The input to the model
     * @returns The result of the model
     */
    async executeExternalAPI(input: any) {
        try {
            const edgeAiUrl = config.edgeAi.url;
            if (!edgeAiUrl) {
                throw new Error('EDGE_AI_URL is not configured. Set it via environment variable or runtime args.');
            }

            const body = JSON.stringify({
                model: this.model,
                ...input
            })

            const response = await fetch(edgeAiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EDGE_AI_TOKEN}`
                },
                body
            })

            const data = await response.json()

            return data
        } catch (error) {
            if (error instanceof Error) {
                logger.logError(`Error calling external API with status: ${error.stack}`)
            } else {
                logger.logError(`Unknown error calling external API with status: ${JSON.stringify(error)}`)
            }
            throw error
        }
    }
}