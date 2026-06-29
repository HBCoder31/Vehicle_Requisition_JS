require('dotenv').config();
const { pool } = require('./config/db');

async function main() {
  try {
    console.log('Starting migration to add Expired status to vehicle_requests.status ENUM...');
    await pool.execute(`
      ALTER TABLE vehicle_requests 
      MODIFY COLUMN status ENUM(
        'Pending_HOD',
        'Approved_HOD',
        'Rejected_HOD',
        'Pending_GM_HR',
        'Approved_GM_HR',
        'Rejected_GM_HR',
        'Pending_COO',
        'Approved_COO',
        'Rejected_COO',
        'Vehicle_Assigned',
        'In_Transit',
        'Completed',
        'Cancelled',
        'Deleted',
        'Vehicle Out',
        'Vehicle Returned',
        'Expired'
      ) NOT NULL DEFAULT 'Pending_HOD'
    `);
    console.log('✅ Alter table successful! Expired status added.');
  } catch (err) {
    console.error('❌ Alter table failed:', err);
  } finally {
    process.exit();
  }
}

main();
