# Haven — property workspace

A frontend property-management workspace with a warm editorial design, responsive
navigation, and connected guest, reservation, room, operations, and billing flows.
Built with React, TypeScript, Vite, Radix Dialog, and Recharts.

## Requirements

- Node.js 22 or newer (Node 24 is used in CI)
- npm; keep `package-lock.json` committed

## Run locally

```bash
npm ci
npm run dev
```

For a production preview:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

## Workspace features

- Overview with property filtering, nightly revenue, occupancy, today's stays,
  and operational follow-ups.
- Property grid/list views, property details, room inventory, room creation, and
  rate configuration.
- Searchable reservations, 7/14-day stay calendar, guest profiles and VIP guests.
- Reservation confirmation, check-in, checkout, cancellation, notes, and invoices.
- Offline payment/refund records, invoice printing, and CSV exports.
- Maintenance and housekeeping boards/list views, assignments, priorities, due
  dates, and task completion.
- Reports, rate-change history, activity log, notifications, global search
  (`Ctrl/Cmd + K`), workspace preferences, and JSON backup export.
- Deep links use hash routes such as `#/reservations/HV-1042`; unknown routes and
  missing records show recovery links.

## Local data and business rules

The first visit creates three sample properties and date-relative example stays.
Changes are saved under `haven-workspace-v1` in **this browser's localStorage**.
Preferences → Reset demo replaces the data after confirmation. Invalid saved
data is left untouched and a temporary sample workspace is shown. Browser
storage failures show a warning; use Settings → Export backup before closing.

There is no backend, authentication, cloud sync, multi-user coordination, email
delivery, channel-manager integration, or payment processing. Payment buttons
only update local records. JSON backups are downloadable exports; importing
backups is not currently supported. Do not enter sensitive guest information.
Data from the earlier prototype is not migrated into the new sample workspace.

Reservations check room readiness, capacity, overlapping stays, and active rate
coverage for **every night**. Rate edits never reprice existing stays. Payments
cannot exceed balances, refunds cannot exceed paid amounts, and cancellation
requires refunding recorded payments. Checkout creates a housekeeping task;
all open room tasks must be completed before the room becomes ready.

Revenue reports allocate the locked average nightly price across each stay.
They represent booked stay value, not accounting statements or bank settlements.

## Structure and checks

- `src/app/model.ts`: typed entities and pure booking, rate, payment, and task rules.
- `src/app/seed.ts`: sample workspace.
- `src/app/store.tsx`: validated persistence, mutation API, activity, and toasts.
- `src/app/ui.tsx`, `forms.tsx`: shared controls and functional dialogs.
- `src/app/App.tsx`: responsive shell, search, notifications, and lazy page routing.
- Page modules: `Dashboard`, `Portfolio`, `Reservations`, `Operations`, `Workspace`.
- `src/styles/globals.css`: responsive Haven visual system and print styling.
- `src/app/components`: original generated UI primitives retained for reuse;
  excluded from lint because the active Haven pages use `ui.tsx`.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The unit tests cover collisions, seasonal pricing, price locking, status
transitions, decimal payments/refunds, room readiness, stored-data validation,
and spreadsheet-safe exports. GitHub Actions runs the same checks after `npm ci`.

## Deploying to Vercel

`vercel.json` pins the install/build commands (`npm ci` / `npm run build`), the
output directory (`dist`) and the SPA rewrite. Use Node 24 in the Vercel project
settings. Remove any old dashboard override that still invokes pnpm.

Property photos are bundled in `public/images` so they do not require runtime
image services. Google Fonts supplies DM Sans and Newsreader, with local system
fallbacks when unavailable. See `ATTRIBUTIONS.md` for the original UI and photo
attributions.
