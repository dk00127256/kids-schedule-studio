# Security Policy

## Supported Version

The current source in this repository is the supported version.

## Security Model

Kids Schedule Studio is a local-only static web app. It is designed to run from a folder on a personal computer through a local server bound to `127.0.0.1`.

The app does not use:

- Remote APIs.
- Cloud accounts.
- Analytics.
- Third-party JavaScript.
- Third-party CSS.
- External image, font, or tracking resources.
- Server-side storage.

## Hardening Included

- Content Security Policy is defined in `index.html`.
- `connect-src 'none'` blocks browser network calls from app code.
- `script-src 'self'` allows only the local `app.js`.
- Backup imports are parsed as JSON and normalized before use.
- Imported text is length-limited and sanitized.
- Imported colors must be six-digit hex colors.
- Imported IDs are restricted to simple safe characters.
- User-entered text is escaped before being inserted into HTML.
- Local server scripts bind to `127.0.0.1`.

The policy allows inline styles because the app renders user-selected activity colors. Color values are sanitized before rendering.

## Known Limits

- Browser `localStorage` is not encrypted. Anyone with access to the same browser profile may be able to inspect stored schedules.
- Exported JSON backups are plain text and may contain family schedule details.
- The generated macOS app bundle is unsigned unless you sign it yourself.
- This app is not a multi-user system and does not provide authentication.

## Reporting A Security Issue

If this is published on GitHub, report security issues using the repository security advisory feature if enabled. If advisories are not enabled, open a private channel with the repository owner before posting sensitive details publicly.

Please include:

- A short description of the issue.
- Steps to reproduce.
- Browser and operating system.
- Whether the issue requires importing a crafted backup file or only normal app usage.
