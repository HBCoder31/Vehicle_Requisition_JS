const { pool } = require('../config/db');

/**
 * Returns the effective roles and department IDs a user has access to,
 * considering their own profile and any active delegations assigned to them.
 */
exports.getEffectivePermissions = async (userId) => {
  const [userRows] = await pool.execute('SELECT role, department_id FROM employees WHERE id = ?', [userId]);
  if (userRows.length === 0) return { roles: [], departmentIds: [] };

  const ownRole = userRows[0].role;
  const ownDept = userRows[0].department_id;

  const roles = new Set([ownRole]);
  const departmentIds = new Set();
  if (ownDept) departmentIds.add(ownDept);

  // Fetch active delegations WHERE delegatee_id = userId
  // start_date <= CURDATE() AND end_date >= CURDATE() AND is_active = 1
  const [delegations] = await pool.execute(`
    SELECT e.role, e.department_id 
    FROM delegations d
    JOIN employees e ON d.delegator_id = e.id
    WHERE d.delegatee_id = ? 
      AND d.is_active = 1
      AND CURDATE() BETWEEN d.start_date AND d.end_date
  `, [userId]);

  for (const d of delegations) {
    roles.add(d.role);
    if (d.department_id) {
      departmentIds.add(d.department_id);
    }
  }

  return {
    roles: Array.from(roles),
    departmentIds: Array.from(departmentIds)
  };
};
