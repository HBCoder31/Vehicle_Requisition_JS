import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { Truck, PlayCircle, StopCircle, ClipboardList, Car, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GarageDashboard() {
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [licenseAlerts, setLicenseAlerts] = useState([]);
  const [certAlerts, setCertAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [assignModal, setAssignModal] = useState({ open: false, request: null });
  const [assignForm, setAssignForm] = useState({ vehicle_id: '', driver_id: '', remarks: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    loadStart.current = Date.now();
    try {
      const [pendRes, activeRes, vehRes, driverRes, licAlertsRes, certAlertsRes] = await Promise.all([
        api.get('/garage/pending'),
        api.get('/garage/active'),
        api.get('/garage/vehicles'),
        api.get('/garage/drivers'),
        api.get('/drivers/alerts/licenses'),
        api.get('/maintenance/alerts/certificates')
      ]);
      setPending(pendRes.data.requests);
      setActive(activeRes.data.trips);
      setVehicles(vehRes.data.vehicles);
      setDrivers(driverRes.data.drivers);
      setLicenseAlerts(licAlertsRes.data.data || []);
      setCertAlerts(certAlertsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }

  async function handleAssign() {
    if (!assignForm.vehicle_id || !assignForm.driver_id) return alert('Please select a vehicle and a driver.');
    setProcessing(true);
    try {
      await api.patch(`/garage/assign/${assignModal.request.id}`, assignForm);
      setAssignModal({ open: false, request: null });
      setAssignForm({ vehicle_id: '', driver_id: '', remarks: '' });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Assignment failed.');
    } finally { setProcessing(false); }
  }

  async function handlePickup(id) {
    try {
      await api.patch(`/garage/pickup/${id}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  }

  async function handleDropoff(id) {
    try {
      await api.patch(`/garage/dropoff/${id}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  }

  const availableVehicles = vehicles.filter(v => {
    return v.is_available || (assignModal.request && assignModal.request.assigned_vehicle_id === v.id);
  });
  const availableDrivers = drivers.filter(d => {
    return d.is_available || (assignModal.request && assignModal.request.assigned_driver_id === d.id);
  });

  if (loading) return <DashboardSkeleton cards={3} rows={4} cols={5} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Garage Dashboard</h1>
        <p className="text-sm text-muted mt-1">Assign vehicles, manage trips, and monitor your fleet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-card animate-fade-in-up delay-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning-50"><ClipboardList className="w-5 h-5 text-warning-600" /></div>
            <div>
              <p className="text-xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted">Pending Assignment</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50"><Car className="w-5 h-5 text-primary-600" /></div>
            <div>
              <p className="text-xl font-bold">{active.length}</p>
              <p className="text-xs text-muted">Active Trips</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-50"><Truck className="w-5 h-5 text-success-600" /></div>
            <div>
              <p className="text-xl font-bold">{availableVehicles.length}/{vehicles.length}</p>
              <p className="text-xs text-muted">Vehicles Available</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Expiry Alerts */}
      {(licenseAlerts.length > 0 || certAlerts.length > 0) && (
        <Card header="Expiry Alerts" className="border-red-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {licenseAlerts.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="font-semibold text-red-800 mb-2">Driver Licenses Expiring (Next 30 Days)</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {licenseAlerts.map(d => (
                    <li key={d.id}>• {d.full_name} ({d.employee_number}) - <span className="font-bold">{new Date(d.license_expiry).toLocaleDateString()}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {certAlerts.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="font-semibold text-red-800 mb-2">Vehicle Certificates Expiring (Next 30 Days)</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {certAlerts.map(v => (
                    <li key={v.id}>
                      • {v.registration_no} 
                      {v.insurance_expiry && new Date(v.insurance_expiry) < new Date(Date.now() + 30*24*60*60*1000) ? ` - Insurance: ${new Date(v.insurance_expiry).toLocaleDateString()}` : ''}
                      {v.fitness_expiry && new Date(v.fitness_expiry) < new Date(Date.now() + 30*24*60*60*1000) ? ` - Fitness: ${new Date(v.fitness_expiry).toLocaleDateString()}` : ''}
                      {v.pollution_expiry && new Date(v.pollution_expiry) < new Date(Date.now() + 30*24*60*60*1000) ? ` - Pollution: ${new Date(v.pollution_expiry).toLocaleDateString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Pending Assignments */}
      <Card header="Ready for Vehicle Assignment" noPadding>
        {pending.length === 0 ? (
          <div className="p-10 text-center">
            <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No requests pending assignment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requested On</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Travel Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Passengers</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pending.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800">{req.requester_name}</p>
                      <p className="text-xs text-muted">{req.department_name}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{req.destination}</td>
                    <td className="px-6 py-3.5 text-slate-600">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-slate-600">{req.travel_date} {req.travel_time}</td>
                    <td className="px-6 py-3.5 text-slate-600">{req.passengers}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/requests/${req.id}`} className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded-md transition-colors" title="View Details">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Button size="sm" onClick={() => setAssignModal({ open: true, request: req })}>
                          <Truck className="w-3.5 h-3.5" /> Assign
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Active Trips */}
      <Card header="Active Trips" noPadding>
        {active.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted">No active trips.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Driver</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {active.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-medium text-slate-800">{trip.requester_name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{trip.registration_no} ({trip.vehicle_make} {trip.vehicle_model})</td>
                    <td className="px-6 py-3.5 text-slate-600">{trip.assigned_driver}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={trip.status} /></td>
                    <td className="px-6 py-3.5 text-right">
                      {trip.status === 'Vehicle_Assigned' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setAssignModal({ open: true, request: trip });
                              setAssignForm({
                                vehicle_id: trip.assigned_vehicle_id || '',
                                driver_id: trip.assigned_driver_id || '',
                                remarks: trip.garage_remarks || ''
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="success" onClick={() => handlePickup(trip.id)}>
                            <PlayCircle className="w-3.5 h-3.5" /> Pickup
                          </Button>
                        </div>
                      )}
                      {trip.status === 'In_Transit' && (
                        <Button size="sm" variant="danger" onClick={() => handleDropoff(trip.id)}>
                          <StopCircle className="w-3.5 h-3.5" /> Drop-off
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Vehicle Fleet */}
      <Card header="Vehicle Fleet">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className={`p-4 rounded-xl border ${v.is_available ? 'border-success-500/30 bg-success-50/30' : 'border-danger-500/30 bg-danger-50/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-semibold text-slate-800">{v.registration_no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.is_available ? 'bg-success-500 text-white' : 'bg-danger-500 text-white'}`}>
                  {v.is_available ? 'Available' : 'In Use'}
                </span>
              </div>
              <p className="text-sm text-slate-600">{v.make} {v.model}</p>
              <p className="text-xs text-muted">{v.vehicle_type} • {v.capacity} seats • {v.fuel_type}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModal.open}
        onClose={() => { setAssignModal({ open: false, request: null }); setAssignForm({ vehicle_id: '', driver_id: '', remarks: '' }); }}
        title={assignModal.request?.status === 'Vehicle_Assigned'
          ? `Edit Assignment — Request #${assignModal.request?.id}`
          : `Assign Vehicle — Request #${assignModal.request?.id}`}
      >
        <div className="space-y-3">
          <div className="p-2.5 bg-slate-50 rounded-lg text-sm space-y-0.5">
            <p><span className="font-medium">Requester:</span> {assignModal.request?.requester_name}</p>
            <p><span className="font-medium">Destination:</span> {assignModal.request?.destination}</p>
            <p><span className="font-medium">Passengers:</span> {assignModal.request?.passengers}</p>
          </div>
          <div>
            <label htmlFor="vehicle-select" className="block text-xs font-medium text-slate-700 mb-1">Select Vehicle</label>
            <select
              id="vehicle-select"
              value={assignForm.vehicle_id}
              onChange={(e) => setAssignForm(f => ({ ...f, vehicle_id: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
            >
              <option value="">— Choose a vehicle —</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registration_no} — {v.make} {v.model} ({v.capacity} seats)</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="driver-id" className="block text-xs font-medium text-slate-700 mb-1">Select Driver</label>
            <select
              id="driver-id"
              value={assignForm.driver_id}
              onChange={(e) => setAssignForm(f => ({ ...f, driver_id: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
            >
              <option value="">— Choose a driver —</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.full_name} ({d.employee_number})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="garage-remarks" className="block text-xs font-medium text-slate-700 mb-1">Remarks (optional)</label>
            <textarea
              id="garage-remarks"
              value={assignForm.remarks}
              onChange={(e) => setAssignForm(f => ({ ...f, remarks: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => { setAssignModal({ open: false, request: null }); setAssignForm({ vehicle_id: '', driver_id: '', remarks: '' }); }}>Cancel</Button>
            <Button loading={processing} onClick={handleAssign}>
              <Truck className="w-4 h-4" /> {assignModal.request?.status === 'Vehicle_Assigned' ? 'Update Assignment' : 'Assign Vehicle'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
