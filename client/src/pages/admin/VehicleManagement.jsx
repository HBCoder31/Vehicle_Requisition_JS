import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [formData, setFormData] = useState({
    registration_no: '',
    make: '',
    model: '',
    vehicle_type: 'Sedan',
    capacity: 4,
    fuel_type: 'Petrol',
    current_odometer: 0,
    insurance_expiry: '',
    fitness_expiry: '',
    pollution_expiry: ''
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/garage/vehicles');
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEditClick = (v) => {
    setEditingId(v.id);
    setFormData({
      registration_no: v.registration_no || '',
      make: v.make || '',
      model: v.model || '',
      vehicle_type: v.vehicle_type || 'Sedan',
      capacity: v.capacity || 4,
      fuel_type: v.fuel_type || 'Petrol',
      current_odometer: v.current_odometer || 0,
      insurance_expiry: v.insurance_expiry ? v.insurance_expiry.split('T')[0] : '',
      fitness_expiry: v.fitness_expiry ? v.fitness_expiry.split('T')[0] : '',
      pollution_expiry: v.pollution_expiry ? v.pollution_expiry.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({
      registration_no: '',
      make: '',
      model: '',
      vehicle_type: 'Sedan',
      capacity: 4,
      fuel_type: 'Petrol',
      current_odometer: 0,
      insurance_expiry: '',
      fitness_expiry: '',
      pollution_expiry: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/garage/vehicles/${editingId}`, formData);
      } else {
        await api.post('/garage/vehicles', formData);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save vehicle');
    }
  };

  const handleStatusToggle = async (vehicle) => {
    const newStatus = vehicle.is_active ? 'Deactivate' : 'Activate';
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} vehicle ${vehicle.registration_no}?`)) return;

    setUpdatingId(vehicle.id);
    try {
      const { data } = await api.patch(`/garage/vehicles/${vehicle.id}/status`);
      setVehicles(prev => prev.map(v =>
        v.id === vehicle.id ? { ...v, is_active: data.is_active, is_available: data.is_active } : v
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update vehicle status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this vehicle? This action cannot be undone.')) return;
    try {
      await api.delete(`/garage/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete vehicle.');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vehicle Management</h1>
          <p className="text-sm text-muted mt-1">Manage fleet vehicles, details, and active status</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          + Add Vehicle
        </button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reg No</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Make & Model</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuel</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map(v => {
                const isActive = Boolean(v.is_active);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">{v.registration_no}</td>
                    <td className="px-6 py-4 text-slate-800">{v.make} {v.model}</td>
                    <td className="px-6 py-4 text-slate-500">{v.vehicle_type}</td>
                    <td className="px-6 py-4 text-slate-500">{v.capacity} seats</td>
                    <td className="px-6 py-4 text-slate-500">{v.fuel_type}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{v.current_odometer} km</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isActive ? 'bg-success-50 text-success-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(v)}
                          className="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusToggle(v)}
                          disabled={updatingId === v.id}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-orange-5 text-orange-600 hover:bg-orange-50 border border-orange-100'
                              : 'bg-success-5 text-success-600 hover:bg-success-50 border border-success-100'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Restore'}
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="px-2 py-1 text-xs text-danger-600 hover:text-danger-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-slate-800">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Registration Number *</label>
                  <input type="text" name="registration_no" value={formData.registration_no} onChange={handleChange} required placeholder="e.g. MP-15-AB-1234" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Make *</label>
                    <input type="text" name="make" value={formData.make} onChange={handleChange} required placeholder="e.g. Toyota" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Model *</label>
                    <input type="text" name="model" value={formData.model} onChange={handleChange} required placeholder="e.g. Innova" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Type *</label>
                    <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} className="w-full px-2 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Bus">Bus</option>
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Capacity *</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required min="1" className="w-full px-2 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Fuel *</label>
                    <select name="fuel_type" value={formData.fuel_type} onChange={handleChange} className="w-full px-2 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="CNG">CNG</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Current Odometer (km)</label>
                  <input type="number" name="current_odometer" value={formData.current_odometer} onChange={handleChange} min="0" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Compliance Expiries</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-1">Insurance Expiry</label>
                      <input type="date" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleChange} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:border-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-1">Fitness Expiry</label>
                      <input type="date" name="fitness_expiry" value={formData.fitness_expiry} onChange={handleChange} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:border-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-600 mb-1">Pollution Expiry</label>
                      <input type="date" name="pollution_expiry" value={formData.pollution_expiry} onChange={handleChange} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:border-primary-500 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow">Save Vehicle</button>
                </div>
              </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleManagement;
