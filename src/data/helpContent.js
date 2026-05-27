export const guideSections = [
  {
    title: "OCR workflow",
    items: [
      "Upload or capture a passport image.",
      "Send the image to the backend for Google Vision OCR.",
      "Review confidence, MRZ validation, and extracted fields.",
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
      "Google credentials stay only on the backend.",
      "Uploaded images are processed from memory by the API.",
      "History is saved only to localStorage on this device.",
      "Exports are generated with Blob URLs in the browser."
    ]
  }
];

export const validationExplainers = [
  {
    label: "Passport pattern",
    description: "Reads the passport number from TD3 MRZ positions and validates its ICAO check digit."
  },
  {
    label: "MRZ integrity",
    description: "Confirms both passport MRZ rows are present, 44 characters long, and use valid MRZ characters."
  },
  {
    label: "Date logic",
    description: "Parses YYMMDD MRZ dates, validates check digits, and confirms the passport is not expired."
  },
  {
    label: "Country codes",
    description: "Verifies issuing country and nationality against known ISO/ICAO country codes when possible."
  }
];
