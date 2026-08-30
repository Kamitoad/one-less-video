# OneLessVideo

> Make every video intentional.

OneLessVideo is a browser extension that adds intentional friction before YouTube videos to interrupt mindless watching. YouTube remains available, but opening a new video requires a deliberate choice.

## Features

- Detects new regular YouTube `/watch?v=...` videos, including SPA navigation.
- Pauses the current player and keeps it paused until approval.
- Reattaches the playback lock when YouTube replaces its video element.
- Asks for a reason and a short intention (15 characters by default).
- Adds a random 5–10 second countdown and a five-character typing challenge.
- Places the final “Video ansehen” action in one of several safe, fixed positions.
- Provides an immediate global enable/disable switch in the popup.
- Persists validated friction settings in extension-local storage.
- Runs locally without a backend, analytics, telemetry, or watch-history storage.

The intervention uses a quiet, keyboard-accessible Shadow DOM overlay. The easier action returns to the previous task; approving removes the lock and resumes exactly the current video.

## MVP scope and non-goals

Version 1 targets Chromium-based Chrome and Opera on `https://www.youtube.com/*`. It handles regular watch pages only. Shorts, other websites, adaptive friction, usage statistics, accounts, cloud sync, AI analysis, gamification, and store publishing are intentionally outside the MVP.

OneLessVideo creates psychological friction. It is not a security boundary or an anti-tamper tool, and the browser owner can always disable or change it.

## Requirements

- Node.js 24 LTS (also recorded in `.nvmrc`)
- npm 11 or the npm version shipped with Node.js 24
- Chromium installed through Playwright for E2E tests

## Local development

```bash
npm ci
npx playwright install chromium
npm run dev
```

`npm ci` also runs `wxt prepare`, which generates WXT's local TypeScript declarations. The main quality command is:

```bash
npm run check
```

It runs TypeScript, ESLint, Prettier, unit/DOM tests, Knip, the production build, and deterministic Chromium extension E2E tests. If the managed Playwright Chromium cannot run on a particular machine, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point the tests to a compatible local Chromium binary.

Useful individual commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run knip
npm run build
```

The E2E suite intercepts YouTube requests and serves a controlled local fixture. It never depends on the live YouTube UI in CI.

## Build and install

Create a production build:

```bash
npm run build
```

WXT writes the unpacked Chromium extension to `.output/chrome-mv3`.

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `.output/chrome-mv3`.

### Opera

1. Open `opera://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `.output/chrome-mv3`.

## Settings

The options page controls whether a reason, intention text, countdown, typing challenge, and randomized final-button position are required. Numeric values are bounded and normalized before storage. The enable/disable switch takes effect immediately in already-open YouTube tabs; other friction changes apply to the next intervention.

## Architecture

- `src/platform/youtube/` owns URL parsing, SPA signals, selectors, and player locking.
- `src/features/intervention/` owns plans, explicit state, race protection, and the Shadow DOM experience.
- `src/shared/` owns validated settings storage, random selection, countdown timing, and user-facing copy.
- `src/entrypoints/` composes the content script, popup, and options page without embedding domain logic.
- `test/unit/` covers pure logic, controller races, player replacement, storage, countdowns, and DOM behavior.
- `test/e2e/` loads the built MV3 extension into a persistent Chromium context and exercises critical flows.

Long-lived decisions and lifecycle details are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Privacy and permissions

OneLessVideo performs all processing locally in the browser.

The extension does not operate a backend, transmit browsing activity, collect analytics, or store the user's YouTube watch history. Intention text, selected reasons, video IDs, titles, and URLs are not persisted. Only extension settings are stored locally.

The generated manifest requests only:

- `storage`, to persist settings and notify open extension contexts about changes;
- a content-script match for `https://www.youtube.com/*`.

It does not request `tabs`, `history`, `scripting`, `webRequest`, notifications, or `<all_urls>`, and it has no background service worker.

## Known limitations

- YouTube's DOM is an unstable external interface. The adapter may need maintenance when YouTube changes its player markup or navigation events.
- Only regular `/watch?v=...` pages on `www.youtube.com` are in scope; Shorts are ignored.
- Browser autoplay policy may reject programmatic resume after approval. The lock is still removed, so normal playback remains available.
- Automated tests use a controlled YouTube-like page; they do not replace a live-site smoke test.

## Manual YouTube smoke test

1. Load the unpacked extension.
2. Open `youtube.com`.
3. Open video A and confirm that playback is paused and one intervention appears.
4. Complete the intervention and confirm that video A can play.
5. Click a recommended video B and confirm that a fresh intervention appears.
6. Use Browser Back during an intervention and verify cleanup.
7. Change settings and verify that the next intervention uses them.
8. Disable OneLessVideo from the popup and verify that the overlay disappears and playback is unlocked.
9. Re-enable it and open another video.
10. Repeat once after a hard reload.

## Technical references

The implementation follows the current official documentation for [Chrome Manifest V3 and content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [extension storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [WXT entrypoints and SPA handling](https://wxt.dev/guide/essentials/content-scripts), [Playwright extension testing](https://playwright.dev/docs/chrome-extensions), and [Node.js releases](https://nodejs.org/en/about/previous-releases).

## Disclaimer

OneLessVideo is an independent open-source project and is not affiliated with, endorsed by, or sponsored by YouTube or Google. YouTube and Google are trademarks of their respective owners. No official YouTube or Google logos are used.

## License

[MIT](LICENSE) © 2026 Chasan Moustafa
