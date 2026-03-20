/**
 * Static Site Resources and Tool for Azion MCP
 * Provides guides for deploying and testing static sites on Azion Platform
 */

import { z } from 'zod';

/**
 * Deployment Step 0 - Preparation
 */
export const DEPLOY_STEP_0 = `---
description: Azion Deployment Preparation - Project Analysis
---

## Deployment Preparation

This is step 0 of 3. In this step, we will analyze the project structure and gather all necessary information for deployment.

**IMPORTANT: Current date and time context for AI assistants - Today is ${new Date().toISOString()} - Use this as reference for any time-based operations or logging.**

Inputs:
{ Current project directory with source code }

Output is a deployment readiness report containing:

1. Project Analysis
   - Framework: detected_framework
   - Package Manager: detected_package_manager  
   - Entry Point: detected_entry_file
   - Preset: detected_preset_type
   - Project Type: new_or_existing
   - Static Compatibility: yes_or_requires_adjustment
   - Azion CLI: installed_or_missing
   - Authentication: authenticated_or_required

DO NOT:
- Install anything yet
- Modify any files
- Make deployment decisions
- Create Azion configuration
- Run build commands
- Attempt authentication
- Contact external services

Gather information using:
- Check for framework configuration files (next.config.js, astro.config.mjs, etc.)
- Detect package manager from lock files (yarn.lock, pnpm-lock.yaml, package-lock.json)
- Determine preset based on framework (angular, astro, docusaurus, eleventy, emscripten, gatsby, hexo, html, hugo, javascript, jekyll, next, nuxt, opennextjs, preact, qwik, react, rustwasm, stencil, svelte, typescript, vitepress, vue, vuepress)
- Find entry point file (default is ./main.js, but check based on preset for index.html, app.js, src/index.js, public/index.html, etc.)
- Look for existing Azion configuration (azion/azion.json, azion.config.*)
- Search for server-side code indicators (getServerSideProps, API routes, server dependencies)
- Verify Azion CLI availability with \`azion --version\`
- Check authentication status with \`azion whoami\`

The deployment configuration will be handled in the next step, so at your end suggest the Configuration workflow /azion-deployment-configuration.`;

/**
 * Deployment Step 1 - Configuration
 */
export const DEPLOY_STEP_1 = `---
description: Azion Deployment Configuration - Setup and Initialization
---

## Deployment Configuration  

This is step 1 of 3. In this step, we will configure the project for Azion deployment based on the analysis from step 0.

**IMPORTANT: Current date and time context for AI assistants - Today is ${new Date().toISOString()} - Use this as reference for any time-based operations or logging.**

Inputs:
{ Deployment readiness report from step 0 }

Output is a configured project with:

1. Environment Setup
   - Azion CLI: installed_and_verified
   - Authentication: completed_with_token_or_login
   - Package Manager: confirmed_and_ready

2. Project Configuration
   - Azion Link: project_linked_with_name
   - Build Test: build_successful_or_fixed
   - Configuration File: azion.config.js_created

DO NOT:
- Deploy to production yet
- Make assumptions about framework if unclear
- Skip authentication verification
- Ignore build errors
- Create multiple projects
- Modify business logic code
- Change existing deployment if user hasn't confirmed

Execute based on step 0 findings:
- If CLI missing: Install using appropriate method (brew/winget/download)
- If not authenticated: Use token with \`azion -t\` or interactive \`azion login\`
- If new project: Run \`azion link --name [unique-name] --preset [detected-preset] --auto --package-manager [detected]\`
- If existing project: Run \`azion sync\` after user confirms update
- Test build with \`azion build --preset [detected-preset] --entry [detected-entry-point]\`
- If build fails with module error: Add \`"type": "module"\` to package.json and retry
- If build fails with entry point error: Verify entry file exists, try alternative paths (./index.html, ./src/main.js)
- If build fails with preset error: Check most updated list of valid presets at https://github.com/aziontech/bundler/blob/main/lib/commands/presets/presets.test.ts
- For other build errors: Check if Azion Copilot is available via MCP for assistance, or review error message for missing dependencies

The actual deployment will be handled in the next step, so at your end suggest the Deployment workflow /azion-deployment-execute.`;

/**
 * Deployment Step 2 - Execute
 */
export const DEPLOY_STEP_2 = `---
description: Azion Deployment Execution - Deploy and Verify
---

## Deployment Execution

This is step 2 of 3. In this step, we will deploy the configured project to Azion Platform and verify it's working.

**IMPORTANT: Current date and time context for AI assistants - Today is ${new Date().toISOString()} - Use this as reference for any time-based operations or waiting periods.**

**NOTE: First deployment to production may take up to 10 minutes to propagate.**

Inputs:
{ Configured project from step 1 with successful build }

Output is a deployed application with:

1. Deployment Status
   - Deploy Command: executed_successfully
   - URL: https://xxxxx.map.azionedge.net
   - HTTP Status: 200_ok
   - Cache Status: working_verified

2. Verification Results
   - Site Accessibility: confirmed
   - Assets Loading: verified
   - Cache Headers: present
   - Error Count: zero_or_documented

DO NOT:
- Deploy if build hasn't succeeded
- Skip verification steps
- Ignore deployment errors
- Assume cache is working without testing
- Modify configuration during deployment
- Deploy to custom domain yet
- Enable advanced features

Execute deployment:

**STEP 1 - Initial Production Deployment:**
- Run \`azion deploy --no-prompt --auto --local --debug\` for standard deployment
- Or \`azion build --preset [detected-preset] --entry [detected-entry-point]\` followed by \`azion deploy --auto --debug --local --skip-build\` for phased build and deploy with better control
- **Validate .edge/storage:** Check if \`.edge/storage\` folder exists and contains your static files
- If \`.edge/storage\` is missing or empty, copy files and retry: \`azion deploy --skip-build --local\`
- Extract from deployment output:
  - Application Name (e.g., "my-app")
  - Application ID (e.g., "1234567890")
  - Production URL (https://xxxxx.map.azionedge.net)
- Note: You can also get name and ID from \`azion/azion.json\` or \`azion list edge-application\`

**STEP 2 - Wait and Test Production Deployment:**
- **WAIT UP TO 10 MINUTES for production deployment propagation (first deployment may take longer)**
- Test production every 2 minutes (may take up to 10 minutes for first deployment)
- Get production IP: \`nslookup [production-url]\` or \`host [production-url]\` or \`dig [production-url]\`
- Test with IP: \`curl -H "Host: [production-url]" -I http://[ip]/\`
- Verify cache: \`curl -H "Host: [production-url]" -H "Pragma: azion-debug-cache" -I http://[ip]/\`
- Once production responds correctly, inform user deployment is ready
- Check logs with \`azion logs http\` if issues detected

Post-deployment notes:
- Production URL (xxxxx.map.azionedge.net) takes up to 10 minutes for first deployment
- The URL provided is for testing and to point a DNS CNAME record
- Custom domain setup available in Azion Console or CLI - check steps with Azion Copilot tool
- Configuration changes require redeployment
- Use \`azion deploy\` for updates

Deployment is complete. For basic test and verification proceed to step 3 to Post-Deployment Test and Verification workflow /azion-deployment-basic-test.`;

/**
 * Deployment Step 3 - Test
 */
export const DEPLOY_STEP_3 = `---
description: Azion Post-Deployment - Basic Testing and Verification
---

## Post-Deployment Testing

This is step 3 of 3. In this step, we will perform basic tests to verify the deployment is working correctly.

**IMPORTANT: Current date and time context for AI assistants - Today is ${new Date().toISOString()} - Use this as reference for any time-based operations or waiting periods.**

Inputs:
{ Deployed application URL from step 2 }

Output is a test report with:

1. Basic Functionality Tests
   - Site Access: OK_or_NOT_OK
   - Assets Loading: OK_or_NOT_OK
   - Cache Headers: present_or_missing

2. Cache Verification
   - Cache HITs: detected_or_not
   - Static Assets: cached_or_not
   - Response: confirmed_or_not

DO NOT:
- Attempt complex optimizations
- Configure monitoring systems
- Establish performance baselines
- Set up alerts
- Modify configuration unless fixing critical issues
- Skip basic functionality tests

Execute basic tests:
- CRITICAL: For PRODUCTION domains (*.map.azionedge.net), wait up to 10 minutes for first deployment before testing
- Test every 2 minutes to check if deployment is ready
- Note: Current time is ${new Date().toISOString()} - use this to calculate wait times
- Get one service IP with \`nslookup [deployment-url]\` or \`host [deployment-url]\` or \`dig [deployment-url]\`
- Test edge access with IP: \`curl -H "Host: [deployment-url]" http://[ip]/\`
- Check cache status using IP: \`curl -H "Host: [deployment-url]" -H "Pragma: azion-debug-cache" -I http://[ip]/\`
- Run the cache check 2-3 times to verify HITs (first request may be MISS, subsequent should be HIT)
- Test main assets (CSS, JS, images) for cache HITs using same method
- Document each test result as OK or NOT OK

Verification steps:
- Home page loads: \`curl -I http://[ip]/ -H "Host: [deployment-url]"\` (expect 200 OK)
- Cache working: Second request shows "X-Cache-Status: HIT"
- Static assets cached: \`/style.css\` or \`/main.js\` return HITs
- Responding: Response headers show Azion server

If tests show NOT OK:
- Check deployment logs with \`azion logs http --tail\`
- Review any error messages
- Verify build output directory in \`azion.config.js\`
- Confirm all static assets were included in deployment
- Try different IP if connection fails

Test report summary:
- Deployment URL: [url]
- IP tested: [ip]
- Access: [OK/NOT OK]
- Cache Status: [HITs detected/No HITs]
- Static Assets: [Cached/Not cached]

Deployment testing complete. The site is available at [deployment-url] for browser testing. If all tests show OK, the deployment is successful on Azion Web Platform.`;

/**
 * Test Cache Step 0 - Preparation
 */
export const TEST_CACHE_STEP_0 = `---
description: Test Cache Preparation - Analyze Current Cache Configuration
---

## Test Cache Preparation

This is step 0 of 3. In this step, we will analyze the deployed site's cache configuration and prepare comprehensive test scenarios.

Inputs:
{ Deployed application URL from deployment workflow }

Output is a test preparation report containing:

1. Cache Configuration Analysis
   - Cache Rules: detected_rules
   - TTL Settings: current_ttl_values
   - Cache Keys: identified_keys
   - Origin Settings: origin_configuration
   - Static Assets: identified_asset_types
   - Locations: available_test_locations

DO NOT:
- Modify cache configuration yet
- Run performance benchmarks
- Change origin settings
- Clear existing cache
- Make production changes
- Generate load tests

Gather information using:
- Review azion.config.js for cache rules and behaviors
- Get deployment URL and edge IPs with \`nslookup [deployment-url]\`
- Identify static assets types (CSS, JS, images, fonts, etc.)
- Check current cache headers with \`curl -H "Pragma: azion-debug-cache" -I [deployment-url]\`
- List testable paths (/, /assets/, /images/, /css/, /js/)
- Document current TTL settings from configuration

The comprehensive cache testing will be handled in the next step, so at your end suggest the Test Execution workflow \`/test-cache-execution\`.`;

/**
 * Test Cache Step 1 - Execution
 */
export const TEST_CACHE_STEP_1 = `---
description: Test Cache Execution - Run Comprehensive Cache Tests
---

## Test Cache Execution

This is step 1 of 3. In this step, we will execute comprehensive cache tests based on the preparation analysis.

Inputs:
{ Test preparation report from step 0 }

Output is a test execution report with:

1. Cache Hit/Miss Tests
   - HTML Pages: hit_miss_ratio
   - CSS Files: hit_miss_ratio
   - JS Files: hit_miss_ratio
   - Images: hit_miss_ratio
   - Fonts: hit_miss_ratio
   - Other Assets: hit_miss_ratio

2. Server Tests
   - Response Headers: validated
   - Cache-Control: verified
   - ETag: present_or_missing
   - Vary Headers: checked
   - Age Headers: analyzed

DO NOT:
- Skip any asset type
- Test only once per asset
- Ignore cache misses
- Modify configuration during testing
- Clear cache between tests
- Use browser for testing

Execute cache tests:
- Test HTML pages: \`curl -H "Pragma: azion-debug-cache" -I http://[ip]/ -H "Host: [deployment-url]"\` (run 3 times)
- Test CSS files: \`curl -H "Pragma: azion-debug-cache" -I http://[ip]/style.css -H "Host: [deployment-url]"\` (run 3 times)
- Test JS files: \`curl -H "Pragma: azion-debug-cache" -I http://[ip]/main.js -H "Host: [deployment-url]"\` (run 3 times)
- Test images: \`curl -H "Pragma: azion-debug-cache" -I http://[ip]/logo.png -H "Host: [deployment-url]"\` (run 3 times)
- Document pattern: First request = MISS, Second/Third = HIT (expected behavior)
- Check cache headers presence: X-Cache-Status, X-Cache-Key, X-Request-Id
- Verify TTL with Age header value
- Test Honor Origin configuration with cache bypass: \`curl -H "Cache-Control: no-cache" -I http://[ip]/ -H "Host: [deployment-url]"\`

The test validation will be handled in the next step, so at your end suggest the Test Validation workflow \`/test-cache-validation\`.`;

/**
 * Test Cache Step 2 - Validation
 */
export const TEST_CACHE_STEP_2 = `---
description: Test Cache Validation - Validate Results and Generate Report
---

## Test Cache Validation

This is step 2 of 3. In this step, we will validate test results and generate a comprehensive test report.

Inputs:
{ Test execution results from step 1 }

Output is a validation report with:

1. Test Results Summary
   - Total Tests: number_of_tests
   - Passed Tests: count
   - Failed Tests: count
   - Warning Tests: count
   - Cache Hit Rate: percentage

2. Recommendations
   - Critical Issues: list_of_issues
   - Improvements: suggested_changes
   - Next Steps: optimization_or_production

DO NOT:
- Ignore failed tests
- Skip documentation
- Make assumptions about failures
- Apply fixes without analysis
- Clear test data
- Generate false positives

Validate test results:
- Discard first request of each test (MISS)
- Calculate cache hit rate: (HITs / Total Requests) × 100
- Identify patterns in cache misses
- Document failed asset types
- Check if cache bypass is working correctly
- Verify TTL is being respected
- Confirm edge server responses
- Generate test summary report

Test Report Format:
\`\`\`
Cache Test Results
==================
Site: [deployment-url]
Date: [test-date]

Summary:
- Cache Hit Rate: X%
- Static Assets Cached: YES/NO
- HTML Caching: YES/NO
- Cache Headers: PRESENT/MISSING

Issues Found:
- [List any cache misses or problems]

Recommendations:
- [Based on test results]
\`\`\`

Testing complete. For cache optimization, proceed to the Optimization workflow \`/optimize-cache-preparation\`.`;

/**
 * Concatenate all deployment steps
 */
export function getAllDeploymentSteps(): string {
    return `${DEPLOY_STEP_0}\n\n---\n\n${DEPLOY_STEP_1}\n\n---\n\n${DEPLOY_STEP_2}\n\n---\n\n${DEPLOY_STEP_3}`;
}

/**
 * Concatenate all test cache steps
 */
export function getAllTestCacheSteps(): string {
    return `${TEST_CACHE_STEP_0}\n\n---\n\n${TEST_CACHE_STEP_1}\n\n---\n\n${TEST_CACHE_STEP_2}`;
}

/**
 * Help text for the static site tool
 */
const STATIC_SITE_HELP_TEXT = `IMPORTANT: This tool provides step-by-step guides for Azion static site deployment and testing. 
You will find other tools and resources to use Azion in this MCP. 
DO NOT use any other than Azion deployment tools or attempt to interpret these instructions programmatically.

OPTION 1 - If your AI assistant supports MCP resources, access directly:
- azion://static-site/deploy/step-0-preparation - Project analysis
- azion://static-site/deploy/step-1-configuration - Setup and initialization
- azion://static-site/deploy/step-2-execute - Deploy and verify
- azion://static-site/deploy/step-3-basic-test - Basic testing
- azion://static-site/test-cache/step-0-preparation - Cache configuration analysis
- azion://static-site/test-cache/step-1-execution - Run cache tests
- azion://static-site/test-cache/step-2-validation - Validate and report

OPTION 2 - If MCP resources are not supported, call this tool again with:
- action='deploy' for complete deployment guide (all 4 steps)
- action='test-cache' for complete cache testing guide (all 3 steps)
- action='help' for this help text

These guides should be followed step-by-step by executing the commands shown, NOT interpreted by AI tools.`;

/**
 * Register all coder static site resources and tools
 */
export function registerCoderStaticSiteResources(server: any) {
    // Register individual deployment step resources
    const deploySteps = [
        { 
            num: '0', 
            name: 'preparation', 
            title: 'Deployment Preparation - Project Analysis',
            description: 'Analyze project structure, detect framework, package manager, and gather deployment requirements',
            content: DEPLOY_STEP_0 
        },
        { 
            num: '1', 
            name: 'configuration', 
            title: 'Deployment Configuration - Setup and Initialization',
            description: 'Install Azion CLI, authenticate, link project, and test build configuration',
            content: DEPLOY_STEP_1 
        },
        { 
            num: '2', 
            name: 'execute', 
            title: 'Deployment Execution - Deploy and Verify',
            description: 'Deploy the configured project to Azion Platform and verify deployment status',
            content: DEPLOY_STEP_2
        },
        { 
            num: '3', 
            name: 'basic-test', 
            title: 'Post-Deployment Basic Testing',
            description: 'Perform basic tests to verify deployment functionality and cache behavior',
            content: DEPLOY_STEP_3 
        }
    ];

    deploySteps.forEach(step => {
        server.resource(
            `static-site-deploy-step-${step.num}-${step.name}`,
            `azion://static-site/deploy/step-${step.num}-${step.name}`,
            async () => ({
                contents: [{
                    uri: `azion://static-site/deploy/step-${step.num}-${step.name}`,
                    name: `step-${step.num}-${step.name}.md`,
                    title: step.title,
                    description: step.description,
                    text: step.content,
                    mimeType: 'text/markdown'
                }]
            })
        );
    });

    // Register individual test cache step resources
    const testCacheSteps = [
        { 
            num: '0', 
            name: 'preparation', 
            title: 'Test Cache Preparation - Configuration Analysis',
            description: 'Analyze deployed site cache configuration and prepare comprehensive test scenarios',
            content: TEST_CACHE_STEP_0 
        },
        { 
            num: '1', 
            name: 'execution', 
            title: 'Test Cache Execution - Run Cache Tests',
            description: 'Execute comprehensive cache tests for all static asset types and verify hit/miss ratios',
            content: TEST_CACHE_STEP_1 
        },
        { 
            num: '2', 
            name: 'validation', 
            title: 'Test Cache Validation - Results and Report',
            description: 'Validate test results, calculate cache hit rates, and generate comprehensive test report',
            content: TEST_CACHE_STEP_2 
        }
    ];

    testCacheSteps.forEach(step => {
        server.resource(
            `static-site-test-cache-step-${step.num}-${step.name}`,
            `azion://static-site/test-cache/step-${step.num}-${step.name}`,
            async () => ({
                contents: [{
                    uri: `azion://static-site/test-cache/step-${step.num}-${step.name}`,
                    name: `step-${step.num}-${step.name}.md`,
                    title: step.title,
                    description: step.description,
                    text: step.content,
                    mimeType: 'text/markdown'
                }]
            })
        );
    });

    // Register hybrid tool for static site deployment
    server.registerTool(
        'deploy_azion_static_site',
        {
            title: 'Azion Static Site Deployment Guide',
            description: 'Provides guides for deploying and testing static sites on Azion Platform. Covers HTML/CSS/JS, Jekyll, Hugo, Hexo, Gatsby, Next.js, Astro, and other SSG frameworks. Includes CLI installation, authentication, deployment steps, and cache testing procedures.',
            inputSchema: {
                action: z.string().optional().describe('Specific guide to retrieve: deploy | test-cache | help')
            }
        },
        async (args: { action?: string }) => {
            // Return help text if no action or help requested
            if (!args.action || args.action === 'help') {
                return {
                    content: [{
                        type: 'text',
                        text: STATIC_SITE_HELP_TEXT
                    }]
                };
            }

            // Handle deploy action - return all deployment steps
            if (args.action === 'deploy') {
                const guidedContent = `COMPLETE DEPLOYMENT GUIDE
═══════════════════════════════════════════════

${getAllDeploymentSteps()}`;
                
                return {
                    content: [{
                        type: 'text',
                        text: guidedContent
                    }]
                };
            }

            // Handle test-cache action - return all test cache steps
            if (args.action === 'test-cache') {
                const guidedContent = `COMPLETE CACHE TESTING GUIDE
═══════════════════════════════════════════════

${getAllTestCacheSteps()}`;
                
                return {
                    content: [{
                        type: 'text',
                        text: guidedContent
                    }]
                };
            }

            // Invalid action
            return {
                content: [{
                    type: 'text',
                    text: 'Valid actions: deploy, test-cache, help'
                }]
            };
        }
    );
}
