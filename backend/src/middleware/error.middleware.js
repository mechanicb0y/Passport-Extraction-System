export function notFoundHandler(request, _response, next) {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _request, response, _next) {
  const isMulterLimit = error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE";
  const statusCode = isMulterLimit ? 413 : error.statusCode || 500;
  const message = isMulterLimit
    ? "Passport image must be 5MB or smaller."
    : error.publicMessage || error.message || "Unexpected server error.";

  if (statusCode >= 500) {
    console.error("[passport-extraction-backend]", {
      statusCode,
      message: error.message || "Unexpected server error."
    });
  }

  response.status(statusCode).json({
    error: {
      message,
      statusCode
    }
  });
}
