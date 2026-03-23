function success(res, data = null, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function created(res, data = null, message = "Created") {
  return res.status(201).json({
    success: true,
    message,
    data
  });
}

function error(res, message = "Internal error", statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  success,
  created,
  error
};