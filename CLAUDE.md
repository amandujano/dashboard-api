# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev          # Run with watch mode
npm run build              # Compile to dist/
npm run lint               # ESLint with --fix
npm run format             # Prettier over src/ and test/

npm test                   # Unit tests (jest, *.spec.ts under src/)
npm test -- app.controller # Run a single test file by name pattern
npm test -- -t "name"      # Run tests matching a test name
npm run test:e2e           # E2E tests (test/, uses test/jest-e2e.json)
npm run test:cov           # Coverage (output in coverage/)
```

## Architecture

NestJS 11 API on the Express platform. Standard NestJS module structure:

- `src/main.ts` — bootstrap; listens on `PORT` env var, defaults to 3000.
- `src/app.module.ts` — root module; new feature modules get registered in its `imports`.
- Unit tests are co-located with source as `*.spec.ts` (jest `rootDir` is `src`); e2e tests live in `test/` with a separate jest config.
