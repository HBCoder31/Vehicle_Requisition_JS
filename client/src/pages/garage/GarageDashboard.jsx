import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { Truck, PlayCircle, StopCircle, ClipboardList, Car, ExternalLink, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseDate } from '../../utils/date';

export default function GarageDashboard() {
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [licenseAlerts, setLicenseAlerts] = useState([]);
  const [certAlerts, setCertAlerts] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments', 'trips', 'fleet', 'feedbacks'
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [assignModal, setAssignModal] = useState({ open: false, request: null });
  const [assignForm, setAssignForm] = useState({ vehicle_id: '', driver_id: '', remarks: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    loadStart.current = Date.now();
    try {
      const [pendRes, activeRes, vehRes, driverRes, licAlertsRes, certAlertsRes, feedbackRes] = await Promise.all([
        api.get('/garage/pending'),
        api.get('/garage/active'),
        api.get('/garage/vehicles'),
        api.get('/garage/drivers'),
        api.get('/drivers/alerts/licenses'),
        api.get('/maintenance/alerts/certificates'),
        api.get('/feedback/all/garage')
      ]);
      setPending(pendRes.data.requests);
      setActive(activeRes.data.trips);
      setVehicles(vehRes.data.vehicles);
      setDrivers(driverRes.data.drivers);
      setLicenseAlerts(licAlertsRes.data.data || []);
      setCertAlerts(certAlertsRes.data.data || []);
      setFeedbacks(feedbackRes.data.data || []);
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
    return (v.is_available && v.is_active === 1) || (assignModal.request && assignModal.request.assigned_vehicle_id === v.id);
  });
  const availableDrivers = drivers.filter(d => {
    return d.is_available || (assignModal.request && assignModal.request.assigned_driver_id === d.id);
  });

  function getVehicleStatusInfo(v) {
    if (v.is_active === 0) {
      return { label: 'Deactivated', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (v.maintenance_status === 'In_Progress') {
      return { label: 'In Maintenance', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (v.maintenance_status === 'Scheduled') {
      return { label: 'Maint. Scheduled', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (v.trip_status === 'In_Transit') {
      return { label: 'On Trip (Transit)', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
    if (v.trip_status === 'Vehicle_Assigned') {
      return { label: 'Assigned to Trip', className: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    if (v.is_available === 1) {
      return { label: 'Available', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { label: 'In Use', className: 'bg-rose-100 text-rose-800 border-rose-200' };
  }

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
                    <li key={d.id}>• {d.full_name} ({d.employee_number}) - <span className="font-bold">{parseDate(d.license_expiry)?.toLocaleDateString() || '—'}</span></li>
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
                      {v.insurance_expiry && parseDate(v.insurance_expiry) < new Date(Date.now() + 30*24*60*60*1000) ? ` - Insurance: ${parseDate(v.insurance_expiry).toLocaleDateString()}` : ''}
                      {v.fitness_expiry && parseDate(v.fitness_expiry) < new Date(Date.now() + 30*24*60*60*1000) ? ` - Fitness: ${parseDate(v.fitness_expiry).toLocaleDateString()}` : ''}
                      {v.pollution_expiry && parseDate(v.pollution_expiry) < new Date(Date.now() + 30*24*60*60*1000) ? ` - Pollution: ${parseDate(v.pollution_expiry).toLocaleDateString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none ${
            activeTab === 'assignments'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Pending Assignments
          {pending.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-800 rounded-full">
              {pending.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none ${
            activeTab === 'trips'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Car className="w-4 h-4" />
          Active Trips
          {active.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-800 rounded-full">
              {active.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none ${
            activeTab === 'fleet'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Truck className="w-4 h-4" />
          Vehicle Fleet
        </button>

        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 outline-none ${
            activeTab === 'feedbacks'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Star className="w-4 h-4" />
          Driver Feedbacks
          {feedbacks.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              {feedbacks.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending Assignments Tab */}
      {activeTab === 'assignments' && (
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
                      <td className="px-6 py-3.5 text-slate-600">{parseDate(req.created_at)?.toLocaleDateString() || '—'}</td>
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
      )}

      {/* Active Trips Tab */}
      {activeTab === 'trips' && (
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Travel Date/Time</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicle</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Driver</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {active.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <Link to={`/requests/${trip.id}`} className="font-medium text-primary-600 hover:underline">
                          {trip.requester_name}
                        </Link>
                        <p className="text-xs text-muted">{trip.department_name}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-medium">
                        {trip.destination}
                        {trip.passengers > 0 && <span className="text-[11px] text-muted block">{trip.passengers} passenger(s)</span>}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        <p className="text-sm font-medium">{trip.travel_date}</p>
                        <p className="text-xs text-muted">{trip.travel_time}</p>
                        {trip.pickup_time && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded block w-fit mt-1">
                            Departed: {parseDate(trip.pickup_time) ? parseDate(trip.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-mono text-sm font-semibold text-slate-800">{trip.registration_no}</p>
                        <p className="text-xs text-muted">{trip.vehicle_make} {trip.vehicle_model}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-medium">{trip.assigned_driver}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={trip.status} /></td>
                      <td className="px-6 py-3.5 text-right">
                        {(trip.status === 'Vehicle_Assigned' || trip.status === 'Vehicle Out') && (
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
                            <Button 
                              size="sm" 
                              variant="success" 
                              onClick={() => handlePickup(trip.id)}
                              disabled={trip.status === 'Vehicle_Assigned'}
                              title={trip.status === 'Vehicle_Assigned' ? 'Waiting for Security Gate Exit Log' : 'Start Trip'}
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Pickup
                            </Button>
                          </div>
                        )}
                        {(trip.status === 'In_Transit' || trip.status === 'Vehicle Returned') && (
                          <Button 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleDropoff(trip.id)}
                            disabled={trip.status === 'In_Transit'}
                            title={trip.status === 'In_Transit' ? 'Waiting for Security Gate Return Log' : 'Complete Trip'}
                          >
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
      )}

      {/* Vehicle Fleet Tab */}
      {activeTab === 'fleet' && (
        <Card header="Vehicle Fleet">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => {
              const statusInfo = getVehicleStatusInfo(v);
              // Border and background classes based on state
              let statusCardStyle = 'border-border bg-white';
              if (v.is_active === 0) {
                statusCardStyle = 'border-slate-200 bg-slate-50/50 opacity-70';
              } else if (v.maintenance_status === 'In_Progress') {
                statusCardStyle = 'border-blue-200 bg-blue-50/5';
              } else if (v.maintenance_status === 'Scheduled') {
                statusCardStyle = 'border-amber-200 bg-amber-50/5';
              } else if (v.trip_status === 'In_Transit') {
                statusCardStyle = 'border-indigo-200 bg-indigo-50/5';
              } else if (v.trip_status === 'Vehicle_Assigned') {
                statusCardStyle = 'border-purple-200 bg-purple-50/5';
              } else if (v.is_available === 1) {
                statusCardStyle = 'border-emerald-200 bg-emerald-50/5';
              } else {
                statusCardStyle = 'border-rose-200 bg-rose-50/5';
              }

              return (
                <div key={v.id} className={`p-4 rounded-xl border ${statusCardStyle} transition-all duration-200 hover:shadow-sm hover:border-slate-300`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold text-slate-800">{v.registration_no}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{v.make} {v.model}</p>
                  <p className="text-xs text-muted mt-0.5">{v.vehicle_type} • {v.capacity} seats • {v.fuel_type}</p>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-muted">
                    <span>Odometer: <span className="font-mono text-slate-700 font-semibold">{v.current_odometer || 0} km</span></span>
                    {v.is_active === 1 && v.is_available === 1 && (
                      <span className="text-emerald-600 font-medium">Ready for dispatch</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Driver Feedbacks Tab */}
      {activeTab === 'feedbacks' && (
        <Card header="Driver Feedbacks" noPadding>
          {feedbacks.length === 0 ? (
            <div className="p-10 text-center">
              <Star className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-muted">No driver feedbacks submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Request</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Driver</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Comments</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Submitted On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {feedbacks.map(fb => (
                    <tr key={fb.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 font-medium text-slate-800">
                        <Link to={`/requests/${fb.request_id}`} className="text-primary-600 hover:underline">
                          #{fb.request_id}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-slate-800">{fb.requester_name}</p>
                        <p className="text-xs text-muted">{fb.department_name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-medium">{fb.driver_name}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= fb.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate" title={fb.comments}>
                        {fb.comments || <span className="text-slate-400 italic">No comments</span>}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {parseDate(fb.created_at)?.toLocaleDateString() || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

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
