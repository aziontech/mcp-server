import { Tool } from '../types';
import { createRagTool, createRulesEngineTool, createGraphQlTool } from './baseTools';

export const tools: Tool[] = [
    createRagTool(
        "search_azion_docs_and_site",
        "Search for information about Azion Documentation and Website based on an input query",
        `This tool provides information and assistance related to Azion's
        computing platform. Use it when users have questions about Azion, this includes:
        - Computing basics and Azion's implementation (applications, WAF, Function,
         Storage, KV, SQL, Firewall, DNS, Orchestrator, Data stream, Pulse, real-time events, real-time metrics)
        - Azion's product offerings and services
        - Use cases and applications of Azion's edge platform
        - Technical specifications and performance metrics
        - Integration with other technologies and services
        - Troubleshooting: Solutions to common issues and errors encountered on the platform.
        - Security features and compliance
        - Azion employees, persons, leadearship or company history
        Always inform your questions and the amount of documents to return.`,
        "docs, site",
        [{ filter: "exclude", values: "blog" }, { filter: "exclude", values: "agreements" }]
    ),
    createRagTool(
        "search_azion_code_samples",
        "Search for information about Azion Code Samples based on an input query",
        `Performs a search to retrieve code libraries and code samples from Azion's knowledge base
        Use it when users have questions about Azion Libraries and Code Samples, including:
        - Installation and usage of Azion client libraries
        - Implementation of various Azion services and features
        - TypeScript types and interfaces for Storage, SQL, Purge and other Azion services
        - Examples of library usage and best practices
        - Integration with Azion services via REST APIs
        - Common troubleshooting and error handling
        - Ready-to-use code examples for Azion's Computing Platform
        - Language-specific samples (JavaScript, TypeScript, etc.)
        - Samples for different use cases (e.g., serverless functions, edge applications, APIs)
        - Integration examples with third-party services
        - Debugging and troubleshooting common issues
        Inform the query and the amount of documents to return.`,
        "lib, azionsamples",
        [{ filter: "exclude", values: "blog" }]
    ),
    createRagTool(
        "search_azion_cli_commands",
        "Search for information about Azion CLI Commands based on an input query",
        `This tool provides information and assistance related to Azion's Command Line Interface (CLI).
        Use it when users have questions about Azion CLI, including:
        - Installation and setup of Azion CLI
        - Available commands and their usage
        - Authentication and configuration
        - Managing Azion resources through CLI
        - Automating tasks with Azion CLI
        - Troubleshooting common CLI issues
        - Best practices for using Azion CLI
        - CLI version information and updates
        - Integration with CI/CD pipelines
        - Examples of CLI operations
        Inform the query and the amount of documents to return.`,
        "cli",
        [{ filter: "exclude", values: "blog" }]
    ),
    createRagTool(
        "search_azion_api_v3_commands",
        "Search for information about Azion API Commands based on an input query. This is the previous version of the API, and will be deprecated, so tell the user that",
        `This tool provides information and assistance related to Azion's API V3 (the previous version of the API).
            Use it when users have questions about Azion API, including:
            - API endpoints and their usage
            - Authentication and configuration
            - Managing Azion resources through API
            - Automating tasks with Azion API
            - Troubleshooting common API issues
            - Best practices for using Azion API
            - API version information and updates
            - Integration with CI/CD pipelines
            - Examples of API operations
        Inform the query and the amount of documents to return.`,
        "APIV3",
        [{ filter: "exclude", values: "blog" }]
    ),
    createRagTool(
        "search_azion_api_v4_commands",
        "Search for information about Azion API V4 Commands based on an input query. This is the most updated version of the API.",
        `This tool provides information and assistance related to Azion's API V4 (the most updated version of the API).
            Use it when users have questions about Azion API, including:
            - API endpoints and their usage
            - Authentication and configuration
            - Managing Azion resources through API
            - Automating tasks with Azion API
            - Troubleshooting common API issues
            - Best practices for using Azion API
            - API version information and updates
            - Integration with CI/CD pipelines
            - Examples of API operations
        Inform the query and the amount of documents to return.`,
        "APIV4",
        [{ filter: "exclude", values: "blog" }]
    ),
    createRagTool(
        "search_azion_terraform",
        "Search for information about Azion Terraform Provider based on an input query",
        `Performs a search to retrieve documents from Azion's terraform provider`,
        "terraformproviderazion",
        [{ filter: "exclude", values: "blog" }]
    ),
    createRulesEngineTool(
        "create_rules_engine",
        "Create a rules engine for Applications and Firewall",
        `-> Performs a a search to retrieve documents specific to Rules Engine for Applications and Firewall.
         Usage:
            - Send your query the objective that you want to achieve with rules engine, detailing as much as possible.
            - Please provide what behavior and in which conditions this behavior should be executed inside the query.
            - On useCase, provide if it is edge_application or edge_firewall.
         To decide between both, here some differences (not exhaustive):
         - Firewall:
            Blocking a request.
            Limiting the access rate.
            Applying a Web Application Firewall (WAF) policy.
            Running a Function for Firewall with your own security code.
            Monitoring traffic to identify threats.
         - Application:
            Redirecting a request.
            Redirect from http to https
            Adding headers to the response
            Adding cookie
            Bypass Cache
            Capture Match Groups
            Deliver
            Enable Gzip
            Enforce HLS Cache
            Filter cookie
            Filter header
            Finish request phase
            Forward cookies
            Rewrite request
            Run function
            Set cache policy
            Set Origin
 
         Example: 
            query: "I want to redirect requests that point to /old to a specific URL"
            useCase: "edge_application"`
    ),
    createGraphQlTool(
        "create_graphql_query",
        "Create a GraphQL query based on the user's goal.",
        `Performs a search to retrieve documents from Azion's graphql documentation and returns a query based on the user's goal. 
        Usage: To use this tool you must:
            - Inform the query (what you want to achieve, see or understand with the query)
            - Inform the dataSource to run the query (real-time-metrics, real-time-events, accounting, consumption)
            - Always send the query in in english, lower case without special characters.  
            - Respect the schema :
                {query: string, dataSource: enum(real-time-metrics, real-time-events, accounting, consumption)}
                
        With the Real-Time Metrics GraphQL API, you can, for example:
            Investigate where security threat requests come from, including bot traffic and management (if subscribed).
            Get IPs with most requests.
            See domains with the least requests.
            Analyze the number of requests using HTTP methods.
            Consult the number of users currently connected to your live streamings.
            Find hosts with the most requests.

        With the Real-Time Events GraphQL API, you can, for example:
            View top IPs that generate most requests.
            View top URIs that receive most requests.
            See blocked requests by IP or country.
            View top user agents.
            View top IPs by request method.

        With the Accounting GraphQL API, you can, for example:
            See data related to products and its metrics being accounted in the client’s account.
        
        With the Consumption GraphQL API, you can, for example:
            See data related to products’ usage and their metrics being accounted in the client’s account.
        
        Do not send the current date in the query.`)
];