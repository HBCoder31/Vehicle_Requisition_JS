require('dotenv').config();
const { pool } = require('./config/db');

async function restore() {
  console.log('Restoring GM-HR users to HR department...');
  try {
    const [result] = await pool.execute(
      `UPDATE employees 
       SET department_id = (SELECT id FROM departments WHERE code = 'HR') 
       WHERE role = 'GM-HR'`
    );
    console.log(`Successfully updated ${result.affectedRows} GM-HR users to HR department.`);
  } catch (err) {
    console.error('Failed to restore GM-HR users:', err);
  } finally {
    pool.end();
  }
}

restore();
