function successResponse(res, data = null, message = "Sucesso", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

module.exports = {
  successResponse
};