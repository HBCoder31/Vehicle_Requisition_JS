const MaintenanceRepository = require('../repositories/MaintenanceRepository');
const AppError = require('../utils/AppError');

class MaintenanceService {
  async getAllSchedules() {
    return await MaintenanceRepository.findAll();
  }

  async scheduleMaintenance(data, userId) {
    data.created_by = userId;
    const id = await MaintenanceRepository.create(data);
    return await MaintenanceRepository.findById(id);
  }

  async completeMaintenance(id, recordData) {
    const maintenance = await MaintenanceRepository.findById(id);
    if (!maintenance) throw new AppError('Maintenance schedule not found', 404);

    recordData.maintenance_id = id;
    recordData.vehicle_id = maintenance.vehicle_id;

    await MaintenanceRepository.addRecord(recordData);
    await MaintenanceRepository.updateStatus(id, 'Completed');

    return { message: 'Maintenance completed and record saved' };
  }

  async getExpiringCertificates() {
    return await MaintenanceRepository.findExpiringCertificates(30);
  }
}

module.exports = new MaintenanceService();
