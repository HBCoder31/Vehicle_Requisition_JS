const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'vehicle_requisition_portal'
  });
  
  const [res] = await conn.execute(
    `UPDATE employees SET department_id = 5 WHERE role IN ('COO', 'Garage', 'Admin')`
  );
  console.log('Affected rows:', res.affectedRows);
  await conn.end();
}

fix().catch(console.error);
