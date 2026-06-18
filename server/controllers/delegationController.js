const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * GET /api/delegations
 * Fetch delegations for the current user (either created by them or assigned to them)
 */
exports.getDelegations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Get delegations where user is delegator or delegatee
    const [rows] = await pool.execute(`
      SELECT d.*, 
             u1.full_name as delegator_name, 
             u2.full_name as delegatee_name 
      FROM delegations d
      JOIN employees u1 ON d.delegator_id = u1.id
      JOIN employees u2 ON d.delegatee_id = u2.id
      WHERE d.delegator_id = ? OR d.delegatee_id = ?
      ORDER BY d.created_at DESC
    `, [userId, userId]);

    res.json({ status: 'success', delegations: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/delegations
 * Create a new delegation
 */
exports.createDelegation = async (req, res, next) => {
  try {
    const { delegatee_id, start_date, end_date } = req.body;
    const delegator_id = req.user.id;

    if (!delegatee_id || !start_date || !end_date) {
      throw new AppError('Please provide delegatee, start date, and end date', 400);
    }

    if (delegator_id == delegatee_id) {
      throw new AppError('Cannot delegate to yourself', 400);
    }

    // Insert new delegation
    await pool.execute(`
      INSERT INTO delegations (delegator_id, delegatee_id, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [delegator_id, delegatee_id, start_date, end_date]);

    // Log the audit
    await pool.execute(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [delegator_id, 'CREATE_DELEGATION', 'delegation', 0, JSON.stringify({ delegatee_id, start_date, end_date }), req.ip]
    );

    res.status(201).json({ status: 'success', message: 'Delegation created successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/delegations/:id/cancel
 * Cancel an active delegation
 */
exports.cancelDelegation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [existing] = await pool.execute('SELECT * FROM delegations WHERE id = ?', [id]);
    if (existing.length === 0) {
      throw new AppError('Delegation not found', 404);
    }

    if (existing[0].delegator_id !== userId) {
      throw new AppError('You can only cancel your own delegations', 403);
    }

    await pool.execute('UPDATE delegations SET is_active = 0 WHERE id = ?', [id]);

    await pool.execute(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, 'CANCEL_DELEGATION', 'delegation', id, '{}', req.ip]
    );

    res.json({ status: 'success', message: 'Delegation cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/delegations/eligible-users
 * Fetch users that the current user can delegate to
 */
exports.getEligibleUsers = async (req, res, next) => {
  try {
    // Basic logic: can delegate to people in same department or same role
    // For simplicity, let's just return all active employees except oneself
    const userId = req.user.id;
    const [rows] = await pool.execute(`
      SELECT id, full_name, email, role 
      FROM employees 
      WHERE is_active = 1 AND id != ?
      ORDER BY full_name ASC
    `, [userId]);

    res.json({ status: 'success', users: rows });
  } catch (err) {
    next(err);
  }
};
