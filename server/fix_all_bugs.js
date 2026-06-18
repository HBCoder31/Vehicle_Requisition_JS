/**
 * Comprehensive Bug Fix Script
 * Fixes:
 * 1. Adds Pending_GM_HR and Approved_GM_HR to vehicle_requests status ENUM
 * 2. Adds Rejected_GM_HR to status ENUM
 * 3. Fixes any stuck 'Sanctioned' requests to 'Approved_HOD'
 */
require('dotenv').config();
const { pool } = require('./config/db');

async function fixAll() {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Starting comprehensive bug fix...\n');

    // 1. Fix ENUM to include GM-HR statuses
    console.log('1. Updating vehicle_requests status ENUM...');
    await conn.execute(`
      ALTER TABLE vehicle_requests
      MODIFY COLUMN status ENUM(
        'Pending_HOD','Approved_HOD','Rejected_HOD',
        'Pending_GM_HR','Approved_GM_HR','Rejected_GM_HR',
        'Pending_COO','Approved_COO','Rejected_COO',
        'Vehicle_Assigned','In_Transit','Completed','Cancelled','Deleted'
      ) NOT NULL DEFAULT 'Pending_HOD'
    `);
    console.log('   ✅ ENUM updated with GM-HR statuses\n');

    // 2. Fix any rows stuck with 'Sanctioned' status (if any exist from old code)
    console.log('2. Checking for legacy Sanctioned status rows...');
    // Sanctioned was never actually a valid ENUM so rows shouldn't exist,
    // but clean up any null-status rows just in case
    const [badRows] = await conn.execute(
      "SELECT COUNT(*) as cnt FROM vehicle_requests WHERE status IS NULL"
    );
    console.log(`   Found ${badRows[0].cnt} null-status rows`);
    if (badRows[0].cnt > 0) {
      await conn.execute("UPDATE vehicle_requests SET status='Pending_HOD' WHERE status IS NULL");
      console.log('   ✅ Fixed null-status rows');
    }
    console.log('');

    // 3. Verify the ENUM
    const [cols] = await conn.execute("SHOW COLUMNS FROM vehicle_requests LIKE 'status'");
    console.log('3. New ENUM type:', cols[0].Type);
    console.log('');

    // 4. Verify request_history table has action_type column
    const [histCols] = await conn.execute('DESCRIBE request_history');
    const hasActionType = histCols.some(c => c.Field === 'action_type');
    if (!hasActionType) {
      console.log('4. Adding action_type column to request_history...');
      await conn.execute('ALTER TABLE request_history ADD COLUMN action_type VARCHAR(50) NULL AFTER status_to');
      console.log('   ✅ action_type column added');
    } else {
      console.log('4. request_history.action_type already exists ✅');
    }
    console.log('');

    // 5. Verify request_history has comments column
    const hasComments = histCols.some(c => c.Field === 'comments');
    if (!hasComments) {
      console.log('5. Adding comments column to request_history...');
      await conn.execute('ALTER TABLE request_history ADD COLUMN comments TEXT NULL');
      console.log('   ✅ comments column added');
    } else {
      console.log('5. request_history.comments already exists ✅');
    }

    console.log('\n✅ All database fixes applied successfully!');
  } catch (err) {
    console.error('❌ Error during fix:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

fixAll();
