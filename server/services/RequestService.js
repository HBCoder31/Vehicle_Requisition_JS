const RequestRepository = require('../repositories/RequestRepository');
const AuditRepository = require('../repositories/AuditRepository');
const HistoryRepository = require('../repositories/HistoryRepository');
const NotificationService = require('./NotificationService');
const AppError = require('../utils/AppError');
const socketUtil = require('../utils/socket');

class RequestService {
  async createRequest(user, data, ipAddress) {
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
    if (user.role === 'COO') {
      initialStatus = 'Approved_COO';
    } else if (user.role === 'HOD') {
      initialStatus = 'Pending_COO';
    }

    const requestId = await RequestRepository.createRequest(data, initialStatus);

    // Audit log
    await AuditRepository.createLog(user.id, 'CREATE_REQUEST', 'vehicle_request', requestId, { destination: data.destination, travel_type: data.travel_type, status: initialStatus }, ipAddress);
    
    // History Timeline
    if (user.role === 'COO') {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Approved_COO', 'Request auto-approved by COO');
    } else if (user.role === 'HOD') {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Pending_COO', 'Request auto-approved by HOD');
    } else {
      await HistoryRepository.addEvent(requestId, user.id, 'Created', null, 'Pending_HOD', 'Request submitted by employee');
    }

    // Notify appropriate party
    try {
      const UserRepository = require('../repositories/UserRepository');
      if (initialStatus === 'Approved_COO') {
        const garageUsers = await UserRepository.findByRole('Garage');
        for (const gUser of garageUsers) {
          await NotificationService.notifyUser(gUser.id, 'New Approved Request', `Request #${requestId} to ${data.destination} was auto-approved and needs a vehicle.`, 'Request');
        }
      } else if (initialStatus === 'Pending_COO') {
        const cooUsers = await UserRepository.findByRole('COO');
        for (const cUser of cooUsers) {
          await NotificationService.notifyUser(cUser.id, 'New Request for Approval', `Request #${requestId} to ${data.destination} requires your approval.`, 'Approval');
        }
      } else {
        const hodUsers = await UserRepository.findByRoleAndDepartment('HOD', departmentId);
        for (const hUser of hodUsers) {
          await NotificationService.notifyUser(hUser.id, 'New Request for Approval', `Request #${requestId} to ${data.destination} from your department requires approval.`, 'Approval');
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

    if (request.status !== 'Pending_HOD') {
      throw new Error('Request can only be edited before HOD approval');
    }

    await RequestRepository.updateRequestDetails(requestId, updateData);

    await HistoryRepository.addEvent(requestId, userId, 'Edited_Request', 'Pending_HOD', 'Pending_HOD', 'User updated request details');

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

    // Access control: owner, same-department HOD, COO, Garage, or Admin
    const isOwner = request.employee_id === user.id;
    const isDeptHOD = user.role === 'HOD' && request.department_id === user.department_id;
    const hasGlobalAccess = ['COO', 'Garage', 'Admin'].includes(user.role);

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

    if (request.status !== 'Pending_HOD') {
      throw new AppError('Can only delete requests that are still Pending HOD approval.', 400);
    }

    await RequestRepository.updateRequestStatus(requestId, 'Deleted');
    
    // Audit log
    await AuditRepository.createLog(user.id, 'DELETE_REQUEST', 'vehicle_request', requestId, { status_from: 'Pending_HOD', status_to: 'Deleted' }, ipAddress);
    
    // History Timeline
    await HistoryRepository.addEvent(requestId, user.id, 'Deleted', 'Pending_HOD', 'Deleted', 'Deleted by requester');

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
