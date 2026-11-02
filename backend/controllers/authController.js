const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getPool } = require("../config/mysql");
const { ok, fail } = require("../utils/response");

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return fail(res, 400, "Email and password are required");
  const [rows] = await getPool().execute(
    `SELECT u.User_ID, u.Full_Name, u.Email, u.Password_Hash, u.Status, r.Role_Name
     FROM \`user\` u JOIN role r ON r.Role_ID = u.Role_ID WHERE u.Email = ? LIMIT 1`,
    [String(email).trim().toLowerCase()]
  );
  if (!rows.length || rows[0].Status !== "Active") return fail(res, 401, "Invalid email or password");
  const valid = await bcrypt.compare(password, rows[0].Password_Hash);
  if (!valid) return fail(res, 401, "Invalid email or password");
  const user = rows[0];
  const token = jwt.sign({ userId: user.User_ID }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
  return ok(res, {
    token,
    user: { User_ID: user.User_ID, Full_Name: user.Full_Name, Email: user.Email, Role_Name: user.Role_Name }
  });
}

async function me(req, res) {
  return ok(res, { user: req.user });
}

module.exports = { login, me };
