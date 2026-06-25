const { pool } = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM employees WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async findByIdentifier(identifier) {
    const [rows] = await pool.execute('SELECT * FROM employees WHERE email = ? OR employee_number = ?', [identifier, identifier]);
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM employees WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByRoleAndDepartment(role, departmentId) {
    const [rows] = await pool.execute(`
      SELECT * FROM employees 
      WHERE role = ? AND department_id = ? 
        AND id NOT IN (
          SELECT delegator_id FROM delegations 
          WHERE is_active = 1 AND CURDATE() BETWEEN start_date AND end_date
        )
      UNION
      SELECT e2.* 
      FROM delegations d 
      JOIN employees e1 ON d.delegator_id = e1.id 
      JOIN employees e2 ON d.delegatee_id = e2.id
      WHERE e1.role = ? AND e1.department_id = ? 
        AND d.is_active = 1 
        AND CURDATE() BETWEEN d.start_date AND d.end_date
    `, [role, departmentId, role, departmentId]);
    return rows;
  }

  async findByRole(role) {
    const [rows] = await pool.execute(`
      SELECT * FROM employees 
      WHERE role = ?
        AND id NOT IN (
          SELECT delegator_id FROM delegations 
          WHERE is_active = 1 AND CURDATE() BETWEEN start_date AND end_date
        )
      UNION
      SELECT e2.* 
      FROM delegations d 
      JOIN employees e1 ON d.delegator_id = e1.id 
      JOIN employees e2 ON d.delegatee_id = e2.id
      WHERE e1.role = ? 
        AND d.is_active = 1 
        AND CURDATE() BETWEEN d.start_date AND d.end_date
    `, [role, role]);
    return rows;
  }

  async create(userData) {
    const [result] = await pool.execute(
      `INSERT INTO employees (employee_number, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userData.employee_number, userData.email, userData.password_hash, userData.full_name, userData.role || 'Employee']
    );
    return result.insertId;
  }

  async updatePassword(userId, passwordHash) {
    await pool.execute('UPDATE employees SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  }

  async logLogin(userId, ipAddress, deviceInfo, success) {
    await pool.execute(
      'INSERT INTO login_history (user_id, ip_address, device_info, success) VALUES (?, ?, ?, ?)',
      [userId || null, ipAddress || null, deviceInfo || null, success ? 1 : 0]
    );
  }

  async saveRefreshToken(userId, tokenHash, expiresAt) {
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async findRefreshToken(tokenHash) {
    const [rows] = await pool.execute(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW()',
      [tokenHash]
    );
    return rows[0] || null;
  }

  async revokeRefreshToken(tokenHash) {
    await pool.execute('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]);
  }

  async revokeAllUserTokens(userId) {
    await pool.execute('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [userId]);
  }

  async logFailedAttempt(email, ipAddress) {
    await pool.execute(
      'INSERT INTO failed_login_attempts (email, ip_address) VALUES (?, ?)',
      [email || null, ipAddress || null]
    );
  }

  async getFailedLoginCount(email, ipAddress, minutes = 15) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM failed_login_attempts 
       WHERE (email = ? OR ip_address = ?) 
       AND attempt_time > ?`,
      [email || null, ipAddress || null, cutoffTime]
    );
    return rows[0].count;
  }
}

module.exports = new UserRepository();
