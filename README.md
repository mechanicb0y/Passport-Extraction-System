# Passport Extraction System

A production-ready React + Vite client-side passport extraction simulator. The app lets users upload or capture a passport bio-page image, preview it, run a simulated OCR pipeline, validate the extracted fields, edit results, generate a QR payload, export JSON/CSV, and save local history.

## Features

- Upload/Home page with drag and drop image upload, camera capture, image preview, privacy notice, and loading skeletons.
- Extracted Results page with validation badges, editable passport fields, simulated face/name matching, QR code generation, raw OCR text, JSON copy, JSON download, CSV download, and save-to-history.
- History page backed by localStorage with search, restore, delete, clear history, and per-record JSON download.
- Help/Guide page documenting workflow, validation signals, local storage behavior, and export behavior.
- Responsive dark blue and yellow interface with light/dark mode, mobile navigation, accessible focus states, and smooth interactions.
- Privacy-first behavior: no backend, no network OCR calls, no analytics, and no uploaded document transfer.

## Folder Structure

```text
src/
  components/   Reusable UI components for upload, camera, validation, fields, exports, QR, history states.
  data/         Country profiles, sample identity data, and help page content.
  hooks/        Theme, toast, camera, localStorage, and extraction state hooks.
  layouts/      App shell with header, navigation, theme toggle, and routed content.
  pages/        Upload/Home, Results, History, and Help/Guide pages.
  services/     OCR simulation, validation, and localStorage history services.
  utils/        Date, file, export, hash, and MRZ helper functions.
```

## Workflow

1. The user uploads or captures a passport image.
2. The browser creates a local image preview with `FileReader` or camera canvas capture.
3. `simulatePassportExtraction` hashes image metadata to generate repeatable passport-like fields.
4. The simulated OCR output is validated by country, date, MRZ, passport number, and name rules.
5. The user reviews and edits fields. Validation and face/name scoring update immediately.
6. The result can be copied as JSON, downloaded as JSON/CSV, converted into a QR summary, or saved to local history.

## OCR Simulation Logic

The OCR service is intentionally local and deterministic. It uses the image name, size, and timestamp as a seed, selects a country profile, creates passport-shaped identity fields, builds ICAO-style MRZ rows, and emits raw text resembling OCR output. This makes testing repeatable while keeping the project free from external OCR dependencies.

## AI Validation Logic

Validation combines rule-based checks and simulated confidence:

- Passport number pattern is checked against the detected issuing country.
- Dates are parsed for valid age, active expiry, and issue-before-expiry chronology.
- MRZ rows are checked for 44-character machine-readable shape.
- Name format is normalized and reviewed for readability.
- Face/name matching uses deterministic scoring based on extracted name and passport number signals.

## Country Detection Logic

Country detection scans simulated raw OCR text for country code, country name, nationality, and authority values from `src/data/countryProfiles.js`. If no direct signal is found, the app falls back to the issuing country field and marks the confidence lower.

## History and localStorage Logic

The latest extraction is stored under `passport-extraction-current-v1`. Saved history is stored under `passport-extraction-history-v1`, deduplicated by extraction id, and capped at 50 entries. Delete and clear operations only modify localStorage on the current device.

## Export JSON/CSV Logic

JSON export includes extraction metadata, extracted fields, validation results, face/name score, and raw OCR text. CSV export flattens the same payload into a two-column spreadsheet-friendly format. Exports are generated with browser Blob URLs and do not require a server.

## Setup

Install dependencies:

```bash
npm install
```

## Run

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deploy

### Vercel

1. Import the project into Vercel.
2. Set the framework preset to Vite.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.

### Netlify

1. Import the repository into Netlify.
2. Use `npm run build` as the build command.
3. Use `dist` as the publish directory.
4. No environment variables are required.

## Future Improvements

- Add real OCR provider integration behind an explicit opt-in privacy setting.
- Add schema validation tests for exported JSON and CSV.
- Add document edge detection and perspective correction in canvas.
- Add encrypted local history with a user-supplied passphrase.
- Add import/export of saved history for device migration.
