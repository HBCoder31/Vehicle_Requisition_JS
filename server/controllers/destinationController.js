const { pool } = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const AuditRepository = require('../repositories/AuditRepository');

/**
 * Utility: Insert an audit log entry.
 */
async function logAudit(actorId, action, entityType, entityId, details, ipAddress) {
  await AuditRepository.createLog(actorId, action, entityType, entityId, details, ipAddress);
}

// GET /api/destinations
exports.getAllDestinations = catchAsync(async (req, res) => {
  // If user is Admin, return all. If employee, return only active.
  const query = req.user.role === 'Admin'
    ? 'SELECT * FROM destinations ORDER BY name ASC'
    : 'SELECT * FROM destinations WHERE is_active = 1 ORDER BY name ASC';
  const [rows] = await pool.execute(query);
  res.json({ destinations: rows });
});

// POST /api/destinations
exports.createDestination = catchAsync(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new AppError('Destination name is required.', 400);
  }

  // Check unique name
  const [existing] = await pool.execute('SELECT id FROM destinations WHERE name = ?', [name.trim()]);
  if (existing.length > 0) {
    throw new AppError('A destination with this name already exists.', 409);
  }

  const [result] = await pool.execute(
    'INSERT INTO destinations (name, is_active) VALUES (?, 1)',
    [name.trim()]
  );

  await logAudit(req.user.id, 'CREATE_DESTINATION', 'destination', result.insertId, { name }, req.ip);

  res.status(201).json({
    message: 'Destination created successfully.',
    destination: { id: result.insertId, name: name.trim(), is_active: 1 }
  });
});

// PUT /api/destinations/:id
exports.updateDestination = catchAsync(async (req, res) => {
  const { name, is_active } = req.body;
  const { id } = req.params;

  const [existing] = await pool.execute('SELECT * FROM destinations WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('Destination not found.', 404);
  }

  if (name && name.trim()) {
    // Check unique name excluding this id
    const [dup] = await pool.execute('SELECT id FROM destinations WHERE name = ? AND id != ?', [name.trim(), id]);
    if (dup.length > 0) {
      throw new AppError('A destination with this name already exists.', 409);
    }
  }

  let query = 'UPDATE destinations SET ';
  const params = [];
  if (name !== undefined) { query += 'name = ?, '; params.push(name.trim()); }
  if (is_active !== undefined) { query += 'is_active = ?, '; params.push(is_active ? 1 : 0); }

  query = query.slice(0, -2);
  query += ' WHERE id = ?';
  params.push(id);

  await pool.execute(query, params);

  await logAudit(req.user.id, 'UPDATE_DESTINATION', 'destination', parseInt(id), { name, is_active }, req.ip);

  res.json({ message: 'Destination updated successfully.' });
});

// PATCH /api/destinations/:id/status
exports.toggleDestinationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.execute('SELECT * FROM destinations WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('Destination not found.', 404);
  }

  const newStatus = existing[0].is_active ? 0 : 1;
  await pool.execute('UPDATE destinations SET is_active = ? WHERE id = ?', [newStatus, id]);

  await logAudit(req.user.id, newStatus ? 'RESTORE_DESTINATION' : 'DEACTIVATE_DESTINATION', 'destination', parseInt(id), {}, req.ip);

  res.json({ message: `Destination ${newStatus ? 'activated' : 'deactivated'} successfully.`, is_active: newStatus });
});

// DELETE /api/destinations/:id
exports.deleteDestination = catchAsync(async (req, res) => {
  const { id } = req.params;
  const [existing] = await pool.execute('SELECT * FROM destinations WHERE id = ?', [id]);
  if (existing.length === 0) {
    throw new AppError('Destination not found.', 404);
  }

  // Hard delete
  await pool.execute('DELETE FROM destinations WHERE id = ?', [id]);

  await logAudit(req.user.id, 'DELETE_DESTINATION', 'destination', parseInt(id), {}, req.ip);

  res.json({ message: 'Destination deleted successfully.' });
});
