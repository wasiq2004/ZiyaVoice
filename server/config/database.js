const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load env vars (Railway injects them automatically)
dotenv.config();

// 🚨 Log to verify Railway is sending vars
console.log("MYSQL ENV:", {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  db: process.env.MYSQL_DATABASE
});

// ❌ REMOVE ALL DEFAULT VALUES — very important
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10
};

const mysqlPool = mysql.createPool(MYSQL_CONFIG);

module.exports = mysqlPool;
