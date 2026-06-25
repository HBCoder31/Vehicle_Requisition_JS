const { pool } = require('../config/db');
const catchAsync = require('../utils/catchAsync');

exports.globalSearch = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ status: 'success', data: { requests: [], vehicles: [], drivers: [] } });

  const searchParam = `%${q}%`;

  const [requests] = await pool.execute(
    `SELECT id, destination, status FROM vehicle_requests 
     WHERE destination LIKE ? OR purpose LIKE ? LIMIT 5`,
    [searchParam, searchParam]
  );

  const [vehicles] = await pool.execute(
    `SELECT id, registration_no, make, model FROM vehicles 
     WHERE registration_no LIKE ? OR make LIKE ? LIMIT 5`,
    [searchParam, searchParam]
  );

  const [drivers] = await pool.execute(
    `SELECT id, full_name, employee_number FROM drivers 
     WHERE is_deleted = 0 AND (full_name LIKE ? OR employee_number LIKE ?) LIMIT 5`,
    [searchParam, searchParam]
  );

  res.json({
    status: 'success',
    data: {
      requests,
      vehicles,
      drivers
    }
  });
});
