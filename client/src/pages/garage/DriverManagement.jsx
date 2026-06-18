import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    employee_number: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    is_active: true
  });

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/drivers');
      setDrivers(data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEditClick = (d) => {
    setEditingId(d.id);
    setFormData({
      full_name: d.full_name || '',
      employee_number: d.employee_number || '',
      email: d.email || '',
      phone: d.phone || '',
      license_number: d.license_number || '',
      license_expiry: d.license_expiry ? d.license_expiry.split('T')[0] : '',
      is_active: Boolean(d.is_active)
    });
    setShowModal(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({
      full_name: '',
      employee_number: '',
      email: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/drivers/${editingId}`, formData);
      } else {
        await api.post('/drivers', formData);
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to save driver');
    }
  };

  const handleStatusToggle = async (driver) => {
    const newStatus = driver.is_active ? 'On Leave' : 'Active';
    // Custom confirm
    if (!window.confirm(`Set ${driver.full_name} to "${newStatus}"?`)) return;

    setUpdatingId(driver.id);
    try {
      await api.patch(`/garage/drivers/${driver.id}/status`, { status: newStatus });
      // Update locally for instant UI feedback
      setDrivers(prev => prev.map(d =>
        d.id === driver.id ? { ...d, is_active: newStatus === 'Active' ? 1 : 0 } : d
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update driver status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
          <p className="text-sm text-muted mt-1">Manage drivers and their availability status</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          + Add Driver
        </button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee No</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">License</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Availability</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {drivers.map(driver => {
                const isExpiring = driver.license_expiry && new Date(driver.license_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const isActive = Boolean(driver.is_active);
                const isUpdating = updatingId === driver.id;

                return (
                  <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{driver.full_name}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{driver.employee_number}</td>
                    <td className="px-6 py-4 text-slate-500">{driver.license_number || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={isExpiring ? 'text-danger-600 font-bold' : 'text-slate-500'}>
                        {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        driver.is_available ? 'bg-primary-100 text-primary-700' : 'bg-warning-50 text-warning-600'
                      }`}>
                        {driver.is_available ? 'Available' : 'On Trip'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isActive ? 'bg-success-50 text-success-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isActive ? 'Active' : 'On Leave'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(driver)}
                          className="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusToggle(driver)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            isActive
                              ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                              : 'bg-success-50 text-success-700 hover:bg-success-100 border border-success-200'
                          }`}
                        >
                          {isUpdating ? 'Updating...' : isActive ? 'Set On Leave' : 'Set Active'}
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

      {/* Add Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-slate-800">{editingId ? 'Edit Driver' : 'Add New Driver'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Employee Number *</label>
                  <input type="text" name="employee_number" value={formData.employee_number} onChange={handleChange} required className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">License Number</label>
                  <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">License Expiry</label>
                  <input type="date" name="license_expiry" value={formData.license_expiry} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow">Save Driver</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
