# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

`pow` is a CLI tool written in TypeScript that automates git workflow tasks including switching to main/master branches, cleaning up stale branches, and updating dependencies when lockfiles change.

## Key Commands

### Build and Development

- `npm run build` - Build the project using Bun (compiles src/cli.ts to dist/pow.js)
- `npm run test` - Run all tests (version check, typecheck, unit tests, integration tests)
- `npm run test:e2e` - Run integration tests only
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:typecheck` - Run TypeScript type checking only
- `npm run test:version` - Verify Node.js version is 22.x.x or higher

### Dependencies

- `npm install` - Install dependencies
- `npm run prepublishOnly` - Build before publishing (runs automatically)

## Architecture

### Source Structure

Modular TypeScript architecture following action-noun naming pattern:

```text
src/
├── cli.ts                    # Commander.js entry point
├── types.ts                  # TypeScript interfaces and type definitions
├── logger.ts                 # Logging utilities (no emojis)
├── handle-git.ts             # Git operations (setup, branch validation, cleanup)
└── install-dependencies.ts   # Package manager detection and installation
```

### Test Structure

```text
tests/
├── unit/                     # Unit tests for individual functions
│   ├── logger.test.ts
│   ├── install-dependencies.test.ts
│   └── handle-git.test.ts
├── integration/              # End-to-end CLI tests
│   ├── *.test.ts            # 12 integration test files
│   ├── test-utils.ts
│   └── interactiveSpawn.ts
└── fixtures/                 # Test data for integration tests
```

### Key Functionality Areas

#### Git Operations (handle-git.ts)

- Auto-detects main/master branch preference
- Handles branch switching with dirty working directory checks
- Fast-forward merge optimization using `git merge --ff-only`
- Parallel operations for fetching and branch validation
- Automatic cleanup of branches with deleted remotes

#### Package Manager Detection (install-dependencies.ts)

Auto-detects package managers based on lockfiles:

- `yarn.lock` → `yarn --immutable`
- `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`
- `package-lock.json` → `npm ci`

#### Dependency Management

- Compares lockfile content before/after git operations
- Only installs dependencies if lockfile changed
- Supports all three major package managers

## Testing

### Test Types

**Integration Tests (12 tests):**

- Test the compiled executable as a black box
- Located in `tests/integration/`
- Create temporary git repositories to simulate real scenarios
- Cover all user-facing workflows

**Unit Tests (18 tests):**

- Test individual functions in isolation
- Located in `tests/unit/`
- Use mocking for external dependencies
- Provide granular coverage metrics

### Requirements

- Node.js 22.x.x required for tests
- Tests require the project to be built first (`npm run build`)
- Vitest for test execution and coverage

## Technology Stack

- **Runtime**: Node.js ES modules
- **Language**: TypeScript with strict mode
- **CLI Framework**: Commander.js for argument parsing
- **Shell Operations**: zx (Google's shell scripting library)
- **Build System**: Bun for fast bundling
- **Test Framework**: Vitest with coverage support
- **Styling**: Chalk for colored terminal output

## Code Style

- TypeScript strict mode enabled
- ESNext/NodeNext module system
- Async/await throughout with parallel operations where possible
- Error handling with graceful fallbacks
- No emojis in output (uses plain text: INFO, SUCCESS, WARNING, ERROR, ACTION)

## Common Patterns

When working on this codebase:

- Use parallel Promise operations where possible (see `setupRepository()`, Promise.all patterns)
- Keep modules focused and under 200 lines
- Follow action-noun naming for functional modules
- Use structural names (cli, types, logger) for framework files
- Test changes with `npm run test` before committing
- Run `npm run test:coverage` to check unit test coverage
