const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'hY674kTcLkQrURD.root',
    password: 'SWtIOAzH3E8hKuyi',
    database: 'test',
    ssl: { rejectUnauthorized: true }
  });

  console.log('1. Altering employees role enum to include GM-HR...');
  await conn.query(`
    ALTER TABLE employees MODIFY COLUMN role 
    ENUM('Employee','HOD','GM-HR','COO','Garage','Admin') NOT NULL DEFAULT 'Employee'
  `);
  console.log('   ✅ Done');

  console.log('2. Altering vehicle_requests status enum to include GM-HR statuses...');
  await conn.query(`
    ALTER TABLE vehicle_requests MODIFY COLUMN status 
    ENUM('Pending_HOD','Approved_HOD','Rejected_HOD',
         'Pending_GM_HR','Approved_GM_HR','Rejected_GM_HR',
         'Pending_COO','Approved_COO','Rejected_COO',
         'Vehicle_Assigned','In_Transit','Completed','Cancelled','Deleted') 
    NOT NULL DEFAULT 'Pending_HOD'
  `);
  console.log('   ✅ Done');

  // Verify
  console.log('\n--- Verification ---');
  const [roleCols] = await conn.query("SHOW COLUMNS FROM employees LIKE 'role'");
  console.log('employees.role:', roleCols[0].Type);
  const [statusCols] = await conn.query("SHOW COLUMNS FROM vehicle_requests LIKE 'status'");
  console.log('vehicle_requests.status:', statusCols[0].Type);

  await conn.end();
  console.log('\n✅ All migrations complete!');
})().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
