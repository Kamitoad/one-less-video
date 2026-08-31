# Changelog

All notable changes to OneLessVideo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Intentional viewing flow with a reason, intention text, countdown, typing challenge, and randomized final action position.
- Three-second hold-to-confirm interaction before playback approval.
- YouTube SPA navigation detection and resilient playback locking.
- Popup enable switch and validated local options.
- Accessible Shadow DOM intervention UI with keyboard isolation and focus handling.
- Extension icons for Chromium browser surfaces.
- English default localization and complete German localization using native WebExtension locale catalogs.
- Deterministic unit, DOM, lifecycle, race, and built-extension tests.
- Privacy, security, contribution, and release documentation.

### Fixed

- Normalize typing-challenge input to uppercase so its visible value and validation behavior match.
- Replace native browser validation prompts with localized, accessible inline errors.

### Privacy

- All processing remains local, with no backend, analytics, telemetry, watch-history storage, or intention-text persistence.
