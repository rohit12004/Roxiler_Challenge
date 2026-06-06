const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'roxiler_user',
  password: process.env.DB_PASSWORD || 'roxiler_password',
  database: process.env.DB_NAME || 'roxiler_challenge',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connection pool established successfully.');
    connection.release();
  } catch (error) {
    console.error('Unable to connect to the MySQL database:', error.message);
  }
})();

module.exports = pool;
