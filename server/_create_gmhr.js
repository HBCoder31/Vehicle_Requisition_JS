const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'hY674kTcLkQrURD.root',
    password: 'SWtIOAzH3E8hKuyi',
    database: 'test',
    ssl: { rejectUnauthorized: true }
  });

  // Check existing users
  const [users] = await conn.query("SELECT id, employee_number, email, full_name, role, department_id FROM employees ORDER BY id");
  console.log('=== Existing Users ===');
  users.forEach(u => console.log(`ID:${u.id} | ${u.employee_number} | ${u.email} | ${u.full_name} | Role:${u.role} | Dept:${u.department_id}`));

  // Create GM-HR user with password 'password123'
  const password = 'password123';
  const hash = await bcrypt.hash(password, 12);
  
  // Find max employee number
  const maxNum = users.reduce((max, u) => {
    const num = parseInt(u.employee_number?.replace('EMP', '') || '0');
    return num > max ? num : max;
  }, 0);
  const newEmpNum = 'EMP' + String(maxNum + 1).padStart(3, '0');

  console.log('\n=== Creating GM-HR User ===');
  console.log('Employee Number:', newEmpNum);
  
  await conn.query(
    "INSERT INTO employees (employee_number, email, password_hash, full_name, role, department_id, is_active) VALUES (?, ?, ?, ?, 'GM-HR', 1, 1)",
    [newEmpNum, 'gmhr@orientpaper.com', hash, 'GM-HR Manager']
  );

  const [newUser] = await conn.query("SELECT id, employee_number, email, full_name, role FROM employees WHERE role = 'GM-HR'");
  console.log('Created:', JSON.stringify(newUser[0]));
  console.log('\nCredentials:');
  console.log('  Employee Number:', newUser[0].employee_number);
  console.log('  Email:', newUser[0].email);
  console.log('  Password:', password);

  await conn.end();
})().catch(e => console.error('Error:', e.message));
