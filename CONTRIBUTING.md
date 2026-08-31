# Contributing to OneLessVideo

Thank you for helping improve OneLessVideo.

## Before opening an issue

- Search existing issues first.
- Use the bug report template for reproducible defects.
- Use the feature request template for changes in product behavior.
- Report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md).
- Never include intention text, browsing history, account data, or other personal information in an issue.

## Development setup

Requirements and setup instructions are documented in [README.md](README.md). The short version is:

```bash
npm ci
npx playwright install chromium
npm run check
```

## Pull requests

Keep pull requests focused and explain the user-visible reason for the change. Before submitting:

1. add regression tests for behavior, lifecycle, race, or YouTube-adapter changes;
2. keep YouTube-specific assumptions inside `src/platform/youtube/`;
3. keep user-facing copy centralized;
4. avoid new permissions, network requests, telemetry, persistence, or dependencies unless they are essential and explicitly justified;
5. update privacy and architecture documentation when behavior changes;
6. run `npm run check` successfully;
7. confirm that no build output, browser profile, report, secret, or personal data is included.

## Commit messages

The repository uses a short type followed by an imperative, lower-case summary, for example:

```text
Feat: add extension icons
Fix: prevent page shortcuts while typing
Docs: clarify release installation
Test: cover aborted intervention lifecycle
Chore: update development tooling
```

## Privacy invariant

OneLessVideo is local and privacy-first. Do not persist or transmit video IDs, URLs, titles, selected reasons, intention text, or watch history. A proposal that changes this invariant must include a clear product need, data-flow review, updated disclosure, consent design where required, and maintainer approval before implementation.
