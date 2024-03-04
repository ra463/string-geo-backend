exports.error = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.message = `${field} already exists`;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
