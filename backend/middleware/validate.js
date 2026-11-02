const { validationResult } = require("express-validator");
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: "Validation failed", details: errors.array() });
  next();
}
module.exports = { validate };
