import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { UserCheck, UserX, Plus, Pencil, AlertTriangle, Shield, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DriverManagement() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    employee_number: '',
    email: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    is_active: true
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    loadStart.current = Date.now();
    try {
      const { data } = await api.get('/drivers');
      setDrivers(data.data || []);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 1500 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }

  function handleChange(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  }

  function openAddModal() {
    setEditingId(null);
    setFormData({ full_name: '', employee_number: '', email: '', phone: '', license_number: '', license_expiry: '', is_active: true });
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(d) {
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
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.full_name.trim() || !formData.employee_number.trim()) {
      setFormError('Full name and employee number are required.');
      return;
    }

    setProcessing(true);
    try {
      if (editingId) {
        await api.put(`/drivers/${editingId}`, formData);
      } else {
        await api.post('/drivers', formData);
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.message || 'Failed to save driver.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleStatusToggle(driver) {
    const newStatus = driver.is_active ? 'On Leave' : 'Active';
    if (newStatus === 'On Leave' && !driver.is_available) {
      alert('Cannot set driver on leave while they are on an active trip.');
      return;
    }
    if (!window.confirm(`Set ${driver.full_name} to "${newStatus}"?`)) return;

    setUpdatingId(driver.id);
    try {
      await api.patch(`/garage/drivers/${driver.id}/status`, { status: newStatus });
      setDrivers(prev => prev.map(d =>
        d.id === driver.id ? { ...d, is_active: newStatus === 'Active' ? 1 : 0 } : d
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update driver status.');
    } finally {
      setUpdatingId(null);
    }
  }

  // Stats
  const activeCount = drivers.filter(d => d.is_active).length;
  const onLeaveCount = drivers.filter(d => !d.is_active).length;
  const expiringCount = drivers.filter(d =>
    d.license_expiry && new Date(d.license_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  if (loading) return <DashboardSkeleton cards={3} rows={5} cols={7} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Driver Management</h1>
          <p className="text-sm text-muted mt-1">Manage drivers, licenses, and availability status</p>
        </div>
        {user?.role === 'Admin' && (
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4" /> Add Driver
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-card animate-fade-in-up delay-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted">Active Drivers</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <UserX className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{onLeaveCount}</p>
              <p className="text-xs text-muted">On Leave</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{expiringCount}</p>
              <p className="text-xs text-muted">Licenses Expiring (30d)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Driver Table */}
      <Card header={
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>All Drivers ({drivers.length})</span>
        </div>
      } noPadding>
        {drivers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No drivers found. Add your first driver.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee No.</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">License No.</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trip Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drivers.map(driver => {
                  const isExpiring = driver.license_expiry &&
                    new Date(driver.license_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  const isExpired = driver.license_expiry &&
                    new Date(driver.license_expiry) < new Date();
                  const isActive = Boolean(driver.is_active);
                  const isUpdating = updatingId === driver.id;

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800">{driver.full_name}</p>
                        {driver.email && <p className="text-xs text-muted">{driver.email}</p>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {driver.employee_number || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-mono text-xs">
                        {driver.license_number || '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        {driver.license_expiry ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            isExpired
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : isExpiring
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {new Date(driver.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {isExpired ? ' ⚠ Expired' : isExpiring ? ' ⚠ Expiring' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          driver.is_available
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {driver.is_available ? 'Available' : 'On Trip'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 border-primary-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {isActive ? 'Active' : 'On Leave'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.role === 'Admin' ? (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openEditModal(driver)}
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={isActive ? 'danger' : 'success'}
                                loading={isUpdating}
                                disabled={isActive && !driver.is_available}
                                title={isActive && !driver.is_available ? 'Driver is currently on a trip and cannot be set on leave.' : ''}
                                onClick={() => handleStatusToggle(driver)}
                              >
                                {isActive ? (
                                  <><UserX className="w-3 h-3" /> Set On Leave</>
                                ) : (
                                  <><UserCheck className="w-3 h-3" /> Set Active</>
                                )}
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Read-Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Driver Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError(''); }}
        title={editingId ? 'Edit Driver' : 'Add New Driver'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="drv-name" className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                id="drv-name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="drv-empno" className="block text-xs font-medium text-slate-700 mb-1">Employee Number *</label>
              <input
                type="text"
                id="drv-empno"
                name="employee_number"
                value={formData.employee_number}
                onChange={handleChange}
                required
                placeholder="e.g. DRV001"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="drv-email" className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                id="drv-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="driver@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="drv-phone" className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                id="drv-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="drv-license" className="block text-xs font-medium text-slate-700 mb-1">License Number</label>
              <input
                type="text"
                id="drv-license"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                placeholder="e.g. MP09 20240001234"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="drv-expiry" className="block text-xs font-medium text-slate-700 mb-1">License Expiry</label>
              <input
                type="date"
                id="drv-expiry"
                name="license_expiry"
                value={formData.license_expiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowModal(false); setFormError(''); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={processing}>
              {editingId ? <><Pencil className="w-4 h-4" /> Update Driver</> : <><Plus className="w-4 h-4" /> Add Driver</>}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
