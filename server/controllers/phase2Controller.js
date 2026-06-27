const Phase2Repository = require('../repositories/Phase2Repository');
const AuditRepository = require('../repositories/AuditRepository');

async function logAudit(actorId, action, entityType, entityId, details, ipAddress) {
  try {
    await AuditRepository.createLog(actorId, action, entityType, entityId, details, ipAddress);
  } catch (err) {
    console.error('Audit logging failed in phase2Controller:', err);
  }
}

// --- 1. Security Gate Management ---

async function getPendingExits(req, res) {
  try {
    const exits = await Phase2Repository.getPendingExits();
    res.json({ status: 'success', data: exits });
  } catch (err) {
    console.error('getPendingExits error:', err);
    res.status(500).json({ error: 'Failed to fetch pending exits.' });
  }
}

async function getPendingEntries(req, res) {
  try {
    const entries = await Phase2Repository.getPendingEntries();
    res.json({ status: 'success', data: entries });
  } catch (err) {
    console.error('getPendingEntries error:', err);
    res.status(500).json({ error: 'Failed to fetch pending entries.' });
  }
}

async function recordExit(req, res) {
  try {
    const { request_id, vehicle_id, driver_id, employee_id, odometer_out, fuel_level_out, gate_no_out, remarks_out, photo_url_out } = req.body;
    
    if (!request_id || !vehicle_id || !driver_id || !employee_id || odometer_out === undefined || !gate_no_out) {
      return res.status(400).json({ error: 'request_id, vehicle_id, driver_id, employee_id, odometer_out, and gate_no_out are required.' });
    }

    const exitData = {
      request_id,
      vehicle_id,
      driver_id,
      employee_id,
      odometer_out,
      fuel_level_out,
      gate_no_out,
      security_guard_name: req.user.full_name,
      remarks_out,
      photo_url_out
    };

    const tripLogId = await Phase2Repository.recordExit(exitData, req.user.id);
    await logAudit(req.user.id, 'RECORD_EXIT', 'vehicle_trip_log', tripLogId, { request_id, vehicle_id, odometer_out, gate_no_out }, req.ip);

    res.status(201).json({ status: 'success', message: 'Vehicle exit recorded successfully.', data: { tripLogId } });
  } catch (err) {
    console.error('recordExit error:', err);
    res.status(500).json({ error: err.message || 'Failed to record vehicle exit.' });
  }
}

async function recordEntry(req, res) {
  try {
    const { request_id, odometer_in, fuel_level_in, vehicle_condition, damage_report, remarks_in, photo_url_in } = req.body;

    if (!request_id || odometer_in === undefined) {
      return res.status(400).json({ error: 'request_id and odometer_in are required.' });
    }

    const entryData = {
      request_id,
      odometer_in,
      fuel_level_in,
      vehicle_condition,
      damage_report,
      remarks_in,
      photo_url_in
    };

    const result = await Phase2Repository.recordEntry(entryData, req.user.id);
    await logAudit(req.user.id, 'RECORD_ENTRY', 'vehicle_trip_log', request_id, { odometer_in, distance: result.distance, cost: result.travelCost }, req.ip);

    res.json({ status: 'success', message: 'Vehicle entry recorded successfully.', data: result });
  } catch (err) {
    console.error('recordEntry error:', err);
    res.status(500).json({ error: err.message || 'Failed to record vehicle entry.' });
  }
}

async function getGateHistory(req, res) {
  try {
    const { startDate, endDate, employeeNumber } = req.query;
    const history = await Phase2Repository.getGateHistory({ startDate, endDate, employeeNumber });
    res.json({ status: 'success', data: history });
  } catch (err) {
    console.error('getGateHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch gate history.' });
  }
}

// --- 2. Travel History & Ledgers ---

async function getEmployeeTravelHistory(req, res) {
  try {
    // If the caller is HOD, GM-HR, COO, or Admin, they can pass an employee_id query.
    // Otherwise, standard employees can only fetch their own.
    let employeeId = req.user.id;
    if (['HOD', 'GM-HR', 'COO', 'Admin'].includes(req.user.role) && req.query.employee_id) {
      employeeId = parseInt(req.query.employee_id, 10);
    }

    const history = await Phase2Repository.getEmployeeTravelHistory(employeeId);
    const summary = await Phase2Repository.getEmployeeTravelSummary(employeeId);

    res.json({ status: 'success', data: { history, summary } });
  } catch (err) {
    console.error('getEmployeeTravelHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch employee travel history.' });
  }
}

// --- 3. Rates & Billing ---

async function getTravelCosts(req, res) {
  try {
    const costs = await Phase2Repository.getTravelCosts();
    res.json({ status: 'success', data: costs });
  } catch (err) {
    console.error('getTravelCosts error:', err);
    res.status(500).json({ error: 'Failed to fetch travel costs.' });
  }
}

async function updateTravelCost(req, res) {
  try {
    const { vehicle_type, cost_per_km } = req.body;
    if (!vehicle_type || cost_per_km === undefined) {
      return res.status(400).json({ error: 'vehicle_type and cost_per_km are required.' });
    }

    await Phase2Repository.updateTravelCost(vehicle_type, cost_per_km, req.user.id);
    await logAudit(req.user.id, 'UPDATE_TRAVEL_COST', 'travel_costs', null, { vehicle_type, cost_per_km }, req.ip);

    res.json({ status: 'success', message: 'Travel cost rate updated successfully.' });
  } catch (err) {
    console.error('updateTravelCost error:', err);
    res.status(500).json({ error: 'Failed to update travel cost.' });
  }
}

// --- 4. Payments Management ---

async function getEmployeeBalances(req, res) {
  try {
    const balances = await Phase2Repository.getEmployeeBalances();
    res.json({ status: 'success', data: balances });
  } catch (err) {
    console.error('getEmployeeBalances error:', err);
    res.status(500).json({ error: 'Failed to fetch employee balances.' });
  }
}

async function getPaymentHistory(req, res) {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    const history = await Phase2Repository.getPaymentHistory(employeeId);
    res.json({ status: 'success', data: history });
  } catch (err) {
    console.error('getPaymentHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
}

async function recordPayment(req, res) {
  try {
    const { employee_id, payment_date, amount_paid, payment_mode, receipt_number, remarks } = req.body;

    if (!employee_id || !payment_date || amount_paid === undefined || !payment_mode || !receipt_number) {
      return res.status(400).json({ error: 'employee_id, payment_date, amount_paid, payment_mode, and receipt_number are required.' });
    }

    const paymentData = {
      employee_id,
      payment_date,
      amount_paid,
      payment_mode,
      receipt_number,
      remarks
    };

    await Phase2Repository.recordPayment(paymentData, req.user.id);
    await logAudit(req.user.id, 'RECORD_PAYMENT', 'payment_history', employee_id, { amount_paid, payment_mode, receipt_number }, req.ip);

    res.status(201).json({ status: 'success', message: 'Payment recorded successfully.' });
  } catch (err) {
    console.error('recordPayment error:', err);
    res.status(500).json({ error: 'Failed to record payment.' });
  }
}

// --- 5. Billing ---

async function getBillDetails(req, res) {
  try {
    const tripLogId = parseInt(req.params.tripLogId, 10);
    if (!tripLogId) {
      return res.status(400).json({ error: 'Trip log ID is required.' });
    }

    const details = await Phase2Repository.getBillDetails(tripLogId);
    if (!details) {
      return res.status(404).json({ error: 'Trip log or bill details not found.' });
    }

    res.json({ status: 'success', data: details });
  } catch (err) {
    console.error('getBillDetails error:', err);
    res.status(500).json({ error: 'Failed to fetch bill details.' });
  }
}

async function logBillGeneration(req, res) {
  try {
    const { trip_log_id, bill_number } = req.body;
    if (!trip_log_id || !bill_number) {
      return res.status(400).json({ error: 'trip_log_id and bill_number are required.' });
    }

    await Phase2Repository.logBillGeneration(trip_log_id, bill_number, req.user.id);
    await logAudit(req.user.id, 'GENERATE_BILL', 'generated_bills', trip_log_id, { bill_number }, req.ip);

    res.json({ status: 'success', message: 'Bill generation logged successfully.' });
  } catch (err) {
    console.error('logBillGeneration error:', err);
    res.status(500).json({ error: 'Failed to log bill generation.' });
  }
}

// --- 6. Analytics ---

async function getGarageFleetStatus(req, res) {
  try {
    const data = await Phase2Repository.getGarageFleetStatus();
    res.json({ status: 'success', data });
  } catch (err) {
    console.error('getGarageFleetStatus error:', err);
    res.status(500).json({ error: 'Failed to fetch garage fleet status.' });
  }
}

async function getAnalytics(req, res) {
  try {
    const userRole = req.user.role;
    if (userRole === 'HOD') {
      const data = await Phase2Repository.getDepartmentAnalytics(req.user.department_id);
      return res.json({ status: 'success', role: 'HOD', data });
    } else if (['GM-HR', 'COO', 'Admin'].includes(userRole)) {
      const data = await Phase2Repository.getFleetAnalyticsSummary();
      return res.json({ status: 'success', role: userRole, data });
    } else {
      return res.status(403).json({ error: 'Unauthorized to access travel analytics.' });
    }
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
}

module.exports = {
  getPendingExits,
  getPendingEntries,
  recordExit,
  recordEntry,
  getGateHistory,
  getEmployeeTravelHistory,
  getTravelCosts,
  updateTravelCost,
  getEmployeeBalances,
  getPaymentHistory,
  recordPayment,
  getBillDetails,
  logBillGeneration,
  getGarageFleetStatus,
  getAnalytics
};
