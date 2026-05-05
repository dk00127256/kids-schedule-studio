# Kids Schedule Studio

Kids Schedule Studio is a local-first planning app for two elementary-age kids. It covers May 2026 through December 2026, shows every day from Monday to Sunday, gives each day hourly planning space from 8:00 AM to 11:00 PM Central Time, and lets parents copy a day or week into another week so repeated classes, camps, training, learning blocks, and activities do not have to be entered again.

The app runs entirely on the computer. There is no account, no cloud service, no external API, and no network dependency beyond the local web server on `127.0.0.1`.

## Features

- Two customizable kid names.
- Weekly, monthly, and reusable activity views.
- Activity categories for classes, summer camps, activities, training, learning, family, and rewards.
- Copy one day to the next week or to a chosen date.
- Copy one full week to the next week.
- Copy one scheduled activity as a new activity.
- Bulk schedule builder for school, camp, training, and recurring learning blocks across date ranges and selected weekdays.
- Add one long activity block, such as School from 8:00 AM to 4:00 PM, and see it across every covered hour.
- Weekly parent brief with item count, conflicts, long blocks, finalized days, and next activity.
- Conflict highlighting for overlapping activities for the same kid.
- Offline `.ics` export for importing the local schedule into Apple Calendar, Google Calendar, Outlook, or another calendar app.
- Replace or append when copying.
- Sunday reward area for weekly completion.
- Print day, week, or month sheets and save them as PDF from the browser print dialog.
- Export and import JSON backups.
- Local browser storage for day-to-day use.
- No third-party JavaScript, no npm dependencies, and no remote assets.

## Requirements

- macOS, Windows, or Linux.
- A modern browser such as Chrome, Edge, Safari, or Firefox.
- Python 3 for the local server scripts.
- Node.js is optional, only needed for `npm run check`.

## Quick Start On macOS

From a terminal:

```zsh
cd kids-schedule-studio
./scripts/start-local.zsh
```

Then open:

```text
http://127.0.0.1:4177/index.html
```

You can also double-click:

```text
Run Kids Schedule Studio.command
```

If macOS blocks the command file the first time, right-click it, choose Open, and confirm.

## Run Without Scripts

Any machine with Python 3 can run the app from the project folder:

```zsh
python3 -m http.server 4177 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4177/index.html
```

## Build A macOS App Bundle

To create a local `.app` bundle and zip file:

```zsh
cd kids-schedule-studio
./scripts/package-macos-app.zsh
```

Outputs:

```text
dist/Kids Schedule Studio.app
dist/Kids Schedule Studio.zip
```

The generated app is unsigned. On another Mac, the first launch may require right-clicking the app and choosing Open.

The package includes the custom Kids Schedule Studio app icon from `assets/AppIcon.icns`. To regenerate the icon from the project artwork:

```zsh
python3 scripts/build-app-icon.py
```

## Print PDFs

1. Choose the kid and view: Day, Week, or Month.
2. Select the date, week, or month.
3. Click Print Day PDF, Print Week PDF, or Print Month PDF.
4. In the browser print dialog, choose Save as PDF.

For monthly sheets, choose landscape paper orientation if you want larger writing space.

## Copy Schedules

- Use Copy Day Next Week to repeat one day in the following week.
- Use Copy Day To Date to copy the selected day to any May-December 2026 date.
- Use Copy Week Next Week to repeat the visible week.
- Open any scheduled activity and use Copy Activity to duplicate only that one item. Change the date, kid, start, or end before clicking Copy Activity if needed.
- Turn Replace target first on when the new copied schedule should overwrite the target day or week.
- Turn it off when copied activities should be added alongside existing activities.

## Bulk Schedule Builder

Use Bulk Add Schedule for repeated blocks such as school, summer camp, tutoring, therapy, sports training, or a daily reading window.

Example:

1. Click Bulk Add Schedule.
2. Set From `2026-05-04` and To `2026-05-29`.
3. Choose Monday-Friday.
4. Set Start `8:00 AM` and End `4:00 PM`.
5. Title it `School`.
6. Keep Replace overlapping activities on if the block should overwrite existing items in that time range.

This creates one clean long block per selected day and renders it across every covered one-hour cell.

## Long Time Blocks

For school, camp, or another multi-hour block, create one activity and set the start and end times. For example, use Start `8:00 AM` and End `4:00 PM`. The week view and printed day/week PDFs will fill each covered one-hour cell, so 8 AM, 9 AM, 10 AM, and the rest of the block all show the activity as blocked until the end time.

## Parent Brief And Conflicts

The Parent Tools panel shows a weekly brief for the selected kid or both kids. It includes total week items, long blocks, finalized days, the next activity, and conflict count.

Conflicts are shown when two activities overlap for the same kid on the same date. Conflicted cells and activity chips are highlighted so parents can resolve double-bookings before printing.

## Calendar Export

Use Export Calendar to download an `.ics` file for the selected kid or both kids. This is a local file export only. The app does not connect to Apple, Google, Outlook, or any cloud calendar directly.

Import the `.ics` file into your calendar app if you want a copy outside Kids Schedule Studio.

## Backups

Use the top-right export button to save a JSON backup. Use import to restore it later or move the schedule to another computer.

Backup files contain family names, kid names, activities, locations, notes, and schedule details. Treat them like private family planning files.

## Security And Privacy

Security work included in this app:

- Content Security Policy in `index.html`.
- No external JavaScript, CSS, fonts, images, analytics, or APIs.
- No `eval` or dynamic code execution.
- Imported backups are normalized and sanitized before being saved.
- User-entered text is escaped before rendering.
- Custom colors are restricted to safe hex color values.
- Copy tools are restricted to the May-December 2026 scheduling window.
- Local server binds to `127.0.0.1`, not the public network interface.

See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md) for more detail.

## Validate Before Publishing

If Node.js is installed:

```zsh
npm run check
```

This performs dependency-free static checks for required files, JavaScript syntax, local-only assets, CSP presence, and security helper functions.

## Suggested GitHub Publish Flow

Use `kids-schedule-studio` as the repository root:

```zsh
cd kids-schedule-studio
git init
git add .
git commit -m "Initial Kids Schedule Studio app"
git branch -M main
git remote add origin https://github.com/YOUR-USER/kids-schedule-studio.git
git push -u origin main
```

Add a `LICENSE` file before public release if you want to grant other people reuse rights.

## Project Structure

```text
kids-schedule-studio/
  index.html
  styles.css
  app.js
  assets/
  scripts/
    start-local.zsh
    package-macos-app.zsh
    validate.mjs
  Run Kids Schedule Studio.command
  README.md
  SECURITY.md
  PRIVACY.md
```

## Data Storage

The app saves schedules in browser `localStorage` under:

```text
kids-schedule-studio-v1
```

Clearing browser site data for `127.0.0.1` can remove the schedule from that browser. Export JSON backups regularly.
