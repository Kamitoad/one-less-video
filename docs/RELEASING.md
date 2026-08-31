# Releasing OneLessVideo

This document describes the reproducible release process. It does not replace the browser stores' current policies or the maintainer's final review.

## Release requirements

- A clean `main` branch with all intended changes reviewed and committed.
- Node.js 24 and npm installed.
- Playwright Chromium installed with `npx playwright install chromium`.
- The version in `package.json` and `wxt.config.ts` must match.
- [PRIVACY.md](../PRIVACY.md), [CHANGELOG.md](../CHANGELOG.md), and store disclosures must describe the release accurately.
- The maintainer must have the rights to every included code and visual asset.
- `THIRD_PARTY_NOTICES.txt` must be present in the release package for bundled WXT runtime portions.

## Prepare locally

1. Update the version in `package.json`, `package-lock.json`, and `wxt.config.ts`.
2. Move the relevant entries from `Unreleased` to a dated version in `CHANGELOG.md`.
3. Run:

   ```bash
   npm ci
   npm run release:prepare
   ```

4. Perform the live YouTube smoke test from the README in both Chrome and Opera.
5. Inspect the generated archive in `.output`. Its root must contain `manifest.json`; it must not contain the parent `chrome-mv3` directory.

`npm run release:prepare` runs the complete type, lint, formatting, unit, DOM, dependency-usage, build, and browser E2E suite. It then creates the WXT ZIP and applies the repository's release-policy checks.

## Publish a GitHub release

After the release commit is on `main`, create and push a signed or annotated version tag matching `package.json`:

```bash
git tag -a v1.0.0 -m "OneLessVideo v1.0.0"
git push origin v1.0.0
```

The `Release` GitHub Actions workflow repeats all checks in a clean Ubuntu environment, uploads the verified ZIP as a workflow artifact, and creates a GitHub release for a version tag. A manually dispatched workflow only builds and uploads the temporary artifact; it does not create a release.

Do not commit `.output`, ZIP files, browser profiles, test reports, or store credentials.

## Submit to browser stores

Use the same verified Chromium ZIP as the starting point for Chrome and Opera submissions. Before each submission:

- compare the package against [STORE_LISTING.md](STORE_LISTING.md);
- review the current official policies because store requirements can change independently of this repository;
- host `PRIVACY.md` at a stable public HTTPS URL;
- provide truthful screenshots from the submitted version;
- disclose the single purpose, local data handling, host access, and `storage` permission exactly as implemented;
- never claim that OneLessVideo blocks YouTube securely or cannot be bypassed.

Production minification is deliberately disabled in `wxt.config.ts` so the submitted first-party bundle remains readable for Opera review. Do not re-enable minification for an Opera package without re-checking Opera's current acceptance criteria.

Store accounts, identity verification, contractual acceptance, final declarations, and submission remain manual maintainer actions.

## Update an existing release

Never replace the archive attached to an existing public version. Fix the issue, increment the version, update the changelog, and publish a new tag. This preserves an auditable relationship between source, tag, and distributed package.
