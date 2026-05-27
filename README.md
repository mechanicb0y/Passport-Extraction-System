# Passport Extraction System

A production-ready React + Vite passport extraction workspace backed by a Node.js / Express API. The frontend handles upload, camera capture, preview, editing, QR generation, exports, and local history. The backend keeps Google credentials private, sends passport images to Google Cloud Vision OCR, detects TD3 passport MRZ lines, parses ICAO 9303 fields, validates MRZ check digits, and returns a normalized extraction result.

## Features

- Upload/Home page with drag and drop, camera capture, image preview, sample-passport lightbox, supported format guidance, and loading skeletons.
- Results page with editable MRZ-derived fields, validation badges, raw OCR text, optional selfie upload, QR code generation, JSON copy, JSON download, CSV download, and save-to-history.
- History page backed by localStorage with search, restore, delete, clear history, and per-record JSON download.
- Help/Guide page explaining OCR flow, validation signals, storage behavior, and export behavior.
- Responsive dark blue and yellow interface with light/dark mode, mobile navigation, accessible focus states, and smooth interactions.
- Backend-only Google Vision credentials; credentials are never exposed to React.

## Folder Structure

```text
backend/
  src/
    config/       Google Vision client configuration.
    controllers/  Upload request orchestration.
    middleware/   Multer upload limits and API error handling.
    routes/       Express extraction routes.
    services/     OCR, MRZ detection, MRZ parsing, validation, scoring, normalization.
    utils/        ICAO check digits, country codes, dates, and text normalization.

src/
  components/     Reusable UI components for upload, camera, validation, fields, exports, QR, and states.
  data/           Demo passport image data and help page content.
  hooks/          Theme, toast, camera, localStorage, and extraction state hooks.
  layouts/        App shell with header, navigation, theme toggle, and routed content.
  pages/          Upload/Home, Results, History, and Help/Guide pages.
  services/       Backend API client and localStorage history service.
  utils/          Date, file, and export helper functions.
```

## Workflow

1. The user uploads or captures a passport bio-page image.
2. React creates a browser preview and sends the original image file to `POST /api/extractions`.
3. The Express backend receives the image in memory with Multer and sends it to Google Cloud Vision OCR.
4. The backend creates an OCR-sized working copy, auto-orients the image, analyzes crop/blur/lighting, and trims obvious background when safe.
5. The backend detects two TD3 MRZ lines from Vision's raw OCR text.
6. The backend parses MRZ positions according to ICAO 9303.
7. The backend validates MRZ check digits, date formats, expiry status, document type, and country/nationality codes.
8. The backend calculates confidence and returns normalized fields, image quality diagnostics, warnings, validation items, and raw OCR text.
9. The frontend displays the result, lets the user edit fields, copy/download JSON, download CSV, generate QR, and save history locally.

## OCR Logic

Google Cloud Vision OCR is the active OCR provider. The backend calls `textDetection` with the uploaded image buffer and reads `fullTextAnnotation.text` as raw OCR text. If Vision returns annotation confidence values, the backend averages them into an OCR confidence percentage. Images are not stored by default.

## ICAO 9303 MRZ Logic

The backend currently supports TD3 passport MRZ:

- Two lines, 44 characters each.
- Allowed characters: `A-Z`, `0-9`, and `<`.
- Line 1 contains document type, issuing country, surname, and given names.
- Line 2 contains passport number, nationality, date of birth, sex, expiry date, optional data, and check digits.
- Check digits use ICAO weights `7, 3, 1`, with `A=10` through `Z=35` and `< = 0`.

## Validation Logic

Backend validation checks:

- TD3 MRZ detection and allowed character shape.
- Passport number check digit.
- Birth date check digit and real calendar date.
- Expiry date check digit and active expiry.
- Composite MRZ check digit.
- Passport document type.
- Issuing country and nationality against ISO/ICAO country codes when possible.
- Visual-zone OCR comparison for passport number and name when text appears outside the MRZ.

## Country Detection Logic

The system does not hardcode passport-number regex rules for every country. It uses the MRZ issuing-country and nationality fields as the source of truth, then resolves those codes through ISO/ICAO country-code lookup. Unknown or special codes are marked for review instead of blocking extraction.

## History and localStorage Logic

The latest extraction is stored under `passport-extraction-current-v2`. Saved history is stored under `passport-extraction-history-v2`, deduplicated by extraction id, and capped at 50 entries. Delete and clear operations only modify localStorage on the current device.

## Export JSON/CSV Logic

JSON export includes extraction metadata, normalized fields, validation results, warnings, confidence, and raw OCR text. CSV export flattens the same payload into a two-column spreadsheet-friendly format. Exports and QR generation run in the browser with Blob URLs.

## Image Quality Logic

The backend uses Sharp to downscale high-resolution uploads to a reasonable OCR working size while preserving aspect ratio and MRZ readability. It then auto-orients uploads, trims obvious surrounding background when safe, calculates blur/sharpness, estimates crop visibility, scores brightness, and combines these into an image quality score. When OCR text is found but MRZ cannot be detected or parsed, the response keeps useful OCR-derived fields and returns user-friendly warnings plus suggested actions. API responses also include processing timings for preprocessing, OCR, MRZ parsing, validation, and total extraction time.

## Setup

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
npm --prefix backend install
```

Create frontend environment config:

```bash
copy .env.example .env
```

Create backend environment config:

```bash
copy backend\.env.example backend\.env
```

## Google Cloud Vision Configuration

Enable the Cloud Vision API in your Google Cloud project, then configure one of these backend credential options:

```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
```

or:

```env
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id"}
GOOGLE_CLOUD_PROJECT_ID=your-google-cloud-project-id
```

Do not place service account JSON files in `src/` or expose them with `VITE_` variables.

## Run Locally

Start the backend API:

```bash
npm run dev:backend
```

Start the React frontend in a second terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

## Build

Create a production frontend build:

```bash
npm run build
```

Run the backend in production mode:

```bash
npm run start:backend
```

Preview the frontend build locally:

```bash
npm run preview
```

## Deployment

### Vercel Frontend

1. Import the project into Vercel.
2. Set the framework preset to Vite.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.
5. Add `VITE_API_BASE_URL` pointing to the deployed backend API.

### Backend

Deploy the `backend/` folder to a Node-capable host such as Google Cloud Run, Render, Railway, Fly.io, or a VM. Configure `PORT`, `CORS_ORIGIN`, and Google Cloud credentials in the backend environment. `CORS_ORIGIN` accepts a comma-separated list of frontend origins.

### Netlify Frontend

1. Import the repository into Netlify.
2. Use `npm run build` as the build command.
3. Use `dist` as the publish directory.
4. Add `VITE_API_BASE_URL` pointing to the deployed backend API.

## Limitations

- The first production OCR implementation uses Google Vision OCR and MRZ parsing, not Google Document AI.
- Extraction quality depends on MRZ readability. Blurry, cropped, glared, or partially hidden MRZ lines may fail.
- Current parsing targets TD3 passport MRZ. Other identity document formats need additional parsers.
- Visual-zone fields are used as consistency signals; MRZ remains the authoritative extraction source.
- Image storage is not enabled by default. Add Google Cloud Storage only if you need temporary audit files or asynchronous processing.

## Future Improvements

- Add Google Document AI identity document processing as the primary extractor and keep Vision as fallback.
- Add stronger perspective correction and dedicated MRZ-region enhancement before OCR.
- Add automated tests for MRZ parsing, check digits, validation scoring, and API error paths.
- Add encrypted history or server-side audit trails if compliance requirements demand it.
- Add support for non-TD3 identity documents and human review queues.
