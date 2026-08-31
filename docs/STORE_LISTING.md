# Browser store submission reference

This file is the source of truth for preparing a Chrome Web Store or Opera Add-ons submission. Re-check every statement against the release package and the stores' current forms at submission time.

Policy references last reviewed on 30 August 2026:

- [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- [Chrome privacy-practices fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Chrome Manifest V3 format](https://developer.chrome.com/docs/extensions/reference/manifest)
- [Opera publishing guidelines](https://help.opera.com/en/extensions/publishing-guidelines/)
- [Opera acceptance criteria](https://help.opera.com/en/extensions/acceptance-criteria/)

## Product identity

- **Name:** OneLessVideo
- **Category:** Productivity
- **Homepage:** <https://github.com/Kamitoad/one-less-video>
- **Privacy policy:** <https://github.com/Kamitoad/one-less-video/blob/main/PRIVACY.md>
- **Support:** <https://github.com/Kamitoad/one-less-video/issues>
- **License:** MIT
- **Interface languages:** English (default) and German
- **Affiliation:** Independent project; not affiliated with, endorsed by, or sponsored by YouTube or Google.

The maintainer must confirm the rights to the logo and every screenshot before submission. Do not use official YouTube, Google, Chrome, or Opera logos in a way that suggests affiliation.

## Single purpose

### English

OneLessVideo interrupts automatic YouTube viewing with configurable, local friction so the user makes a deliberate choice before a regular video plays.

### Deutsch

OneLessVideo unterbricht automatisches YouTube-Schauen durch konfigurierbare, lokal ausgeführte Reibung, damit Nutzer vor einem regulären Video eine bewusste Entscheidung treffen.

## Short summary

### English

Pause new YouTube videos until you make a deliberate viewing decision.

### Deutsch

Pausiere neue YouTube-Videos, bis du eine bewusste Entscheidung getroffen hast.

## Detailed description

### English

OneLessVideo helps interrupt mindless YouTube viewing without blocking YouTube. When a supported regular video page opens, the extension pauses playback and presents a configurable sequence: choose a reason, enter a short intention, wait through a countdown, type a code, and hold the final approval button for three seconds. The user can return to the previous task at the final decision step.

The popup provides an immediate enable switch, and the options page controls each friction step. OneLessVideo runs locally, has no backend, and does not transmit or retain video history, URLs, video IDs, selected reasons, or intention text. Only extension settings are stored locally.

Version 1 supports regular `https://www.youtube.com/watch?v=...` pages in Chromium-based Chrome and Opera. It intentionally does not handle Shorts or other websites. The complete interface is available in English and German; unsupported browser languages use English.

### Deutsch

OneLessVideo hilft dabei, gedankenloses YouTube-Schauen zu unterbrechen, ohne YouTube zu sperren. Beim Öffnen einer unterstützten regulären Videoseite pausiert die Erweiterung die Wiedergabe und zeigt eine konfigurierbare Abfolge: Grund auswählen, einen kurzen Absichtstext eingeben, einen Countdown abwarten, einen Code abtippen und den abschließenden Freigabebutton drei Sekunden halten. Beim letzten Schritt kann der Nutzer stattdessen zur vorherigen Aufgabe zurückkehren.

Das Popup enthält einen sofort wirksamen Aktivierungsschalter. Auf der Optionsseite lassen sich die einzelnen Schritte konfigurieren. OneLessVideo arbeitet lokal, besitzt keinen Server und überträgt oder speichert weder Videoverlauf, URLs, Video-IDs, ausgewählte Gründe noch Absichtstexte. Ausschließlich die Einstellungen der Erweiterung werden lokal gespeichert.

Version 1 unterstützt reguläre `https://www.youtube.com/watch?v=...`-Seiten in Chromium-basiertem Chrome und Opera. Shorts und andere Websites werden bewusst nicht verarbeitet.

## Permission justifications

### `storage`

Required to store the user's intervention settings locally and to notify already open extension contexts when the enabled setting changes. It is not used for video history, URLs, reasons, or intention text.

### Access to `https://www.youtube.com/*`

Required to detect supported regular YouTube watch-page navigation, display the user-facing intervention, and pause the current YouTube video until the user approves it. Access is limited to the `www.youtube.com` origin and is not used for unrelated browsing or advertising.

### Permissions not requested

The package does not request `tabs`, `history`, `scripting`, `webRequest`, notifications, `<all_urls>`, native messaging, externally connectable messaging, or a background service worker.

## Data-handling disclosure

The release processes the following locally for its visible user-facing purpose:

| Data                             | Purpose                                                             | Persisted                       | Transmitted or shared |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------- | --------------------- |
| Current YouTube URL and video ID | Recognize a supported page and isolate the current intervention run | No                              | No                    |
| Selected reason                  | Complete the visible intervention form                              | No                              | No                    |
| Intention text                   | Complete and validate the visible intervention form                 | No                              | No                    |
| YouTube player state             | Pause and release the current player                                | No                              | No                    |
| Extension settings               | Configure the intervention                                          | Yes, in `browser.storage.local` | No                    |

There are no accounts, analytics, telemetry, ads, cookies, fingerprinting, remote code, or external runtime services. The developer cannot access locally processed data.

When a store form asks whether locally processed website content, browsing activity, or user-provided form data is handled, answer according to the form's current definitions and disclose the local processing above. Do not interpret “not transmitted” as permission to omit local handling if the form includes on-device processing.

## Remote code declaration

**No.** The extension does not download or execute remote JavaScript or WebAssembly. All executable code is packaged with the extension. YouTube is the page on which the content script operates, not a source of extension code.

First-party production bundles are intentionally generated without minification so they remain directly reviewable. Source code and deterministic build instructions are public in the linked repository.

## Reviewer test instructions

1. Install the submitted package in a clean supported Chromium profile.
2. Open a regular `https://www.youtube.com/watch?v=...` URL.
3. Confirm that playback pauses and exactly one OneLessVideo dialog appears.
4. Complete the reason and intention step.
5. Complete the countdown and typing challenge.
6. Hold the final approval button continuously for three seconds.
7. Confirm that the dialog disappears and playback can resume.
8. Navigate to another regular video through YouTube's in-page navigation and confirm that a fresh intervention appears.
9. Open the extension popup, disable OneLessVideo, and confirm that an active dialog disappears immediately.
10. Open the options page, modify settings, and confirm that the next intervention uses them.

No account, payment, external service, or test credential is required. Reviewers may use any publicly accessible regular YouTube video.

## Required visual assets

- extension icon in every size required by the target store; the current source set contains dedicated 16, 32, 48, 64, 128, and 512 pixel PNGs;
- at least one clean screenshot of the intervention;
- one screenshot of the popup or options page;
- optional promotional tiles in the exact dimensions requested by the current store form.

Screenshots must come from the submitted version, contain no personal account information or private browsing content, and must not imply endorsement by YouTube, Google, Chrome, or Opera.

## Submission checklist

- [ ] Version matches the release tag and package.
- [ ] `npm run release:prepare` passes from a clean checkout.
- [ ] Live Chrome and Opera smoke tests pass.
- [ ] Store descriptions match current behavior and supported pages.
- [ ] Permission and data declarations match the generated manifest and privacy policy.
- [ ] Privacy-policy URL is public and stable.
- [ ] Screenshots contain no personal information.
- [ ] Logo and asset rights are confirmed by the maintainer.
- [ ] Current store policies have been reviewed.
- [ ] Support and security-reporting links work publicly.
