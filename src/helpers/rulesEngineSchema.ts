import { z } from "zod";
import { RULES_ENGINE_FIREWALL_SOURCE, RULES_ENGINE_APPLICATION_SOURCE } from "./constants";

const ComparisonOperator = z.enum([
    "is equal",
    "is not equal",
    "starts with",
    "does not start with",
    "matches",
    "does not match",
    "exists",
    "does not exist",
]);

const LogicOperator = z.enum(["AND", "OR"]).nullable().describe("Logic operator for criteria groups. ONLY LEAVE IT BLANK IF YOU HAVE ONLY ONE CRITERION.");

// FIREWALL

const FirewallVariables = z.enum(["${header_accept}",
    "${header_accept_encoding}",
    "${header_accept_language}",
    "${header_cookie}",
    "${header_origin}",
    "${header_referer}",
    "${header_user_agent}",
    "${host}",
    "${network}",
    "${request_args}",
    "${request_method}",
    "${request_uri}",
    "${scheme}",
    "${ssl_verification_status}",
    "${client_certificate_validation}"])

const FirewallBehaviorType = z.enum([
    "Deny",
    "Drop",
    "Set Rate Limit",
    "Set WAF Rule Set",
    "Run Function",
    "Set Custom Response",
]).describe(`Type of behavior to be executed.
    Deny
    - It closes the request with an HTTP 403 Forbidden response. No arguments are required.
    Drop
    - It closes the request without responding to the customer. No arguments are required.
    Set Rate Limit
    - t defines an access rate limit that, if exceeded, will result in an HTTP 429 Too Many Requests response. To configure the Rate Limit, you must inform its parameters. As the Rate Limit is applied by IP address of Global and by rule, if a rule has more than one URI specified and uses the conditional Or, the rate limit will be shared between the URIs. Create different rules if you wish to have a Rate Limite for each URI.
    Set WAF Rule Set
    - It associates the WAF Rule Set to be used in the request. WAF policies must be previously configured in Libraries > WAF Rules. You must also define the WAF mode: Learning or Blocking.
    Run Function
    - It runs a function specified as a parameter. The function must have been previously instantiated and parameterized in the Functions tab in order to be used.
    Set Custom Response
    - It allows a customized response when the request matches the criteria. You can customize the Status Code by changing it from 200 to 499, the Content Type header, and Content Body of your request with a maximum of 500 characters.
    `);

const FirewallCriterion = z.object({
    variable: FirewallVariables,
    operator: ComparisonOperator,
    argument: z.string().describe("Argument for the comparison operator. If necessary, use regex to match multiple criteria. Always inform a string, even if it is an array."),
});

const FirewallCriteriaGroup = z.object({
    logic: LogicOperator,
    criteria: z.array(FirewallCriterion),
});

const RateLimitArgs = z.object({
    type: z.enum(["Req/s", "Req/min"]).describe("Type of rate limit. Req/s for requests per second and Req/min for requests per minute."),
    average_rate_limit: z.number().describe("Average rate limit. The number of requests per second"),
    limit_by: z.enum(["Client IP address", "Global"]).describe("Scope of the rate limit. if you want the access rate to be counted by the client’s IP address or Global, if you want total access rate counted."),
    maximum_burst_size: z.number().nullable().describe("Maximum burst size. which indicates the maximum burst size of HTTP requests sent simultaneously, which will be queued and dispatched gradually, respecting the limit rate. The configured value will be the Rate Limit for each Azion Node, implemented using the Leaky Bucket algorithm. It's recommended to use Maximum burst size at a maximum of 10 times of the value configured in Average Rate Limit, which would result in penalizing the last request for a burst with up to a 10 second delay."),
});

const WAFArgs = z.object({
    id: z.string(),
    mode: z.enum(["Learning", "Blocking"]),
});

const CustomResponseArgs = z.object({
    status_code: z.number().min(200).max(499),
    content_type: z.string(),
    content_body: z.string().max(500),
});

const FirewallBehavior = z.object({
    type: FirewallBehaviorType,
    args: z.union([
        RateLimitArgs,
        WAFArgs,
        CustomResponseArgs
    ]).nullable(),
});

export const FirewallRuleSchema = z.object({
    criteria: z.array(FirewallCriteriaGroup).describe('Criteria of the rule. Pay attention to the logic operators AND and OR. If necessary, use regex to match multiple criteria.').nullable(),
    behaviors: z.array(FirewallBehavior).describe(`Behaviors of the rule. It can be a simple behavior or a group of behaviors. If necessary, use regex to match multiple behaviors.While behaviors and rules are executed in the order they're arranged, some behaviors can't be stacked.If a behavior of the type Set, such as Set Custom Response in Firewall and Set Origin in Application, is added multiple times to the rules in Rules Engine, only the last behavior from the last rule in which the criteria was met will be executed. Behaviors of the type Add are cumulative and can be added multiple times to rules. This means that if Add Cookie and Add Header are executed multiple times for the same key-value pairs, multiple identical entries will be added.However, for unique headers such as Host, the last behavior of type Add Header that is executed will overwrite the previous value, since there can't be more than one Host header in a request.Some behaviors, such as Deny, can finish the execution of rules. If a sequence of rules includes such behavior, any rules or behaviors that follow this type of finalizing behavior won't be executed.`).nullable(),
    phase: z.enum(["REQUEST", "RESPONSE"]).nullable(),
    explanation: z.string().describe(`Explanation of the rule. If the user request is not permitted or it doesnt make sense, do not provide any criteria, behaviors or phase. Provide only an explanation of why this doesnt make sense, pointing to the documentation for more details: ${RULES_ENGINE_FIREWALL_SOURCE}`),
});

// APPLICATION

const ApplicationVariables = z.enum([
    "${arg_<name>}",
    "${args}",
    "${cookie_<name>}",
    "${device_group}",
    "${geoip_city_continent_code}",
    "${geoip_city_country_code}",
    "${geoip_city_country_name}",
    "${geoip_city}",
    "${geoip_continent_code}",
    "${geoip_country_code}",
    "${geoip_country_name}",
    "${geoip_region_name}",
    "${geoip_region}",
    "${host}",
    "${domain}",
    "${http_<header_name>}",
    "${remote_addr}",
    "${remote_user}",
    "${request_method}",
    "${request_uri}",
    "${request}",
    "${scheme}",
    "${sent_http_<header_name>}",
    "${status}",
    "${upstream_addr}",
    "${upstream_cookie_<name>}",
    "${upstream_cookie_}",
    "${upstream_http_<header_name>}",
    "${upstream_status}",
    "${uri}",
    "${server_addr}",
    "${server_port}",
    "${ssl_client_cert}",
    "${ssl_client_escaped_cert}",
    "${ssl_client_fingerprint}",
    "${ssl_client_i_dn}",
    "${ssl_client_s_dn_parsed}",
    "${ssl_client_s_dn}",
    "${ssl_client_serial}",
    "${ssl_client_v_end}",
    "${ssl_client_v_remain}",
    "${ssl_client_v_start}",
    "${ssl_client_verify}",
    "${tcpinfo_rtt}",
    "${remote_port}",
    "${request_body}"
]);

const ApplicationBehaviorType = z.enum([
    "Deny",
    "Run_function",
    "No_content",
    "Deliver",
    "Finish_request_phase",
    "Redirect_to_301",
    "Redirect_to_302",
    "Forward_cookies",
    "Optimize_images",
    "Set_origin",
    "Set_edge_connector",
    "Set_cache_policy",
    "Bypass_cache_phase",
    "Enable_gzip",
    "Redirect_http_to_https",
    "Set_cookie",
    "Rewrite_request",
    "Add_request_header",
    "Filter_request_header",
    "Add_response_header",
    "Filter_response_header",
    "Capture_match_groups",
    "Add_request_cookie",
    "Filter_response_cookie",
    "Filter_request_cookie"
]).describe(`
    Add cookie: 
        - Allows you to add a cookie in the Set-Cookie HTTP header. The cookie must be inputted as an argument in the format cookie-name=cookie-value. You may use a variable as a cookie value in the format cookie-name=\${arg_cookie}.
        For cookies in the Response Phase, the following Set-Cookie policies can be added to the argument, after the cookie value and separated by a semicolon (;):
        Expires=date (EEE, d MMM yyyy HH:mm
        Z)
        Domain=domain-value
        Path=path-value
        Max-age=number (TTL in seconds, takes precedence over Expires)
        SameSite=value; Secure
        HttpOnly
        Multiple policies for the same cookie can be separated by semicolons (;). For example: cookie-name=cookie-value; Domain=domain-value; Path=path-value; SameSite=value.

        You may also use variables as a cookie or policy value, for example: Path=\${uri}; Domain=\${host}
    Add header:
        - Adds a header field to the request that will be sent to the origin or to the response that will be sent to the user.
        The header field must be informed as an argument in the format Field: value.
    Bypass Cache:
        - Defines that Azion shouldn’t cache the response from its origin. The execution of this rule has no impact on the cache in the users’ browser, which must be defined using the Set Cache Policy behavior.
    Capture match groups:
        - Support behavior for handling strings. Stores in a temporary variable the result of capturing correspondence groups defined by a regex applied to one of the available HTTP request fields. This temporary variable can be referenced later in the behavior Rewrite Request to assemble the rewrite string.
        This behavior requires three arguments:
            captured array: the name you want to give to the temporary variable where the array of captured strings will be stored.
            subject: the HTTP request field where you want to capture a string.
            regex: the regular expression used to capture the strings. Each captured group must be represented in parentheses.
    Deliver: 
        - Finishes processing the request and delivers the content to the user, without executing any of the rules added later. You’re forcing the processing to end immediately.
    Deny: 
        - Delivers a 403 Forbidden page to the user. Ends the request processing.
    Enable Gzip: 
        - Enables Gzip data compression, if supported by the user’s browser.
    Filter cookie:
        - Removes a cookie from the request header that would be sent to the origin or from the response header that would be sent to the user. As an argument, add the name of the cookie you want to remove as cookie-name.
    Filter header:
        - Removes a request header that would be sent to the origin or a response header that would be sent to the user. The name of the header field must be entered as an argument,
    Finish request phase:
        - Finishes the request phase. Any behavior or other rules under this behavior won’t be executed.
    Forward cookies:
        - By using the Forward Cookies behavior, you’re determining that Azion forwards to its users the Set-Cookie header received from its origin, even when cached content is identified (HIT).
    No content (204):
        - Returns a 204 code when accessing the edge application instead of the code received from the origin.
    Optimize Images:
        - Enables Image processor
    Redirect HTTP to HTTPS:
        - Redirects HTTP requests to HTTPS.
    Redirect to:
        -Redirect to (301 Moved Permanently) and Redirect To (302 Found) redirect the user to the URL or URI entered as an argument, returning the corresponding status code.It’s recommended using these behaviors for path changes; 301 Moved Permanently for permanent changes and 302 Found for temporary changes.Both behaviors end the request processing phase.
    Rewrite Request:
        -Modifies the resource path that will be requested for the origin. You can rewrite the resource path using:
            -A string.
            -The requisition variables (which can also be used in Criteria).
            -The local variables, in the format %{name [index]}, with the result of capturing strings, when using the auxiliary behavior Capture Match Groups.
    Run function:
        - Runs a function created using Functions and instantiated in the Functions tab for the application.
    Set cache policy:
        - Assigns the cache policy that should be used for the request. You must first set up the cache policies in Cache Settings.
    Set Origin:
        -Assigns an origin that must be consulted by the edge node for the request. Before configuring this behavior, you must set up your origins using Origins.    
`);

const CaptureMatchGroupsArgs = z.object({
    captured_array: z.string().min(1).max(10),
    subject: z.string().min(4).max(50),
    regex: z.string().min(1).max(255),
});

const ApplicationBehavior = z.object({
    type: ApplicationBehaviorType,
    args: z.union([
        z.string(),
        z.number(),
        CaptureMatchGroupsArgs
    ]).nullable(),
});

const ApplicationCriterion = z.object({
    variable: ApplicationVariables,
    operator: ComparisonOperator,
    argument: z.string().describe("Argument for the comparison operator. If necessary, use regex to match multiple criteria. Always inform a string, even if it is an array."),
});

const ApplicationCriteriaGroup = z.object({
    logic: LogicOperator,
    criteria: z.array(ApplicationCriterion),
});

export const ApplicationRuleSchema = z.object({
    criteria: z.array(ApplicationCriteriaGroup).describe('Criteria of the rule. Pay attention to the logic operators AND and OR. If necessary, use regex to match multiple criteria.').nullable(),
    behaviors: z.array(ApplicationBehavior).describe(`Behaviors of the rule. It can be a simple behavior or a group of behaviors. If necessary, use regex to match multiple behaviors.While behaviors and rules are executed in the order they're arranged, some behaviors can't be stacked.If a behavior of the type Set, such as Set Custom Response in Firewall and Set Origin in Application, is added multiple times to the rules in Rules Engine, only the last behavior from the last rule in which the criteria was met will be executed. Behaviors of the type Add are cumulative and can be added multiple times to rules. This means that if Add Cookie and Add Header are executed multiple times for the same key-value pairs, multiple identical entries will be added.However, for unique headers such as Host, the last behavior of type Add Header that is executed will overwrite the previous value, since there can't be more than one Host header in a request.Some behaviors, such as Deny, can finish the execution of rules. If a sequence of rules includes such behavior, any rules or behaviors that follow this type of finalizing behavior won't be executed.`).nullable(),
    phase: z.enum(["REQUEST", "RESPONSE"]).nullable(),
    explanation: z.string().describe(`Explanation of the rule. If there is some observation or note, you can add it here. Example, if there is anything needed to be activated in order to make the rule work. Example: 'In order to make this rule work, you need to ensure that Network Lists is activated'
    If the user request is not permitted or it doesnt make sense, do not provide any criteria, behaviors or phase. Provide only an explanation of why this doesnt make sense, pointing to the documentation for more details: ${RULES_ENGINE_APPLICATION_SOURCE}`),
});

