const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./config/db');

async function check() {
  try {
    const [rows] = await pool.execute('SHOW CREATE TABLE vehicle_requests');
    console.log(rows[0]['Create Table']);
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    process.exit();
  }
}
check();
