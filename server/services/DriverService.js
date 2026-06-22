const DriverRepository = require('../repositories/DriverRepository');
const AppError = require('../utils/AppError');

class DriverService {
  async getAllDrivers() {
    return await DriverRepository.findAll();
  }

  async getDriver(id) {
    const driver = await DriverRepository.findById(id);
    if (!driver) throw new AppError('Driver not found', 404);
    return driver;
  }

  async createDriver(data) {
    const id = await DriverRepository.create(data);
    return await this.getDriver(id);
  }

  async updateDriver(id, data) {
    const driver = await this.getDriver(id); // Check exists
    if (data.is_active === false && driver.is_available === 0) {
      throw new AppError('Cannot set driver on leave while they are on an active trip.', 400);
    }
    await DriverRepository.update(id, data);
    return await this.getDriver(id);
  }

  async getExpiringLicenses() {
    return await DriverRepository.findExpiringLicenses(30);
  }
}

module.exports = new DriverService();
