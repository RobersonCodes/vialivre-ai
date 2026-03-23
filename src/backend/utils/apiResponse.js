function successResponse(
  res,
  data = null,
  message = "Success",
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function errorResponse(
  res,
  message = "Internal error",
  statusCode = 500
) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  successResponse,
  errorResponse
};