import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { 
  Shield, DoorOpen, LogOut, LogIn, ArrowUpRight, ArrowDownLeft, 
  Gauge, AlertTriangle, FileText, Camera, CheckCircle2 
} from 'lucide-react';

export default function SecurityDashboard() {
  const [exits, setExits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [entryCost, setEntryCost] = useState(null);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'exit' or 'entry'
  const [selectedItem, setSelectedItem] = useState(null);

  // Form States
  const [gateNo, setGateNo] = useState('Gate 1');
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('Full');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [vehicleCondition, setVehicleCondition] = useState('Ok');
  const [damageReport, setDamageReport] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [exitsRes, entriesRes] = await Promise.all([
        api.get('/phase2/gate/exits'),
        api.get('/phase2/gate/entries')
      ]);
      setExits(exitsRes.data.data || []);
      setEntries(entriesRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch gate logs. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openExitModal = (item) => {
    setSelectedItem(item);
    setOdometer(item.current_odometer || '');
    setFuelLevel('Full');
    setRemarks('');
    setPhotoUrl('');
    setActiveModal('exit');
  };

  const openEntryModal = (item) => {
    setSelectedItem(item);
    setOdometer('');
    setFuelLevel('Full');
    setRemarks('');
    setPhotoUrl('');
    setVehicleCondition('Ok');
    setDamageReport('');
    setActiveModal('entry');
  };

  const closeModals = () => {
    setActiveModal(null);
    setSelectedItem(null);
    setError('');
  };

  const handleExitSubmit = async (e) => {
    e.preventDefault();
    if (!odometer || isNaN(odometer) || parseFloat(odometer) <= 0) {
      setError('Please enter a valid odometer reading.');
      return;
    }
    if (parseFloat(odometer) < parseFloat(selectedItem.current_odometer || 0)) {
      setError(`Odometer reading cannot be less than the last recorded reading (${selectedItem.current_odometer || 0}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/phase2/gate/exit', {
        request_id: selectedItem.id,
        vehicle_id: selectedItem.assigned_vehicle_id,
        driver_id: selectedItem.assigned_driver_id,
        employee_id: selectedItem.employee_id,
        odometer_out: parseFloat(odometer),
        fuel_level_out: fuelLevel,
        gate_no_out: gateNo,
        remarks_out: remarks,
        photo_url_out: photoUrl
      });
      setSuccess('Exit logged successfully!');
      setTimeout(() => setSuccess(''), 4000);
      closeModals();
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to log exit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    if (!odometer || isNaN(odometer) || parseFloat(odometer) <= 0) {
      setError('Please enter a valid odometer reading.');
      return;
    }
    if (parseFloat(odometer) < parseFloat(selectedItem.odometer_out)) {
      setError(`Return odometer (${odometer}) cannot be less than the exit odometer (${selectedItem.odometer_out}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await api.post('/phase2/gate/entry', {
        request_id: selectedItem.request_id,
        odometer_in: parseFloat(odometer),
        fuel_level_in: fuelLevel,
        vehicle_condition: vehicleCondition,
        damage_report: vehicleCondition === 'Damaged' ? damageReport : '',
        remarks_in: remarks,
        photo_url_in: photoUrl
      });
      const cost = response.data?.cost || 0;
      setEntryCost(cost);
      setSuccess(`Entry logged successfully! Travel cost: $${cost}`);
      setTimeout(() => setSuccess(''), 4000);
      closeModals();
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to log entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && exits.length === 0 && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner className="w-10 h-10 text-primary-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading Gate logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-400" />
            Security Gate Management
          </h1>
          <p className="text-xs text-primary-200 mt-1">Real-time logging of vehicle dispatch exits and return entries</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchData} className="text-slate-900 bg-white hover:bg-slate-100 border-none font-semibold">
            Refresh Lists
          </Button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PENDING EXITS COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-500" />
              Pending Dispatches / Exits ({exits.length})
            </h2>
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-full">Gate Exit Required</span>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {exits.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">
                <DoorOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No pending dispatches.</p>
                <p className="text-xs text-slate-400 mt-0.5">Vehicles will show here once assigned in garage.</p>
              </Card>
            ) : (
              exits.map((item) => (
                <Card key={`exit-${item.id}`} className="hover-card transition-all duration-200 border-l-4 border-l-amber-500">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{item.destination}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Requester: <span className="font-semibold text-slate-700">{item.requester_name}</span> ({item.department_name})</p>
                      <p className="text-xs text-slate-500 mt-1">Vehicle: <span className="font-semibold text-slate-700">{item.registration_no}</span> ({item.make} {item.model})</p>
                      <p className="text-xs text-slate-500">Driver: <span className="font-semibold text-slate-700">{item.driver_name || 'Self Driven'}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">{item.travel_date}</span>
                      <span className="text-xs text-slate-400 block font-medium">{item.travel_time}</span>
                      <StatusBadge status={item.status} className="mt-2" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> Odo: {item.current_odometer || 0} km
                    </span>
                    <Button size="sm" onClick={() => openExitModal(item)} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1">
                      <LogOut className="w-4 h-4" /> Log Exit
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* PENDING ENTRIES COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-teal-500" />
              Vehicles Out / Pending Return ({entries.length})
            </h2>
            <span className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 font-semibold rounded-full">Gate Entry Required</span>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {entries.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">
                <DoorOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No vehicles are currently out.</p>
                <p className="text-xs text-slate-400 mt-0.5">Exited vehicles will show here until they return.</p>
              </Card>
            ) : (
              entries.map((item) => (
                <Card key={`entry-${item.id}`} className="hover-card transition-all duration-200 border-l-4 border-l-teal-500">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{item.destination}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Requester: <span className="font-semibold text-slate-700">{item.requester_name}</span> ({item.department_name})</p>
                      <p className="text-xs text-slate-500 mt-1">Vehicle: <span className="font-semibold text-slate-700">{item.registration_no}</span> ({item.make} {item.model})</p>
                      <p className="text-xs text-slate-500">Driver: <span className="font-semibold text-slate-700">{item.driver_name || 'Self Driven'}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Exited: {new Date(item.exit_time).toLocaleTimeString()}</span>
                      <span className="text-xs text-slate-400 block font-medium">Gate: {item.gate_no_out}</span>
                      <StatusBadge status={item.status} className="mt-2" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> Out Odo: {item.odometer_out} km
                    </span>
                    <Button size="sm" onClick={() => openEntryModal(item)} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1">
                      <LogIn className="w-4 h-4" /> Log Return
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>

      {/* GATE EXIT MODAL */}
      {activeModal === 'exit' && selectedItem && (
        <Modal isOpen={true} onClose={closeModals} title="Log Vehicle Exit">
          <form onSubmit={handleExitSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600 border border-slate-100">
              <p><span className="font-semibold text-slate-700">Vehicle:</span> {selectedItem.registration_no} ({selectedItem.make} {selectedItem.model})</p>
              <p><span className="font-semibold text-slate-700">Driver:</span> {selectedItem.driver_name || 'Self Driven'}</p>
              <p><span className="font-semibold text-slate-700">Requester:</span> {selectedItem.requester_name}</p>
              <p><span className="font-semibold text-slate-700">Destination:</span> {selectedItem.destination}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gate Number</label>
                <select 
                  value={gateNo} 
                  onChange={(e) => setGateNo(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="Gate 1">Gate 1</option>
                  <option value="Gate 2">Gate 2</option>
                  <option value="Gate 3">Gate 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Odometer (Out) *</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 15300"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Last odometer: {selectedItem.current_odometer || 0} km</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel Level (Out)</label>
                <select
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="Full">Full</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="Reserve">Reserve</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gate Pass Photo URL</label>
                <div className="relative">
                  <Camera className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="https://example.com/gatepass.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg pl-2 pr-8 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
              <textarea 
                placeholder="Any outward damage or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 h-20 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeModals} disabled={submitting}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Log Exit Now'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* GATE ENTRY MODAL */}
      {activeModal === 'entry' && selectedItem && (
        <Modal isOpen={true} onClose={closeModals} title="Log Vehicle Return">
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600 border border-slate-100">
              <p><span className="font-semibold text-slate-700">Vehicle:</span> {selectedItem.registration_no} ({selectedItem.make} {selectedItem.model})</p>
              <p><span className="font-semibold text-slate-700">Requester:</span> {selectedItem.requester_name}</p>
              <p><span className="font-semibold text-slate-700">Odometer Out:</span> {selectedItem.odometer_out} km</p>
              <p><span className="font-semibold text-slate-700">Exit Time:</span> {new Date(selectedItem.exit_time).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Odometer (In) *</label>
                <input 
                  type="number" 
                  required
                  placeholder={`Min: ${selectedItem.odometer_out}`}
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Must be equal or greater than {selectedItem.odometer_out} km</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel Level (In)</label>
                <select
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="Full">Full</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="Reserve">Reserve</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Condition</label>
                <select
                  value={vehicleCondition}
                  onChange={(e) => setVehicleCondition(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="Ok">Clean & Ok</option>
                  <option value="Dirty">Dirty (Needs Wash)</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Return Photo URL</label>
                <div className="relative">
                  <Camera className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="https://example.com/return.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg pl-2 pr-8 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {vehicleCondition === 'Damaged' && (
              <div className="animate-slide-down">
                <label className="block text-xs font-semibold text-danger-700 mb-1">Damage Details *</label>
                <textarea 
                  required
                  placeholder="Describe damage found on body, tires, or interior..."
                  value={damageReport}
                  onChange={(e) => setDamageReport(e.target.value)}
                  className="w-full text-sm border border-danger-200 rounded-lg p-2 h-20 resize-none focus:border-danger-500 focus:ring-1 focus:ring-danger-500 outline-none bg-danger-50/20"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Return Remarks</label>
              <textarea 
                placeholder="Any driver feedback or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 h-20 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeModals} disabled={submitting}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Log Return Now'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
