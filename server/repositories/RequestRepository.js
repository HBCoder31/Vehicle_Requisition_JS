const { pool } = require('../config/db');

class RequestRepository {
  async getDepartmentIdByEmployee(employeeId) {
    const [rows] = await pool.execute(
      'SELECT department_id FROM employees WHERE id = ?',
      [employeeId]
    );
    return rows.length > 0 ? rows[0].department_id : null;
  }

  async createRequest(data, initialStatus = 'Pending_HOD') {
    const [result] = await pool.execute(
      `INSERT INTO vehicle_requests 
        (employee_id, department_id, purpose, pickup_location, destination, travel_type, passengers, 
         travel_date, travel_time, return_date, return_time, status, work_type,
         want_ticket, mode_of_transport, ticket_from, ticket_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.department_id,
        data.purpose,
        data.pickup_location,
        data.destination,
        data.travel_type,
        data.passengers || 1,
        data.travel_date,
        data.travel_time,
        data.return_date || null,
        data.return_time || null,
        initialStatus,
        data.work_type || 'Company',
        data.want_ticket ? 1 : 0,
        data.mode_of_transport || null,
        data.ticket_from || null,
        data.ticket_to || null
      ]
    );
    return result.insertId;
  }

  async updateRequestDetails(id, data) {
    const [result] = await pool.execute(
      `UPDATE vehicle_requests 
       SET purpose = ?, pickup_location = ?, destination = ?, travel_type = ?, 
           passengers = ?, travel_date = ?, travel_time = ?, return_date = ?, return_time = ?,
           work_type = ?, want_ticket = ?, mode_of_transport = ?, ticket_from = ?, ticket_to = ?
       WHERE id = ?`,
      [
        data.purpose,
        data.pickup_location,
        data.destination,
        data.travel_type,
        data.passengers || 1,
        data.travel_date,
        data.travel_time,
        data.return_date || null,
        data.return_time || null,
        data.work_type || 'Company',
        data.want_ticket ? 1 : 0,
        data.mode_of_transport || null,
        data.ticket_from || null,
        data.ticket_to || null,
        id
      ]
    );
    return result.affectedRows > 0;
  }

  async getRequestsByEmployee(employeeId, filters = {}) {
    let query = `
      SELECT vr.*, v.registration_no, v.make AS vehicle_make, v.model AS vehicle_model,
              d.name AS department_name
       FROM vehicle_requests vr
       LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
       LEFT JOIN departments d ON vr.department_id = d.id
       WHERE vr.employee_id = ?
    `;
    const params = [employeeId];

    if (filters.from_date) {
      query += ` AND DATE(vr.created_at) >= ?`;
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      query += ` AND DATE(vr.created_at) <= ?`;
      params.push(filters.to_date);
    }
    if (filters.type) {
      query += ` AND vr.travel_type LIKE ?`;
      params.push(`%${filters.type}%`);
    }

    query += ` ORDER BY vr.created_at DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getRequestById(id) {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.email AS requester_email, e.role AS requester_role,
              v.registration_no, v.make AS vehicle_make, v.model AS vehicle_model,
              d.name AS department_name,
              COALESCE(hod.full_name, IF(d.code = 'HR', (SELECT full_name FROM employees WHERE role = 'GM-HR' LIMIT 1), NULL)) AS hod_name,
              coo.full_name AS coo_name,
              drv.phone AS driver_phone
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
       LEFT JOIN departments d ON vr.department_id = d.id
       LEFT JOIN employees hod ON vr.hod_action_by = hod.id
       LEFT JOIN employees coo ON vr.coo_action_by = coo.id
       LEFT JOIN drivers drv ON vr.assigned_driver_id = drv.id
       WHERE vr.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async updateRequestStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE vehicle_requests SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  async getAllRequests(filters, limit, offset) {
    let query = `
      SELECT vr.*,
             e.full_name AS requester_name,
             d.name AS department_name,
             v.registration_no
      FROM vehicle_requests vr
      JOIN employees e ON vr.employee_id = e.id
      LEFT JOIN departments d ON vr.department_id = d.id
      LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND vr.status = ?';
      params.push(filters.status);
    }
    if (filters.department_id) {
      query += ' AND vr.department_id = ?';
      params.push(parseInt(filters.department_id));
    }

    query += ' ORDER BY vr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM vehicle_requests WHERE 1=1';
    const countParams = [];
    if (filters.status) { countQuery += ' AND status = ?'; countParams.push(filters.status); }
    if (filters.department_id) { countQuery += ' AND department_id = ?'; countParams.push(parseInt(filters.department_id)); }

    const [countRows] = await pool.execute(countQuery, countParams);

    return {
      rows,
      total: countRows[0].total
    };
  }

  async searchAirports(queryStr) {
    const q = `%${queryStr.toUpperCase()}%`;
    const qLower = `%${queryStr}%`;
    const [rows] = await pool.execute(
      `SELECT name, city, iata_code FROM indian_airports 
       WHERE UPPER(name) LIKE ? OR UPPER(city) LIKE ? OR UPPER(iata_code) LIKE ?
       LIMIT 15`,
      [q, q, q]
    );
    return rows;
  }

  async searchRailwayStations(queryStr) {
    const q = `%${queryStr.toUpperCase()}%`;
    const [rows] = await pool.execute(
      `SELECT name, code, state FROM indian_railway_stations 
       WHERE UPPER(name) LIKE ? OR UPPER(code) LIKE ?
       LIMIT 15`,
      [q, q]
    );
    return rows;
  }
}

module.exports = new RequestRepository();
