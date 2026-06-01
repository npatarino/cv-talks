---
name: cv-talks-testing
description: >
  Run automated tests for cv-talks. Use this skill whenever the user wants to run
  unit tests, check code coverage, or execute end-to-end tests — including phrases
  like "run tests", "check coverage", "vitest", or "e2e tests".
---

# Testing

The project lives at `/Users/juansp/projects/chimi/cv-talks`.

We use **Vitest** for unit testing and **Playwright** for end-to-end (E2E) testing.

## Running Tests

To run all unit tests once:
```bash
cd /Users/juansp/projects/chimi/cv-talks
bun run test
```

To run tests in watch mode during development:
```bash
bun run test:watch
```

To check code coverage:
```bash
bun run test:coverage
```

## E2E Testing

End-to-end tests verify the full functionality of the slides and editor UI.

To run Playwright tests:
```bash
bun run test:e2e
```
