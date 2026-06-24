const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const AuditRepository = require('../repositories/AuditRepository');

/**
 * Utility: Insert an audit log entry.
 */
async function logAudit(actorId, action, entityType, entityId, details, ipAddress) {
  await AuditRepository.createLog(actorId, action, entityType, entityId, details, ipAddress);
}

// ─── EMPLOYEE MANAGEMENT ───────────────────────────────────

/**
 * GET /api/admin/employees
 * List all employees with department info.
 */
async function getEmployees(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY e.is_active DESC, e.full_name ASC`
    );
    res.json({ employees: rows });
  } catch (err) {
    console.error('getEmployees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
}

/**
 * POST /api/admin/employees
 * Create a new employee.
 */
async function createEmployee(req, res) {
  try {
    const { employee_number, email, password, full_name, role, department_id, phone } = req.body;

    if (!employee_number || !email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'employee_number, email, password, full_name, and role are required.' });
    }

    const validRoles = ['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Check for duplicate email or employee_number
    const [existing] = await pool.execute(
      'SELECT id FROM employees WHERE email = ? OR employee_number = ?',
      [email, employee_number]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An employee with this email or employee number already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO employees (employee_number, email, password_hash, full_name, role, department_id, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employee_number, email, password_hash, full_name, role, department_id || null, phone || null]
    );

    await logAudit(req.user.id, 'CREATE_EMPLOYEE', 'employee', result.insertId, { employee_number, email, role }, req.ip);

    res.status(201).json({
      message: 'Employee created successfully.',
      employeeId: result.insertId,
    });
  } catch (err) {
    console.error('createEmployee error:', err);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
}

/**
 * PUT /api/admin/employees/:id
 * Update employee details/role.
 */
async function updateEmployee(req, res) {
  try {
    const { employee_number, password, full_name, role, department_id, phone, is_active } = req.body;

    const [existing] = await pool.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (role) {
      const validRoles = ['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }
    }

    let query = `UPDATE employees SET `;
    let params = [];

    if (employee_number) { query += 'employee_number = ?, '; params.push(employee_number); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += 'password_hash = ?, '; params.push(hash);
    }
    if (full_name) { query += 'full_name = ?, '; params.push(full_name); }
    if (role) { query += 'role = ?, '; params.push(role); }
    if (department_id !== undefined) { query += 'department_id = ?, '; params.push(department_id); }
    if (phone) { query += 'phone = ?, '; params.push(phone); }
    if (is_active !== undefined) { query += 'is_active = ?, '; params.push(is_active); }

    // remove trailing comma and space
    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    params.push(req.params.id);

    // Only update if there are fields to update
    if (params.length > 1) {
      await pool.execute(query, params);
      
      // hide password from audit log
      const auditData = { ...req.body };
      if (auditData.password) auditData.password = '***';
      
      await logAudit(req.user.id, 'UPDATE_EMPLOYEE', 'employee', parseInt(req.params.id), auditData, req.ip);
    }

    res.json({ message: 'Employee updated successfully.' });
  } catch (err) {
    console.error('updateEmployee error:', err);
    res.status(500).json({ error: 'Failed to update employee.' });
  }
}

/**
 * DELETE /api/admin/employees/:id
 * Soft-delete: sets is_active = 0.
 */
async function deleteEmployee(req, res) {
  try {
    const [existing] = await pool.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account.' });
    }

    await pool.execute('UPDATE employees SET is_active = 0 WHERE id = ?', [req.params.id]);

    await logAudit(req.user.id, 'DEACTIVATE_EMPLOYEE', 'employee', parseInt(req.params.id), {}, req.ip);

    res.json({ message: 'Employee deactivated successfully.' });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    res.status(500).json({ error: 'Failed to deactivate employee.' });
  }
}

// ─── AUDIT LOGS ────────────────────────────────────────────

/**
 * GET /api/admin/audit-logs
 * Paginated audit logs with optional filters.
 */
async function getAuditLogs(req, res) {
  try {
    const { action, entity_type, actor_id, from_date, to_date, employee_number, page = 1, limit = 30, sort_order = 'desc' } = req.query;
    
    const parsedLimit = parseInt(limit, 10) || 30;
    const parsedPage = parseInt(page, 10) || 1;
    const offset = (parsedPage - 1) * parsedLimit;

    let query = `
      SELECT al.*, e.full_name AS actor_name, e.email AS actor_email, e.employee_number AS actor_employee_number
      FROM audit_logs al
      LEFT JOIN employees e ON al.actor_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (action) { query += ' AND al.action = ?'; params.push(action); }
    if (entity_type) { query += ' AND al.entity_type = ?'; params.push(entity_type); }
    if (actor_id) { query += ' AND al.actor_id = ?'; params.push(parseInt(actor_id, 10)); }
    if (from_date) { query += ' AND DATE(al.created_at) >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND DATE(al.created_at) <= ?'; params.push(to_date); }
    if (employee_number) {
      query += ' AND e.employee_number LIKE ?';
      params.push(`%${employee_number}%`);
    }

    const orderDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY al.created_at ${orderDir} LIMIT ${parsedLimit} OFFSET ${offset}`;

    const [rows] = await pool.execute(query, params);
    const formattedRows = rows.map(row => {
      if (row.created_at) {
        const utcStr = row.created_at.replace(' ', 'T') + (row.created_at.endsWith('Z') ? '' : 'Z');
        row.created_at = new Date(utcStr);
      }
      return row;
    });

    // Total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN employees e ON al.actor_id = e.id
      WHERE 1=1
    `;
    const countParams = [];
    if (action) { countQuery += ' AND al.action = ?'; countParams.push(action); }
    if (entity_type) { countQuery += ' AND al.entity_type = ?'; countParams.push(entity_type); }
    if (actor_id) { countQuery += ' AND al.actor_id = ?'; countParams.push(parseInt(actor_id, 10)); }
    if (from_date) { countQuery += ' AND DATE(al.created_at) >= ?'; countParams.push(from_date); }
    if (to_date) { countQuery += ' AND DATE(al.created_at) <= ?'; countParams.push(to_date); }
    if (employee_number) {
      countQuery += ' AND e.employee_number LIKE ?';
      countParams.push(`%${employee_number}%`);
    }

    const [countRows] = await pool.execute(countQuery, countParams);

    res.json({
      logs: formattedRows,
      pagination: {
        total: countRows[0].total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(countRows[0].total / parsedLimit),
      },
    });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
}

// ─── DASHBOARD STATS ───────────────────────────────────────

/**
 * GET /api/admin/dashboard
 * System health overview for admin.
 */
async function getDashboardStats(req, res) {
  try {
    // Request stats by status
    const [statusCounts] = await pool.execute(
      'SELECT status, COUNT(*) AS count FROM vehicle_requests GROUP BY status'
    );

    // Active employee count
    const [empCount] = await pool.execute(
      'SELECT COUNT(*) AS count FROM employees WHERE is_active = 1'
    );

    // Vehicle utilization
    const [vehStats] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(is_available) AS available,
         COUNT(*) - SUM(is_available) AS in_use
       FROM vehicles`
    );

    // Department breakdown
    const [deptBreakdown] = await pool.execute(
      `SELECT d.name, COUNT(vr.id) AS request_count
       FROM departments d
       LEFT JOIN vehicle_requests vr ON d.id = vr.department_id
       GROUP BY d.id, d.name
       ORDER BY request_count DESC`
    );

    // Recent activity (last 10 audit logs)
    const [recentActivity] = await pool.execute(
      `SELECT al.*, e.full_name AS actor_name
       FROM audit_logs al
       LEFT JOIN employees e ON al.actor_id = e.id
       ORDER BY al.created_at DESC
       LIMIT 10`
    );

    const formattedActivity = recentActivity.map(log => {
      if (log.created_at) {
        const utcStr = log.created_at.replace(' ', 'T') + (log.created_at.endsWith('Z') ? '' : 'Z');
        log.created_at = new Date(utcStr);
      }
      return log;
    });

    res.json({
      requestsByStatus: statusCounts,
      employees: { active: empCount[0].count },
      vehicles: vehStats[0],
      departmentBreakdown: deptBreakdown,
      recentActivity: formattedActivity,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
}

// ─── DEPARTMENTS ───────────────────────────────────────────

/**
 * GET /api/admin/departments
 * List all departments.
 */
async function getDepartments(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM departments ORDER BY name ASC');
    res.json({ departments: rows });
  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
}

/**
 * POST /api/admin/employees/import
 * Bulk import employees from CSV data.
 */
async function importEmployees(req, res) {
  try {
    const { csvData } = req.body;
    if (!csvData) {
      return res.status(400).json({ error: 'csvData is required.' });
    }

    // Custom CSV parser handling quotes
    const parseCSV = (content) => {
      const lines = content.split(/\r?\n/);
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/^["']|["']$/g, '') : null;
        });
        results.push(row);
      }
      return results;
    };

    const parsedRows = parseCSV(csvData);
    if (parsedRows.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV.' });
    }

    // Fetch all departments to resolve department_id dynamically
    const [depts] = await pool.execute('SELECT id, name, code FROM departments');
    const deptMap = {};
    depts.forEach(d => {
      deptMap[d.code.toLowerCase()] = d.id;
      deptMap[d.name.toLowerCase()] = d.id;
      deptMap[d.id.toString()] = d.id;
    });

    const validRoles = ['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin'];
    let insertedCount = 0;
    const skipped = [];

    for (const row of parsedRows) {
      const rawEmpNo = row.employee_number || row.emp_no || row['employee number'] || row.employeenumber;
      const rawEmail = row.email || row.mail;
      const rawName = row.full_name || row.name || row['full name'] || row.fullname;
      const rawRole = row.role || 'Employee';
      const rawPassword = row.password || 'password123';
      const rawPhone = row.phone || row.phone_number || row.mobile || row['phone number'];
      const rawDept = row.department_code || row.department || row.dept || row.department_id;

      if (!rawEmpNo || !rawEmail || !rawName) {
        skipped.push({ row, reason: 'Missing required employee_number, email, or full_name.' });
        continue;
      }

      const employee_number = rawEmpNo.trim();
      const email = rawEmail.trim();
      const full_name = rawName.trim();
      const role = rawRole.trim();
      const phone = rawPhone ? rawPhone.trim() : null;

      // Validate role
      let formattedRole = validRoles.find(r => r.toLowerCase() === role.toLowerCase());
      if (!formattedRole) {
        skipped.push({ email, employee_number, reason: `Invalid role "${role}". Must be one of: ${validRoles.join(', ')}` });
        continue;
      }

      // Resolve department
      let department_id = null;
      if (rawDept) {
        const key = rawDept.trim().toLowerCase();
        if (deptMap[key]) {
          department_id = deptMap[key];
        }
      }

      // Check duplicates
      const [existing] = await pool.execute(
        'SELECT id FROM employees WHERE email = ? OR employee_number = ?',
        [email, employee_number]
      );
      if (existing.length > 0) {
        skipped.push({ email, employee_number, reason: 'Duplicate email or employee number already exists.' });
        continue;
      }

      const password_hash = await bcrypt.hash(rawPassword, 10);
      const [result] = await pool.execute(
        `INSERT INTO employees (employee_number, email, password_hash, full_name, role, department_id, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [employee_number, email, password_hash, full_name, formattedRole, department_id, phone]
      );

      await logAudit(req.user.id, 'CREATE_EMPLOYEE', 'employee', result.insertId, { employee_number, email, role: formattedRole, via: 'csv_import' }, req.ip);
      insertedCount++;
    }

    res.json({
      message: 'CSV import completed.',
      inserted: insertedCount,
      skippedCount: skipped.length,
      skipped
    });
  } catch (err) {
    console.error('importEmployees error:', err);
    res.status(500).json({ error: 'Failed to import employees from CSV.' });
  }
}

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAuditLogs,
  getDashboardStats,
  getDepartments,
  importEmployees,
};
