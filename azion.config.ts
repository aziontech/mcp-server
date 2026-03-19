/**
 * This file was automatically generated based on your preset configuration.
 *
 * For better type checking and IntelliSense:
 * 1. Install azion as dev dependency:
 *    npm install -D azion
 *
 * 2. Use defineConfig:
 *    import { defineConfig } from 'azion'
 *
 * 3. Replace the configuration with defineConfig:
 *    export default defineConfig({
 *      // Your configuration here
 *    })
 *
 * For more configuration options, visit:
 * https://github.com/aziontech/lib/tree/main/packages/config
 */

export default {
  build: {
    preset: 'typescript',
    polyfills: true
  },
  functions: [
    {
      name: 'mcp-server',
      path: './functions/index.js'
    }
  ],
  applications: [
    {
      name: 'mcp-server',
      rules: {
        request: [
          {
            name: 'Execute Function',
            description: 'Execute function for all requests',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '^/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'run_function',
                attributes: {
                  value: 'mcp-server'
                }
              }
            ]
          }
        ]
      },
      functionsInstances: [
        {
          name: 'mcp-server',
          ref: 'mcp-server'
        }
      ]
    }
  ],
  workloads: [
    {
      name: 'mcp-server',
      active: true,
      infrastructure: 1,
      deployments: [
        {
          name: 'mcp-server',
          current: true,
          active: true,
          strategy: {
            type: 'default',
            attributes: {
              application: 'mcp-server'
            }
          }
        }
      ]
    }
  ]
}
