const mysql = require('mysql2/promise');

/**
 * MySQL Connection Pool
 * 
 * Singleton pool instance shared across the application.
 * Uses mysql2/promise for async/await support.
 * All queries should use pool.execute() for prepared statements (SQL injection safe).
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vehicle_requisition_portal',

  // SSL support for cloud databases (required by TiDB Cloud, Aiven, etc.)
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? {
    rejectUnauthorized: false // Safe for school projects, bypasses custom CA file requirements
  } : undefined,

  // Pool settings
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,

  // Keep connections alive to avoid stale connection errors
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Timezone handling
  timezone: '+00:00',

  // Return dates as strings to avoid timezone shifting
  dateStrings: true,
});

/**
 * Test the database connection on startup.
 * Logs success or failure without crashing the server.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check your .env DB_* settings and ensure MySQL is running.');
  }
}

module.exports = { pool, testConnection };
