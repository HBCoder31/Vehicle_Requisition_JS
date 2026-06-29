const { pool } = require('../config/db');

class TravelAdminRepository {
  async getPendingBookings() {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.phone AS requester_phone, e.employee_number,
              d.name AS department_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       WHERE vr.want_ticket = 1 
         AND vr.status IN ('Approved_COO', 'Approved_GM_HR', 'Vehicle_Assigned', 'In_Transit', 'Completed', 'Vehicle Out', 'Vehicle Returned')
         AND vr.ticket_status IN ('Pending', 'Clarification_Required')
       ORDER BY vr.travel_date ASC, vr.travel_time ASC`
    );
    return rows;
  }

  async getBookedHistory() {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.phone AS requester_phone, e.employee_number,
              d.name AS department_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       WHERE vr.want_ticket = 1 
         AND vr.ticket_status = 'Booked'
       ORDER BY vr.booked_at DESC`
    );
    return rows;
  }

  async bookTicket(id, bookingData, travelAdminId) {
    const [result] = await pool.execute(
      `UPDATE vehicle_requests SET
         ticket_status = 'Booked',
         pnr = ?,
         carrier_name = ?,
         seat_no = ?,
         ticket_file_url = ?,
         travel_admin_remarks = ?,
         booked_at = CURRENT_TIMESTAMP,
         booked_by = ?
       WHERE id = ?`,
      [
        bookingData.pnr,
        bookingData.carrier_name || null,
        bookingData.seat_no || null,
        bookingData.ticket_file_url || null,
        bookingData.travel_admin_remarks || null,
        travelAdminId,
        id
      ]
    );
    return result.affectedRows > 0;
  }

  async requestClarification(id, remarks) {
    const [result] = await pool.execute(
      `UPDATE vehicle_requests SET
         ticket_status = 'Clarification_Required',
         travel_admin_remarks = ?
       WHERE id = ?`,
      [remarks, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new TravelAdminRepository();
