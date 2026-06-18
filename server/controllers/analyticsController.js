const AnalyticsService = require('../services/AnalyticsService');
const catchAsync = require('../utils/catchAsync');

exports.getDashboardMetrics = catchAsync(async (req, res) => {
  const metrics = await AnalyticsService.getDashboardMetrics();
  res.json({
    status: 'success',
    data: metrics
  });
});

exports.exportRequests = catchAsync(async (req, res) => {
  const { pool } = require('../config/db');

  const [rows] = await pool.execute(`
    SELECT vr.id, vr.purpose, vr.destination, vr.travel_date, vr.status, 
           e.full_name as requester_name, d.name as department_name,
           v.registration_no
    FROM vehicle_requests vr
    JOIN employees e ON vr.employee_id = e.id
    LEFT JOIN departments d ON vr.department_id = d.id
    LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
    ORDER BY vr.created_at DESC
  `);

  const fields = ['id', 'purpose', 'destination', 'travel_date', 'status', 'requester_name', 'department_name', 'registration_no'];
  
  // Manual CSV conversion
  const replacer = (key, value) => value === null ? '' : value; 
  const csv = [
    fields.join(','), // Header row
    ...rows.map(row => 
      fields.map(fieldName => 
        JSON.stringify(row[fieldName], replacer)
      ).join(',')
    )
  ].join('\r\n');

  res.header('Content-Type', 'text/csv');
  res.attachment('requests_export.csv');
  return res.send(csv);
});
