const ApprovalRepository = require('../repositories/ApprovalRepository');
const RequestRepository = require('../repositories/RequestRepository');
const HistoryRepository = require('../repositories/HistoryRepository');
const AuditRepository = require('../repositories/AuditRepository');
const NotificationService = require('./NotificationService');
const AppError = require('../utils/AppError');

class ApprovalService {
  async getHodPendingRequests(departmentIds) {
    if (!departmentIds || departmentIds.length === 0) return [];
    return await ApprovalRepository.getHodPendingRequests(departmentIds);
  }

  async hodAction(requestId, departmentIds, action, remarks, userId, ipAddress) {
    if (!departmentIds || departmentIds.length === 0) {
      throw new AppError('Access denied. No associated departments.', 403);
    }
    const request = await RequestRepository.getRequestById(requestId);
    if (!request || !departmentIds.includes(request.department_id) || request.status !== 'Pending_HOD') {
      throw new AppError('Request not found, not in your department, or not pending HOD approval.', 404);
    }

    let newStatus = action === 'reject' ? 'Rejected_HOD' : 'Pending_GM_HR';

    await ApprovalRepository.updateHodAction(requestId, newStatus, remarks, userId);
    
    // History & Audit
    await HistoryRepository.addEvent(requestId, userId, action === 'approve' ? 'HOD_Approved' : 'HOD_Rejected', 'Pending_HOD', newStatus, remarks);
    await AuditRepository.createLog(userId, action === 'approve' ? 'HOD_APPROVE' : 'HOD_REJECT', 'vehicle_request', requestId, { newStatus, remarks }, ipAddress);

    // Notification to Employee
    await NotificationService.notifyUser(
      request.employee_id, 
      `Request ${newStatus.replace(/_/g, ' ')}`, 
      `Your request to ${request.destination} was ${action === 'approve' ? 'approved' : 'rejected'} by HOD. Remarks: ${remarks || 'None'}`, 
      'Approval'
    );

    if (newStatus === 'Pending_GM_HR') {
      const UserRepository = require('../repositories/UserRepository');
      const EmailApprovalService = require('./EmailApprovalService');
      const gmhrUsers = await UserRepository.findByRole('GM-HR');
      for (const gUser of gmhrUsers) {
        if (gUser.id !== request.employee_id) {
          await NotificationService.notifyUser(gUser.id, 'New Request for Approval', `Request #${requestId} to ${request.destination} requires your approval.`, 'Approval', null, true);
          await EmailApprovalService.sendApprovalEmail(requestId, gUser.id, 'GM-HR');
        }
      }
    }

    return newStatus;
  }

  async getGmHrPendingRequests() {
    return await ApprovalRepository.getGmHrPendingRequests();
  }

  async gmHrAction(requestId, action, remarks, userId, ipAddress) {
    const request = await RequestRepository.getRequestById(requestId);
    if (!request || request.status !== 'Pending_GM_HR') {
      throw new AppError('Request not found or not pending GM-HR approval.', 404);
    }

    let newStatus = action === 'reject' ? 'Rejected_GM_HR' : 
                   (request.travel_type === 'Beyond Anuppur/Shahdol' ? 'Pending_COO' : 'Approved_GM_HR');

    await ApprovalRepository.updateGmHrAction(requestId, newStatus, remarks, userId);

    // History & Audit
    await HistoryRepository.addEvent(requestId, userId, action === 'approve' ? 'GMHR_Approved' : 'GMHR_Rejected', 'Pending_GM_HR', newStatus, remarks);
    await AuditRepository.createLog(userId, action === 'approve' ? 'GMHR_APPROVE' : 'GMHR_REJECT', 'vehicle_request', requestId, { newStatus, remarks }, ipAddress);

    // Notification to Employee
    await NotificationService.notifyUser(
      request.employee_id, 
      `Request ${newStatus.replace(/_/g, ' ')}`, 
      `Your request to ${request.destination} was ${action === 'approve' ? 'approved' : 'rejected'} by GM-HR. Remarks: ${remarks || 'None'}`, 
      'Approval'
    );

    if (newStatus === 'Pending_COO') {
      const UserRepository = require('../repositories/UserRepository');
      const EmailApprovalService = require('./EmailApprovalService');
      const cooUsers = await UserRepository.findByRole('COO');
      for (const cUser of cooUsers) {
        if (cUser.id !== request.employee_id) {
          await NotificationService.notifyUser(cUser.id, 'New Request for Approval', `Request #${requestId} to ${request.destination} requires your approval.`, 'Approval', null, true);
          await EmailApprovalService.sendApprovalEmail(requestId, cUser.id, 'COO');
        }
      }
    } else if (newStatus === 'Approved_GM_HR') {
      const UserRepository = require('../repositories/UserRepository');
      const garageUsers = await UserRepository.findByRole('Garage');
      for (const gUser of garageUsers) {
        if (gUser.id !== request.employee_id) {
          await NotificationService.notifyUser(gUser.id, 'New Approved Request', `Request #${requestId} to ${request.destination} was approved and needs a vehicle.`, 'Request');
        }
      }
    }

    return newStatus;
  }

  async getGmHrStats() {
    const rows = await ApprovalRepository.getGmHrStats();
    const stats = { pending: 0, approved: 0, rejected: 0, deleted: 0, total: 0 };
    rows.forEach((row) => {
      stats.total += row.count;
      if (row.status === 'Pending_GM_HR') stats.pending += row.count;
      else if (row.status === 'Pending_COO' || row.status === 'Approved_GM_HR' || row.status.includes('Approved') || row.status === 'Vehicle_Assigned' || row.status === 'In_Transit' || row.status === 'Completed') stats.approved += row.count;
      else if (row.status.includes('Rejected')) stats.rejected += row.count;
      else if (row.status === 'Deleted') stats.deleted += row.count;
    });
    return stats;
  }

  async getHodStats(departmentIds) {
    if (!departmentIds || departmentIds.length === 0) return { pending: 0, approved: 0, rejected: 0, deleted: 0, total: 0 };
    const rows = await ApprovalRepository.getHodStats(departmentIds);
    const stats = { pending: 0, approved: 0, rejected: 0, deleted: 0, total: 0 };
    rows.forEach((row) => {
      stats.total += row.count;
      if (row.status === 'Pending_HOD') stats.pending += row.count;
      else if (row.status.includes('Approved') || row.status === 'Vehicle_Assigned' || row.status === 'In_Transit' || row.status === 'Completed') stats.approved += row.count;
      else if (row.status.includes('Rejected')) stats.rejected += row.count;
      else if (row.status === 'Deleted') stats.deleted += row.count;
    });
    return stats;
  }

  async getCooPendingRequests() {
    return await ApprovalRepository.getCooPendingRequests();
  }

  async cooAction(requestId, action, remarks, userId, ipAddress) {
    const request = await RequestRepository.getRequestById(requestId);
    if (!request || request.status !== 'Pending_COO') {
      throw new AppError('Request not found or not pending COO approval.', 404);
    }

    const newStatus = action === 'approve' ? 'Approved_COO' : 'Rejected_COO';

    await ApprovalRepository.updateCooAction(requestId, newStatus, remarks, userId);

    // History & Audit
    await HistoryRepository.addEvent(requestId, userId, action === 'approve' ? 'COO_Approved' : 'COO_Rejected', 'Pending_COO', newStatus, remarks);
    await AuditRepository.createLog(userId, action === 'approve' ? 'COO_APPROVE' : 'COO_REJECT', 'vehicle_request', requestId, { newStatus, remarks }, ipAddress);

    // Notification to Employee
    await NotificationService.notifyUser(
      request.employee_id, 
      `Request ${newStatus.replace(/_/g, ' ')}`, 
      `Your request to ${request.destination} was ${action === 'approve' ? 'approved' : 'rejected'} by COO. Remarks: ${remarks || 'None'}`, 
      'Approval'
    );

    if (newStatus === 'Approved_COO') {
      const UserRepository = require('../repositories/UserRepository');
      const garageUsers = await UserRepository.findByRole('Garage');
      for (const gUser of garageUsers) {
        if (gUser.id !== request.employee_id) {
          await NotificationService.notifyUser(gUser.id, 'New Approved Request', `Request #${requestId} to ${request.destination} was approved and needs a vehicle.`, 'Request');
        }
      }
    }

    return newStatus;
  }

  async getHodHistory(userId) {
    return await ApprovalRepository.getHodHistory(userId);
  }

  async getGmHrHistory(userId) {
    return await ApprovalRepository.getGmHrHistory(userId);
  }

  async getCooHistory(userId) {
    return await ApprovalRepository.getCooHistory(userId);
  }
}

module.exports = new ApprovalService();
