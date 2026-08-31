# AGENTS.md

## Purpose

OneLessVideo adds configurable friction before new YouTube videos. It is a local, privacy-first Chromium extension built with WXT, Manifest V3, strict TypeScript, and vanilla DOM APIs.

## Architecture

- `src/platform/youtube/`: all YouTube URLs, events, selectors, DOM assumptions, and player control.
- `src/features/intervention/`: intervention plan, explicit state, controller, and Shadow DOM UI.
- `src/shared/`: settings/schema/storage, randomness, countdown timing, and centralized copy.
- `src/entrypoints/`: composition only for content, popup, and options contexts.
- `test/unit/`: pure logic, JSDOM integration, lifecycle, and race tests.
- `test/e2e/`: deterministic built-extension tests; never depend on live YouTube.

## Invariants

- At most one intervention is visible.
- An approval belongs only to the current `videoId` and run.
- Stale work from video A must never unlock video B.
- Every new video, disable, page unload, or context invalidation aborts obsolete work and removes locks/listeners.
- Repeated navigation signals for the same current `videoId` do not create another intervention.
- YouTube selectors and navigation assumptions stay inside `src/platform/youtube/`.
- Entrypoints contain no business logic; settings are read and written only through the settings module.
- No network requests, backend, telemetry, analytics, history, or intention-text persistence.
- Unexpected internal failures fail open because the extension is not a security boundary.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
npm run check
npm run release:prepare
```

Run `npx playwright install chromium` once before E2E tests.

## Working rules

- Add no dependency or architecture pattern without a concrete need.
- Keep content entrypoints small and avoid global mutable singletons.
- Add regression tests for core logic, races, and YouTube-adapter changes.
- Keep user copy centralized; do not log personal content or video history.
- Keep `PRIVACY.md` and `docs/STORE_LISTING.md` synchronized with actual data handling and permissions.
- Keep bundled third-party license notices in every distributable package.
- Do not add YouTube selectors outside the YouTube adapter.
- Do not commit build output, browser profiles, reports, or secrets.
- Never use destructive Git commands, commit, or push without explicit user instruction.
