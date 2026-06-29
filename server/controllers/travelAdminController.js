const TravelAdminRepository = require('../repositories/TravelAdminRepository');
const HistoryRepository = require('../repositories/HistoryRepository');
const NotificationService = require('../services/NotificationService');
const AuditRepository = require('../repositories/AuditRepository');
const { pool } = require('../config/db');

async function getPending(req, res) {
  try {
    const requests = await TravelAdminRepository.getPendingBookings();
    res.json({ success: true, requests });
  } catch (err) {
    console.error('getPending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending bookings.' });
  }
}

async function getHistory(req, res) {
  try {
    const history = await TravelAdminRepository.getBookedHistory();
    res.json({ success: true, history });
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch booking history.' });
  }
}

async function bookTicket(req, res) {
  const { pnr, carrier_name, seat_no, ticket_file_url, travel_admin_remarks } = req.body;
  const id = parseInt(req.params.id);

  if (!pnr) {
    return res.status(400).json({ error: 'PNR number is required to book ticket.' });
  }

  try {
    // 1. Fetch request details to get employee_id & mode
    const [reqRows] = await pool.execute(
      'SELECT * FROM vehicle_requests WHERE id = ?',
      [id]
    );

    if (reqRows.length === 0) {
      return res.status(404).json({ error: 'Requisition request not found.' });
    }

    const request = reqRows[0];

    // 2. Perform DB update
    const success = await TravelAdminRepository.bookTicket(id, {
      pnr,
      carrier_name,
      seat_no,
      ticket_file_url,
      travel_admin_remarks
    }, req.user.id);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update ticket booking details.' });
    }

    // 3. Log Audit Activity
    await AuditRepository.createLog(
      req.user.id,
      'BOOK_TICKET',
      'vehicle_request',
      id,
      { pnr, carrier_name, seat_no, ticket_file_url },
      req.ip
    );

    // 4. Log History Event
    await HistoryRepository.addEvent(
      id,
      req.user.id,
      'Ticket_Booked',
      request.status,
      request.status,
      `Ticket booked (${request.mode_of_transport}). PNR: ${pnr}. Carrier: ${carrier_name || 'N/A'}.`
    );

    // 5. Send Notification & Trigger SSE/Email
    await NotificationService.notifyUser(
      request.employee_id,
      'Ticket Booked',
      `Your travel ticket (${request.mode_of_transport}) has been booked. PNR: ${pnr}. From: ${request.ticket_from || 'N/A'} To: ${request.ticket_to || 'N/A'}.`,
      'System'
    );

    res.json({ success: true, message: 'Ticket booked successfully.' });
  } catch (err) {
    console.error('bookTicket error:', err);
    res.status(500).json({ error: 'Failed to book ticket.' });
  }
}

async function requestClarification(req, res) {
  const { remarks } = req.body;
  const id = parseInt(req.params.id);

  if (!remarks) {
    return res.status(400).json({ error: 'Remarks are required for clarification request.' });
  }

  try {
    const [reqRows] = await pool.execute(
      'SELECT * FROM vehicle_requests WHERE id = ?',
      [id]
    );

    if (reqRows.length === 0) {
      return res.status(404).json({ error: 'Requisition request not found.' });
    }

    const request = reqRows[0];

    const success = await TravelAdminRepository.requestClarification(id, remarks);

    if (!success) {
      return res.status(500).json({ error: 'Failed to request clarification.' });
    }

    // Log Audit
    await AuditRepository.createLog(
      req.user.id,
      'TICKET_CLARIFICATION',
      'vehicle_request',
      id,
      { remarks },
      req.ip
    );

    // Log History
    await HistoryRepository.addEvent(
      id,
      req.user.id,
      'Ticket_Clarification',
      request.status,
      request.status,
      `Clarification requested: ${remarks}`
    );

    // Notify User
    await NotificationService.notifyUser(
      request.employee_id,
      'Ticket Clarification Required',
      `Travel Admin has requested clarification for your ticket request: "${remarks}".`,
      'System'
    );

    res.json({ success: true, message: 'Clarification requested successfully.' });
  } catch (err) {
    console.error('requestClarification error:', err);
    res.status(500).json({ error: 'Failed to request clarification.' });
  }
}

module.exports = {
  getPending,
  getHistory,
  bookTicket,
  requestClarification
};
