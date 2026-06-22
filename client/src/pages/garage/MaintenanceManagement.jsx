import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { Wrench, Plus, Calendar, Truck, CheckCircle, XCircle, PlayCircle, AlertTriangle, ArrowUpDown } from 'lucide-react';

export default function MaintenanceManagement() {
  const [schedules, setSchedules] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusProcessing, setStatusProcessing] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [formData, setFormData] = useState({
    vehicle_id: '',
    scheduled_date: '',
    description: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    loadStart.current = Date.now();
    try {
      const [schedRes, vehRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/maintenance/available-vehicles')
      ]);
      setSchedules(schedRes.data.data || []);
      setAvailableVehicles(vehRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch maintenance data:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 1500 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  function getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.vehicle_id || !formData.scheduled_date || !formData.description.trim()) {
      setFormError('All fields are required.');
      return;
    }

    // Additional frontend date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(formData.scheduled_date);
    selected.setHours(0, 0, 0, 0);
    if (selected < today) {
      setFormError('Cannot schedule maintenance for a past date.');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/maintenance', formData);
      setShowModal(false);
      setFormData({ vehicle_id: '', scheduled_date: '', description: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to schedule maintenance.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleStatusUpdate(id, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus === 'Completed' ? 'complete' : newStatus === 'Cancelled' ? 'cancel' : 'start'} this maintenance?`)) return;

    setStatusProcessing(id);
    try {
      await api.patch(`/maintenance/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update status.');
    } finally {
      setStatusProcessing(null);
    }
  }

  function openModal() {
    setFormData({ vehicle_id: '', scheduled_date: '', description: '' });
    setFormError('');
    setShowModal(true);
  }

  // Sort schedules
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = new Date(a.scheduled_date);
    const dateB = new Date(b.scheduled_date);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Status badge mapping
  function getStatusStyle(status) {
    switch (status) {
      case 'Scheduled':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In_Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  // Stats
  const scheduledCount = schedules.filter(s => s.status === 'Scheduled').length;
  const inProgressCount = schedules.filter(s => s.status === 'In_Progress').length;
  const completedCount = schedules.filter(s => s.status === 'Completed').length;

  if (loading) return <DashboardSkeleton cards={3} rows={4} cols={5} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vehicle Maintenance</h1>
          <p className="text-sm text-muted mt-1">Schedule and track vehicle maintenance activities</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="w-4 h-4" /> Schedule Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-card animate-fade-in-up delay-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{scheduledCount}</p>
              <p className="text-xs text-muted">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-muted">In Progress</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span>Maintenance Schedules</span>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title={`Sort by date: ${sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
            </button>
          </div>
        }
        noPadding
      >
        {sortedSchedules.length === 0 ? (
          <div className="p-10 text-center">
            <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No maintenance schedules found.</p>
            <p className="text-xs text-muted mt-1">Click "Schedule Service" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Scheduled Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Scheduled By</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedSchedules.map(schedule => (
                  <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          <Truck className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-800">{schedule.registration_no}</p>
                          <p className="text-xs text-muted">{schedule.make} {schedule.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700">{new Date(schedule.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs">
                      <p className="truncate" title={schedule.description}>{schedule.description}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {schedule.creator_name || 'System'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusStyle(schedule.status)}`}>
                        {schedule.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {schedule.status === 'Scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusUpdate(schedule.id, 'In_Progress')}
                              loading={statusProcessing === schedule.id}
                              title="Start Maintenance"
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Start
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleStatusUpdate(schedule.id, 'Completed')}
                              loading={statusProcessing === schedule.id}
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleStatusUpdate(schedule.id, 'Cancelled')}
                              loading={statusProcessing === schedule.id}
                              title="Cancel Maintenance"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        )}
                        {schedule.status === 'In_Progress' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleStatusUpdate(schedule.id, 'Completed')}
                              loading={statusProcessing === schedule.id}
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleStatusUpdate(schedule.id, 'Cancelled')}
                              loading={statusProcessing === schedule.id}
                              title="Cancel Maintenance"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </>
                        )}
                        {(schedule.status === 'Completed' || schedule.status === 'Cancelled') && (
                          <span className="text-xs text-muted italic">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError(''); }}
        title="Schedule Vehicle Maintenance"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label htmlFor="maint-vehicle" className="block text-xs font-medium text-slate-700 mb-1">Select Vehicle</label>
            <select
              id="maint-vehicle"
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={e => setFormData(f => ({ ...f, vehicle_id: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none transition-colors"
            >
              <option value="">— Choose an available vehicle —</option>
              {availableVehicles.length === 0 ? (
                <option disabled>No vehicles available</option>
              ) : (
                availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registration_no} — {v.make} {v.model} ({v.vehicle_type})
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-muted mt-1">Only vehicles that are not on a trip or assigned are shown.</p>
          </div>

          <div>
            <label htmlFor="maint-date" className="block text-xs font-medium text-slate-700 mb-1">Scheduled Date</label>
            <input
              type="date"
              id="maint-date"
              name="scheduled_date"
              value={formData.scheduled_date}
              onChange={e => setFormData(f => ({ ...f, scheduled_date: e.target.value }))}
              min={getTodayStr()}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none transition-colors"
            />
            <p className="text-[11px] text-muted mt-1">Only today and future dates are allowed.</p>
          </div>

          <div>
            <label htmlFor="maint-desc" className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              id="maint-desc"
              name="description"
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              required
              rows={3}
              placeholder="Describe the maintenance work needed..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors resize-none"
            />
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
              <Wrench className="w-4 h-4" /> Schedule Maintenance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
