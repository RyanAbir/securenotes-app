const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  return res.status(statusCode).json({
    message: isClientError
      ? err.message || "Request failed"
      : "Internal server error",
  });
};

module.exports = errorHandler;
