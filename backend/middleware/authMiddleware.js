const jwt = require("jsonwebtoken");
const { getPool } = require("../config/mysql");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await getPool().execute(
      `SELECT u.User_ID, u.Full_Name, u.Email, u.Status, r.Role_Name
       FROM \`user\` u JOIN role r ON r.Role_ID = u.Role_ID
       WHERE u.User_ID = ? LIMIT 1`,
      [payload.userId]
    );
    if (!rows.length || rows[0].Status !== "Active") {
      return res.status(401).json({ success: false, message: "User is inactive or no longer exists" });
    }
    req.user = {
      id: rows[0].User_ID,
      name: rows[0].Full_Name,
      email: rows[0].Email,
      role: rows[0].Role_Name
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
