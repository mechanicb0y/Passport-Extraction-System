export const guideSections = [
  {
    title: "Local workflow",
    items: [
      "Upload or capture a passport image.",
      "Run the client-side simulation.",
      "Review confidence, validation, and face/name matching.",
      "Edit extracted fields before exporting or saving."
    ]
  },
  {
    title: "Quality checklist",
    items: [
      "Use a straight, uncropped passport bio page.",
      "Keep glare away from the MRZ lines.",
      "Retake photos with blurred text or blocked portrait areas.",
      "Compare expiry and country badges before saving."
    ]
  },
  {
    title: "Privacy model",
    items: [
      "Files stay in the browser session.",
      "History is saved only to localStorage on this device.",
      "Exports are generated with Blob URLs in the browser.",
      "No remote OCR, analytics, or identity API calls are used."
    ]
  }
];

export const validationExplainers = [
  {
    label: "Passport pattern",
    description: "Checks the extracted number against the detected country's expected format."
  },
  {
    label: "MRZ integrity",
    description: "Confirms both MRZ rows are present and shaped like ICAO passport lines."
  },
  {
    label: "Date logic",
    description: "Reviews issue, birth, and expiry dates for chronology and active validity."
  },
  {
    label: "Face/name match",
    description: "Scores whether portrait-area quality and document-name consistency look aligned."
  }
];
