# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Engineering compliance baseline: SECURITY.md, MAINTAINERS.md, CHANGELOG.md and CODEOWNERS governance rules
- Compliance, OSSF Scorecard, PR title, code quality (type check) and functional test workflows
- Vitest functional tests for the HTTP app: OAuth discovery, authentication and the MCP endpoint (`tests/vitest/`)

### Changed
- `security-scan.yml` now provides the `Security Scan` check: gitleaks and semgrep added, HIGH dependency advisories also block, no path filters
- Workflows: actions pinned to SHAs, read-only tokens by default, no persisted checkout credentials
- Dependencies refreshed within their declared ranges to fix HIGH/CRITICAL advisories; `@langchain/core` 0.3.51 to 0.3.80

## [v1.0.0] - 2026-10-01

### Added
- SemVer baseline for the MCP server as deployed to production from `main` (`mcp.azion.com`)
