require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  console.log('--- STARTING BAMBOO DEPARTMENT MIGRATION ---');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Create Bamboo department if not exists
    console.log('Inserting Bamboo department...');
    await conn.execute(
      `INSERT INTO departments (name, code) VALUES ('Bamboo', 'BAMBOO')
       ON DUPLICATE KEY UPDATE name=name`
    );

    // 2. Fetch old HR and new Bamboo department IDs
    const [[hrDept]] = await conn.execute("SELECT id FROM departments WHERE code = 'HR'");
    const [[bambooDept]] = await conn.execute("SELECT id FROM departments WHERE code = 'BAMBOO'");

    if (!hrDept || !bambooDept) {
      throw new Error('Could not find HR or Bamboo department IDs');
    }

    const hrId = hrDept.id;
    const bambooId = bambooDept.id;
    console.log(`HR Department ID: ${hrId}, Bamboo Department ID: ${bambooId}`);

    // 3. Shift employees of HR department to Bamboo department
    console.log('Migrating employees from HR to Bamboo...');
    const [empUpdateResult] = await conn.execute(
      `UPDATE employees SET department_id = ? WHERE department_id = ?`,
      [bambooId, hrId]
    );
    console.log(`Shifted ${empUpdateResult.affectedRows} employees to Bamboo.`);

    // 4. Shift vehicle requests of HR department to Bamboo department
    console.log('Migrating vehicle requests from HR to Bamboo...');
    const [reqUpdateResult] = await conn.execute(
      `UPDATE vehicle_requests SET department_id = ? WHERE department_id = ?`,
      [bambooId, hrId]
    );
    console.log(`Shifted ${reqUpdateResult.affectedRows} vehicle requests to Bamboo.`);

    // 5. Shift department budgets of HR to Bamboo (if any)
    console.log('Checking for department budgets to migrate...');
    const [budgetUpdateResult] = await conn.execute(
      `UPDATE department_budgets SET department_id = ? WHERE department_id = ?`,
      [bambooId, hrId]
    ).catch(err => {
      console.log('No budgets table or update failed (non-critical):', err.message);
      return [{ affectedRows: 0 }];
    });
    console.log(`Shifted ${budgetUpdateResult.affectedRows} budget logs to Bamboo.`);

    await conn.commit();
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Migration failed:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
