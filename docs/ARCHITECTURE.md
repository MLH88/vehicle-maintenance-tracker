# Architecture

This document describes how Vehicle Maintenance Tracker is put together: how data moves through the app, how reminder statuses are computed, what the validation rules are, and how CSV export works. For setup instructions see the [README](../README.md).

## Contents

1. [Overview](#overview)
2. [Data flow](#data-flow)
3. [Service reminder status](#service-reminder-status)
4. [Validation rules](#validation-rules)
5. [Dashboard aggregates](#dashboard-aggregates)
6. [History filtering](#history-filtering)
7. [CSV export](#csv-export)
8. [Dates and formatting](#dates-and-formatting)

## Overview

The app is a single Next.js 14 App Router project with no separate backend:

| Layer | Location | Responsibility |
|---|---|---|
| Pages (server components) | `app/**/page.tsx` | Query the database with Prisma and render HTML |
| Server actions | `app/actions/*.ts` | Validate form input, write to the database, revalidate pages |
| Client components | `components/*` | Interactive UI: forms, charts, history filters, delete confirmation |
| Domain logic | `lib/*` | Validation, reminder status, aggregates, formatting, CSV |
| Persistence | `prisma/` | Schema, migrations, seed; SQLite file at `prisma/dev.db` |

Pages that read data export `dynamic = "force-dynamic"`, so they are rendered on every request and always reflect the current database.

## Data flow

### Reads: server components

```
Browser ──GET /vehicles/4──▶ page.tsx (server component)
                                │  prisma.vehicle.findUnique({ include: records, reminders })
                                │  reminderState(...) for each reminder        (lib/reminders.ts)
                                ▼
                             HTML streamed to the browser
                             (+ props for client components, e.g. RecordForm)
```

- Pages call Prisma directly through the shared client in `lib/prisma.ts`, which is a single instance reused across hot reloads in development.
- Route IDs are parsed with `parseId()` (`lib/params.ts`). Anything that is not a positive integer, or a record that does not exist, renders the not-found page.
- Derived values (totals, reminder statuses, chart series) are computed on the server, so client components receive plain, serialisable data.
- Each route has a `loading.tsx` skeleton that Next.js shows while the page's data loads.

### Writes: server actions

```
<form action={formAction}>  ──POST (FormData)──▶  server action ("use server")
   useFormState                                     │ parse + validate     (lib/validation.ts)
                                                    │ ├─ invalid → return { errors } ──▶ inline field errors
                                                    │ └─ valid   → prisma create/update/delete
                                                    │              revalidatePath(affected pages)
                                                    ▼              redirect() or return { ok: true }
                                              re-rendered page with fresh data
```

- Forms use React's `useFormState`, so a server action returns a `FormState` (`{ ok?, errors?, message? }`) that the form renders as field errors or a success message. `useFormStatus` drives the "Saving…" state of submit buttons.
- Route parameters are passed to actions with `.bind()` (e.g. `updateRecord.bind(null, vehicleId, recordId)`), not taken from hidden form fields.
- **Scoping.** Updates and deletes of records and reminders use `updateMany` / `deleteMany` with both the item ID *and* the vehicle ID in the `where` clause. A record can therefore only be changed through the vehicle it belongs to. If nothing matches, the action reports that the item no longer exists.
- **Cascades.** Deleting a vehicle deletes its records and reminders through `onDelete: Cascade` in the schema.
- **Revalidation.** Actions call `revalidatePath` for the vehicle page and the dashboard (`/`) so the client router cache is refreshed. Because data pages are `force-dynamic`, `/history` and the dashboard always read fresh data on the next request anyway.
- **After saving.** Create and edit forms for vehicles redirect to the vehicle page, as do record and reminder edits. "Add record" and "Add reminder" stay on the page and reset the form, so several entries can be added in a row.
- Because these are standard HTML form posts, the forms also work before client JavaScript has loaded.

### Client components

| Component | Why it runs on the client |
|---|---|
| `VehicleForm`, `RecordForm`, `ReminderForm` | `useFormState` for errors and reset |
| `ServiceTypeInput` (`components/forms.tsx`) | Suggestion dropdown (combobox) with keyboard support |
| `ConfirmDeleteButton` | Two-step inline confirmation before a delete action |
| `MonthlyCostChart`, `ServiceTypeChart` | Recharts rendering and tooltips |
| `HistoryView` | Instant filtering, URL sync and CSV export |
| `Nav` | Highlights the active section from the current path |

## Service reminder status

Implemented in `lib/reminders.ts` as `reminderState(reminder, records, currentMileage, today)`.

### Constants

| Constant | Value | Meaning |
|---|---|---|
| `DUE_SOON_KM` | `1000` | Distance window for "due soon" |
| `DUE_SOON_DAYS` | `30` | Time window for "due soon" |

### Algorithm

1. **Find matching records.** Records whose service type equals the reminder's service type, compared case-insensitively after normalising to the common spelling (`canonicalServiceType`). "Oil Change" matches an "Oil change" reminder.
2. **No match → `no-history`.** Nothing can be computed until the service has been logged once.
3. **Pick the last service:** the matching record with the latest date. If two share a date, the higher mileage wins.
4. **Determine current mileage:** `max(vehicle.currentMileage, highest mileage of any record)`. This protects against an odometer on the vehicle that was not updated after a newer record was added.
5. **Distance check** (if `intervalKm` is set):
   - `dueAt = lastService.mileage + intervalKm`
   - `remaining = dueAt − currentMileage`
6. **Time check** (if `intervalMonths` is set):
   - `dueOn = addMonths(lastService.date, intervalMonths)`, clamped to the end of shorter months (31 Jan + 1 month = 28/29 Feb).
   - `remainingDays = calendar days from today to dueOn`
7. **Status per check:**

   | Condition | Status |
   |---|---|
   | `remaining < 0` | `overdue` |
   | `0 ≤ remaining ≤ threshold` (1,000 km / 30 days) | `due-soon` (includes "due now" / "due today") |
   | `remaining > threshold` | `ok` |

8. **Overall status** is the more severe of the two checks, so the reminder is due at whichever interval runs out first.

### Severity order

Used for the vehicle-card badge (worst reminder) and for sorting reminder lists:

```
overdue  >  due-soon  >  no-history  >  ok
```

### Presentation

`StatusBadge` always shows an icon and a text label, never colour alone:

| Status | Badge |
|---|---|
| OK | green, check icon |
| Due soon | amber, clock icon |
| Overdue | red, "!" icon |
| No history | grey, dash icon |

`ReminderCard` shows each active check, e.g. "Due at 143,500 km · 700 km to go" and "Due Feb 14, 2027 · in 131 days". The line that triggered a warning is coloured to match the status.

### Example

A Tire Rotation reminder every 9,000 km, last done at 134,500 km, with the vehicle at 142,800 km:

```
dueAt     = 134,500 + 9,000 = 143,500 km
remaining = 143,500 − 142,800 = 700 km   → 0 ≤ 700 ≤ 1,000 → due-soon
```

## Validation rules

All validation runs on the server in `lib/validation.ts`. The HTML inputs carry matching attributes (`min`, `max`, `required`) as hints, but the server is authoritative. Numeric fields accept thousands separators ("84,250"). Text is trimmed, and empty optional text is stored as `null`.

### Vehicle (`parseVehicleForm`)

| Field | Rule |
|---|---|
| `name`, `make`, `model` | Required, max 60 characters |
| `year` | Whole number, 1886 to next calendar year |
| `currentMileage` | Whole number, ≥ 0 |

### Maintenance record (`parseRecordForm`)

| Field | Rule |
|---|---|
| `serviceType` | Required, max 100 characters, any value |
| `date` | Required, a real calendar date (e.g. 2026-02-30 is rejected), **not after today** |
| `mileage` | Whole number, **≥ 0** |
| `cost` | Number, **≥ 0**, rounded to 2 decimal places |
| `shopName` | Optional, max 100 characters |
| `notes` | Optional, max 1,000 characters |

### Service reminder (`parseReminderForm`)

| Field | Rule |
|---|---|
| `serviceType` | Required, max 100 characters |
| `intervalKm` | Optional whole number, 1 to 1,000,000 |
| `intervalMonths` | Optional whole number, 1 to 240 |
| — | At least one interval must be set |
| — | Only one reminder per service type per vehicle, compared case-insensitively (checked in the action) |

Errors are returned per field, e.g. `{ errors: { cost: "Cost must be at least 0." } }`. The form shows each one under its input, linked with `aria-describedby`.

## Dashboard aggregates

Computed on the server in `lib/stats.ts`:

- **Per-vehicle totals:** the sum of all record costs for each vehicle, across all time.
- **Last 12 months:** the current month plus the 11 before it. This window is used for the spending total, the monthly chart and the service-type breakdown.
- **Monthly cost by vehicle:** one row per month and one series per vehicle, stacked in the chart. Vehicles keep a fixed colour in creation order, matching the swatch on their dashboard card. More than 8 vehicles fold into an "Other" series.
- **Cost by service type:** spend and service count per canonical service type, sorted by spend. More than 8 types fold the remainder into "Other (N types)".

Both charts offer a "Show as table" view with the same numbers.

## History filtering

`app/history/page.tsx` loads every record once on the server and passes flat rows to `HistoryView`, which filters in the browser:

- **Search:** split into words; every word must appear in the service type, vehicle name, shop or notes (case-insensitive).
- **Vehicle / service type:** exact match. Service types are canonicalised, so spelling variants filter together.
- **Date range:** `from` and `to` are both inclusive. Dates are compared as `YYYY-MM-DD` strings. A warning is shown if `from` is after `to`.
- **Sort:** date descending.
- **URL state:** filters are written to the query string (`?q=…&vehicle=…&type=…&from=…&to=…`) with `history.replaceState`, and read back on the server for the initial render. Filtered views can be bookmarked and survive a reload.

For a personal maintenance log (hundreds to low thousands of rows), filtering in the browser is instant and avoids a round-trip on every keystroke.

## CSV export

Implemented in `lib/csv.ts` and triggered from `HistoryView`. It runs entirely in the browser, with no server endpoint.

1. **Input:** the currently filtered rows, so the file always matches what is on screen.
2. **Columns:** `Date, Vehicle, Service type, Mileage (km), Cost, Shop, Notes`.
   - Dates are written as `YYYY-MM-DD`.
   - Costs are plain numbers with 2 decimals, without a currency symbol, so spreadsheets treat them as numbers.
3. **Escaping:** values containing `,`, `"`, CR or LF are wrapped in double quotes, and inner quotes are doubled (RFC 4180). Rows are separated with `\r\n`.
4. **Formula-injection guard:** text cells starting with `=`, `+`, `-`, `@`, tab or carriage return are prefixed with `'`. Notes like `=HYPERLINK(...)` therefore stay inert when opened in Excel or Google Sheets.
5. **Encoding:** a UTF-8 byte-order mark is prepended so Excel shows non-ASCII characters correctly.
6. **Download:** the CSV is wrapped in a `Blob` (`text/csv;charset=utf-8`) and given an object URL. The app clicks a temporary `<a download>` link, then revokes the URL.
   - The file name is `maintenance-history-YYYY-MM-DD.csv`.
   - The Export button is disabled when no rows match.

## Dates and formatting

- **Calendar dates:** service dates are entered as calendar days (`YYYY-MM-DD`) and stored at **local noon**, so time-zone conversions cannot shift them to the previous or next day.
- **Strict parsing:** `fromDateInputValue` rejects impossible dates.
- **Month arithmetic:** `addMonths` clamps to the end of the month.
- **Day counts:** `daysBetween` counts calendar days, not 24-hour periods.
- **Formatting:** all user-facing formatting goes through `lib/format.ts` with a fixed `en-US` locale. Server and client render identical strings, which avoids hydration mismatches.

  | Value | Example |
  |---|---|
  | Currency | `$1,161.39` |
  | Distance | `84,250 km` |
  | Date | `Sep 9, 2026` |
  | Month | `Nov 2025` |
