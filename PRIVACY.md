# Privacy

Kids Schedule Studio is local-first.

## What The App Stores

The app may store:

- Family name.
- Kid names.
- Activity titles.
- Activity categories and colors.
- Schedule dates and times.
- Locations.
- Parent notes.
- Finalized week markers.

## Where Data Is Stored

Schedules are stored in the browser on the same computer using `localStorage`.

The storage key is:

```text
kids-schedule-studio-v1
```

Exported backups are JSON files created only when the user clicks the export button.

## What Leaves The Computer

Nothing leaves the computer through this app. The app has no cloud service, analytics, telemetry, advertising code, or external API calls.

If a user manually emails, uploads, or shares an exported backup or printed PDF, that sharing happens outside the app.

## Removing Data

To remove app data from a browser, clear site data for:

```text
127.0.0.1
```

You can also import a blank backup or use browser developer tools to remove the `kids-schedule-studio-v1` localStorage item.
