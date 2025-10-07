# pow

A fast CLI tool to manage git main/master branches and cleanup operations.

## Features

- Auto-detects and switches to main/master branch
- Cleans up branches with deleted remotes
- Handles dirty working directory gracefully
- Auto-updates dependencies when lockfile changes
- Supports yarn, pnpm, and npm
- Built with Bun for fast builds

## Installation

```bash
npm install -g pow
```

Or use directly with npx:

```bash
npx pow
```

## Usage

Run `pow` in any git repository:

```bash
pow [branch-name]
```

Without arguments, pow will switch to main/master. With a branch name, it will switch to or create that branch.

### What it does

1. Fetches latest changes from remote
2. Switches to your main branch (or specified branch)
3. Pulls latest changes with fast-forward merge
4. Cleans up branches with deleted remotes
5. Installs dependencies if lockfile changed

### Package Manager Support

Auto-detects based on lockfiles:

- `yarn.lock` → `yarn --immutable`
- `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`
- `package-lock.json` → `npm ci`

## Development

### Setup

```bash
npm install
```

### Run Locally

```bash
npm start                   # Run with tsx (no build needed)
tsx src/cli.ts              # Direct tsx command
tsx src/cli.ts feature-123  # Run with arguments
```

### Build

```bash
npm run build
```

Uses Bun to bundle TypeScript source into a single executable.

### Testing

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:ui             # Interactive UI
npm run test:coverage       # Coverage report
npm run test:typecheck      # Type checking only
```

Direct commands:

```bash
vitest run                  # Run tests
vitest                      # Watch mode
vitest --ui                 # UI mode
vitest run --coverage       # Coverage
tsc --noEmit                # Type check
```

Test suite includes:

- 12 integration tests (end-to-end CLI testing)
- 18 unit tests (isolated function testing)
- 30 total tests

### Requirements

- Node.js 22.x.x or higher (for tests)
- Bun (for building)

## Architecture

### Source Structure

```text
src/
├── cli.ts                    # Commander.js entry point
├── types.ts                  # TypeScript interfaces
├── logger.ts                 # Logging utilities
├── handle-git.ts             # Git operations
└── install-dependencies.ts   # Package manager detection
```

### Test Structure

```text
tests/
├── unit/         # Unit tests for individual functions
├── integration/  # End-to-end CLI tests
└── fixtures/     # Test data
```

### Technology Stack

- TypeScript with ESNext/NodeNext
- Bun for building
- Vitest for testing
- zx for shell operations
- Commander.js for CLI
- Chalk for terminal colors

## License

MIT
