const AnalyticsRepository = require('../repositories/AnalyticsRepository');

class AnalyticsService {
  async getDashboardMetrics() {
    const [summary, departmentUsage, vehicleUtilization, financial, monthlyTrend] = await Promise.all([
      AnalyticsRepository.getSummaryStats(),
      AnalyticsRepository.getDepartmentUsage(),
      AnalyticsRepository.getVehicleUtilization(),
      AnalyticsRepository.getFinancialStats(),
      AnalyticsRepository.getMonthlyTrend()
    ]);

    return {
      summary,
      departmentUsage,
      vehicleUtilization,
      financial,
      monthlyTrend
    };
  }
}

module.exports = new AnalyticsService();
