function ok(res, data, status = 200, message) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
}

function fail(res, status, message, details) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = { ok, fail };
