const RequestRepository = require('../repositories/RequestRepository');
const AuditRepository = require('../repositories/AuditRepository');
const HistoryRepository = require('../repositories/HistoryRepository');
const NotificationService = require('./NotificationService');
const AppError = require('../utils/AppError');
const socketUtil = require('../utils/socket');

class RequestService {
  async createRequest(user, data, ipAddress, baseUrl = null) {
    // Validate travel type
    const validTravelTypes = ['Within Anuppur/Shahdol', 'Beyond Anuppur/Shahdol'];
    if (!validTravelTypes.includes(data.travel_type)) {
      throw new AppError('Invalid travel_type. Must be "Within Anuppur/Shahdol" or "Beyond Anuppur/Shahdol".', 400);
    }

    // Check user department
    const departmentId = await RequestRepository.getDepartmentIdByEmployee(user.id);
    if (!departmentId) {
      throw new AppError('Employee not found or has no department assigned.', 400);
    }

    data.employee_id = user.id;
    data.department_id = departmentId;

    let initialStatus = 'Pending_HOD';
    let isHRDept = false;

    // Check if user is in HR department
    try {
      const { pool } = require('../config/db');
      const [[dept]] = await pool.execute('SELECT code FROM departments WHERE id = ?', [departmentId]);
      isHRDept = dept && dept.code === 'HR';
    } catch (err) {
      console.error('Failed to fetch department code:', err);
    }

    if (user.role === 'COO') {
      initialStatus = 'Approved_COO';
    } else if (user.role === 'GM-HR') {
      if (data.travel_type === 'Within Anuppur/Shahdol') {
        initialStatus = 'Approved_GM_HR';
      } else {
        initialStatus = 'Pending_COO';
      }
    } else if (user.role === 'HOD') {
      initialStatus = 'Pending_GM_HR';
    } else {
      if (isHRDept) {
        initialStatus = 'Pending_GM_HR';
      } else {
        initialStatus = 'Pending_HOD';
      }
    }

    const requestId = await RequestRepository.createRequest(data, initialStatus);

    // Audit log
    await AuditRepository.createLog(user.id, 'CREATE_REQUEST', 'vehicle_request', requestId, { destination: data.destination, travel_type: data.travel_type, status: initialStatus }, ipAddress);
    
    // History Timeline
    if (initialStatus === 'Approved_COO') {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Approved_COO', 'Request auto-approved by COO');
    } else if (initialStatus === 'Approved_GM_HR') {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Approved_GM_HR', 'Request auto-approved for GM-HR (Within)');
    } else if (initialStatus === 'Pending_COO') {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Pending_COO', 'Request submitted by GM-HR (Beyond)');
    } else if (initialStatus === 'Pending_GM_HR') {
      const msg = user.role === 'HOD' ? 'Request submitted by HOD' : (user.role === 'GM-HR' ? 'Request submitted by GM-HR' : 'Request submitted by HR employee');
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Pending_GM_HR', msg);
    } else {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Pending_HOD', 'Request submitted by employee');
    }

    // Notify appropriate party
    try {
      const UserRepository = require('../repositories/UserRepository');
      if (initialStatus === 'Approved_COO' || initialStatus === 'Approved_GM_HR') {
        const garageUsers = await UserRepository.findByRole('Garage');
        for (const gUser of garageUsers) {
          if (gUser.id !== user.id) {
            await NotificationService.notifyUser(gUser.id, 'New Approved Request', `Request #${requestId} to ${data.destination} was approved and needs a vehicle.`, 'Request');
          }
        }
      } else if (initialStatus === 'Pending_COO') {
        const cooUsers = await UserRepository.findByRole('COO');
        const EmailApprovalService = require('./EmailApprovalService');
        for (const cUser of cooUsers) {
          if (cUser.id !== user.id) {
            await NotificationService.notifyUser(cUser.id, 'New Request for Approval', `Request #${requestId} to ${data.destination} requires your approval.`, 'Approval', null, true);
            await EmailApprovalService.sendApprovalEmail(requestId, cUser.id, 'COO', baseUrl);
          }
        }
      } else if (initialStatus === 'Pending_GM_HR') {
        const gmhrUsers = await UserRepository.findByRole('GM-HR');
        const EmailApprovalService = require('./EmailApprovalService');
        for (const gUser of gmhrUsers) {
          if (gUser.id !== user.id) {
            await NotificationService.notifyUser(gUser.id, 'New Request for Approval', `Request #${requestId} to ${data.destination} requires your approval.`, 'Approval', null, true);
            await EmailApprovalService.sendApprovalEmail(requestId, gUser.id, 'GM-HR', baseUrl);
          }
        }
      } else {
        const hodUsers = await UserRepository.findByRoleAndDepartment('HOD', departmentId);
        const EmailApprovalService = require('./EmailApprovalService');
        for (const hUser of hodUsers) {
          if (hUser.id !== user.id) {
            await NotificationService.notifyUser(hUser.id, 'New Request for Approval', `Request #${requestId} to ${data.destination} from your department requires approval.`, 'Approval', null, true);
            await EmailApprovalService.sendApprovalEmail(requestId, hUser.id, 'HOD', baseUrl);
          }
        }
      }
    } catch (err) {
      console.error('Notification failed', err);
    }

    return requestId;
  }

  async editRequest(requestId, userId, updateData) {
    const request = await RequestRepository.getRequestById(requestId);
    if (!request) throw new Error('Request not found');
    
    if (request.employee_id !== userId) {
      throw new Error('Unauthorized to edit this request');
    }

    const allowedStatus = ['Pending_HOD'];
    if (['HOD', 'GM-HR'].includes(request.requester_role)) {
      allowedStatus.push('Pending_GM_HR');
    }

    if (!allowedStatus.includes(request.status)) {
      throw new Error('Request can only be edited before approval');
    }

    await RequestRepository.updateRequestDetails(requestId, updateData);

    await HistoryRepository.addEvent(requestId, userId, 'Edited_Request', request.status, request.status, 'User updated request details');

    return true;
  }

  async getMyRequests(userId, filters = {}) {
    return await RequestRepository.getRequestsByEmployee(userId, filters);
  }

  async getRequestDetails(requestId, user) {
    const request = await RequestRepository.getRequestById(requestId);
    if (!request) {
      throw new AppError('Request not found.', 404);
    }

    // Access control: owner, same-department HOD, COO, Garage, GM-HR, or Admin
    const isOwner = request.employee_id === user.id;
    const isDeptHOD = user.role === 'HOD' && request.department_id === user.department_id;
    const hasGlobalAccess = ['COO', 'Garage', 'Admin', 'GM-HR'].includes(user.role);

    if (!isOwner && !isDeptHOD && !hasGlobalAccess) {
      throw new AppError('Access denied.', 403);
    }

    return request;
  }

  async deleteRequest(requestId, user, ipAddress) {
    const request = await RequestRepository.getRequestById(requestId);
    
    if (!request || request.employee_id !== user.id) {
      throw new AppError('Request not found or not yours.', 404);
    }

    const allowedStatus = ['Pending_HOD'];
    if (['HOD', 'GM-HR'].includes(request.requester_role)) {
      allowedStatus.push('Pending_GM_HR');
    }

    if (!allowedStatus.includes(request.status)) {
      throw new AppError('Can only delete requests before approval.', 400);
    }

    await RequestRepository.updateRequestStatus(requestId, 'Deleted');
    
    // Audit log
    await AuditRepository.createLog(user.id, 'DELETE_REQUEST', 'vehicle_request', requestId, { status_from: request.status, status_to: 'Deleted' }, ipAddress);
    
    // History Timeline
    await HistoryRepository.addEvent(requestId, user.id, 'Deleted', request.status, 'Deleted', 'Deleted by requester');

    // Real-time Notification
    // try {
    //   socketUtil.getIO().emit('request_cancelled', { requestId, status: 'Cancelled' });
    // } catch (err) {
    //   console.error('Socket emission failed', err);
    // }
  }

  async getAllRequests(filters, page = 1, limit = 20) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await RequestRepository.getAllRequests(filters, limit, offset);

    return {
      requests: result.rows,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / parseInt(limit)),
      }
    };
  }
  async getRequestHistory(requestId, user) {
    // Basic access check by reusing getRequestDetails
    await this.getRequestDetails(requestId, user);
    return await HistoryRepository.getHistoryForRequest(requestId);
  }
}

module.exports = new RequestService();
