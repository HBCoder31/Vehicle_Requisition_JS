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
  const [rows] = await conn.query("SELECT id, employee_number, email, full_name, role FROM employees WHERE role = 'GM-HR'");
  if (rows.length === 0) {
    console.log('No GM-HR user found in the database.');
  } else {
    console.log('GM-HR Users:');
    rows.forEach(r => console.log(JSON.stringify(r)));
  }
  await conn.end();
})().catch(e => console.error(e.message));
