const FuelRepository = require('../repositories/FuelRepository');
const AuditRepository = require('../repositories/AuditRepository');
const AppError = require('../utils/AppError');

class FuelService {
  async getAllLogs() {
    return await FuelRepository.findAll();
  }

  async addLog(data, userId, ipAddress) {
    const id = await FuelRepository.create(data);
    
    await AuditRepository.createLog(userId, 'CREATE_FUEL_LOG', 'fuel_logs', id, data, ipAddress);
    
    return await FuelRepository.findById(id);
  }
}

module.exports = new FuelService();
