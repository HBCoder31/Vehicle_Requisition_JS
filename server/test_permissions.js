const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./config/db');
const delegationUtil = require('./utils/delegationUtil');

async function test() {
  try {
    console.log('--- DEPARTMENTS ---');
    const [depts] = await pool.execute('SELECT * FROM departments');
    console.table(depts);

    console.log('--- ACTIVE DELEGATIONS FOR NEHA (ID 5) ---');
    const [delegations] = await pool.execute(`
      SELECT d.*, u1.full_name as delegator_name, u2.full_name as delegatee_name 
      FROM delegations d
      JOIN employees u1 ON d.delegator_id = u1.id
      JOIN employees u2 ON d.delegatee_id = u2.id
      WHERE d.delegatee_id = 5
    `);
    console.table(delegations);

    console.log('--- EFFECTIVE PERMISSIONS FOR NEHA (ID 5) ---');
    const perms = await delegationUtil.getEffectivePermissions(5);
    console.log(perms);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
