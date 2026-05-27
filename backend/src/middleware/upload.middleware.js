import multer from "multer";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/bmp"]);
const maxImageSizeBytes = 5 * 1024 * 1024;

export const uploadPassportImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxImageSizeBytes,
    files: 1
  },
  fileFilter: (_request, file, callback) => {
    if (!acceptedImageTypes.has(file.mimetype)) {
      const error = new Error("Unsupported image type. Use JPG, PNG, WEBP, or BMP.");
      error.statusCode = 415;
      callback(error);
      return;
    }

    callback(null, true);
  }
});
