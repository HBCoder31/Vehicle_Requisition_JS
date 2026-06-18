import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FuelManagement = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    log_date: new Date().toISOString().slice(0,16),
    liters: '',
    cost: '',
    odometer_reading: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/fuel');
      setLogs(data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch fuel logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [vehRes, drvRes] = await Promise.all([
        api.get('/garage/vehicles'),
        api.get('/drivers')
      ]);
      setVehicles(vehRes.data.vehicles || []);
      setDrivers(drvRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchDropdowns();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure specific types
      const payload = {
        ...formData,
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
        liters: parseFloat(formData.liters),
        cost: parseFloat(formData.cost),
        odometer_reading: parseInt(formData.odometer_reading)
      };

      await api.post('/fuel', payload);
      setShowModal(false);
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to log fuel');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fuel Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          + Log Fuel
        </button>
      </div>

      {loading ? (
        <p>Loading fuel logs...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.log_date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.registration_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.driver_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {log.liters} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    ₹{log.cost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.odometer_reading} km
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Log Fuel Receipt</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2">
                  <option value="">Select Vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_no} - {v.make}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Driver</label>
                <select name="driver_id" value={formData.driver_id} onChange={handleChange} className="mt-1 w-full border border-gray-300 rounded p-2">
                  <option value="">Select Driver (Optional)...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <input type="datetime-local" name="log_date" value={formData.log_date} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Odometer (km)</label>
                  <input type="number" name="odometer_reading" value={formData.odometer_reading} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Liters</label>
                  <input type="number" step="0.01" name="liters" value={formData.liters} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Cost (₹)</label>
                  <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} required className="mt-1 w-full border border-gray-300 rounded p-2" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelManagement;
