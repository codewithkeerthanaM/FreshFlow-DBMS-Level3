const mysql = require("mysql2/promise");

let pool;

async function connectMySQL() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "freshflow_d",
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: true
  });
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  console.log("MySQL connected:", process.env.MYSQL_DATABASE || "freshflow_d");
  return pool;
}

function getPool() {
  if (!pool) throw new Error("MySQL pool is not initialized");
  return pool;
}

async function closeMySQL() {
  if (pool) await pool.end();
  pool = undefined;
}

module.exports = { connectMySQL, getPool, closeMySQL };
