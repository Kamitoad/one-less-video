# Security policy

## Supported versions

Security fixes are provided for the latest released version of OneLessVideo. Users should update to the most recent release before reporting an issue that may already have been fixed.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or for a report containing personal data.

Use GitHub's private vulnerability reporting for this repository:

<https://github.com/Kamitoad/one-less-video/security/advisories/new>

Please include:

- the affected OneLessVideo and browser versions;
- reproducible steps or a minimal proof of concept;
- the expected and observed behavior;
- the potential impact;
- any suggested mitigation, if available.

Reports are reviewed as maintainer availability permits. A confirmed issue will be assessed, fixed, tested, and disclosed in a manner proportionate to its impact. Please allow a reasonable remediation period before public disclosure.

## Security model

OneLessVideo is a productivity aid, not a security boundary. Its playback lock is intentionally fail-open on unexpected internal failures, and a browser owner can always disable or modify the extension. Reports that only demonstrate bypassing the intentional friction by the device owner are therefore outside the security model.
