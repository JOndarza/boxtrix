---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/e2e/**"
  - "frontend/src/**/*.spec.ts"
---

<!-- mirrors: docs/coding-rules.md -->

# Testing rules (auto-load on test files)

- **Backend**: no tests yet — when introducing, use a framework consistent with Node.js/TypeScript (Jest recommended)
- **Frontend**: Karma + Jasmine (Angular CLI default, configured in `angular.json`)
- **Naming**: test method `Should_<Outcome>_When_<Condition>`, test file `<Class>.spec.ts`
- **Structure**: Arrange / Act / Assert — blank lines between each block
- **Mocks**: mock external IO only (HTTP calls). Never mock pure functions or value objects
- **Async**: always `await` — never `.then()` chains or `.subscribe()` in tests
- **e2e**: use `data-testid` selectors, never CSS classes or text content selectors
- **Coverage target**: TODO — define per layer once backend tests are introduced

Full reference: `docs/coding-rules.md` §Testing.
