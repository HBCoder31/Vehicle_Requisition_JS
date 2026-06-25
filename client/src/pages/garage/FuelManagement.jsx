import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { Fuel, Plus, Calendar, Truck, User, Gauge, ArrowUpDown, Search, AlertTriangle, Coins, Download } from 'lucide-react';
import { parseDate } from '../../utils/date';

export default function FuelManagement() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    log_date: '',
    liters: '',
    cost: '',
    odometer_reading: ''
  });
  const [formError, setFormError] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    loadStart.current = Date.now();
    try {
      const [logsRes, vehRes, drvRes] = await Promise.all([
        api.get('/fuel'),
        api.get('/garage/vehicles'),
        api.get('/drivers')
      ]);
      setLogs(logsRes.data?.data || []);
      setVehicles(vehRes.data?.vehicles || []);
      setDrivers(drvRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch fuel management data:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 1500 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }

  // Get current datetime string for local timezone input default
  function getCurrentDateTimeStr() {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = parseDate(dateStr);
    return !d || isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }


  function openModal() {
    setFormData({
      vehicle_id: '',
      driver_id: '',
      log_date: getCurrentDateTimeStr(),
      liters: '',
      cost: '',
      odometer_reading: ''
    });
    setFormError('');
    setShowModal(true);
  }

  function handleChange(e) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const vehicleId = parseInt(formData.vehicle_id);
    const driverId = formData.driver_id ? parseInt(formData.driver_id) : null;
    const liters = parseFloat(formData.liters);
    const cost = parseFloat(formData.cost);
    const odometer = parseInt(formData.odometer_reading);

    // Validation
    if (!vehicleId || isNaN(liters) || isNaN(cost) || isNaN(odometer) || !formData.log_date) {
      setFormError('All fields marked with an asterisk (*) are required.');
      return;
    }

    if (liters <= 0) {
      setFormError('Liters logged must be greater than 0.');
      return;
    }

    if (cost <= 0) {
      setFormError('Fuel cost must be greater than 0.');
      return;
    }

    if (odometer < 0) {
      setFormError('Odometer reading cannot be negative.');
      return;
    }

    // Verify odometer is not less than the vehicle's current odometer
    const selectedVeh = vehicles.find(v => v.id === vehicleId);
    if (selectedVeh && odometer < (selectedVeh.current_odometer || 0)) {
      setFormError(`Odometer reading cannot be less than the vehicle's last recorded odometer (${selectedVeh.current_odometer || 0} km).`);
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        vehicle_id: vehicleId,
        driver_id: driverId,
        log_date: formData.log_date,
        liters,
        cost,
        odometer_reading: odometer
      };

      await api.post('/fuel', payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to record fuel log.');
    } finally {
      setProcessing(false);
    }
  }

  // Calculate statistics
  const totalCost = logs.reduce((acc, log) => acc + parseFloat(log.cost || 0), 0);
  const totalLiters = logs.reduce((acc, log) => acc + parseFloat(log.liters || 0), 0);
  const totalLogsCount = logs.length;

  // Filter logs by search query (registration number or driver name)
  const filteredLogs = logs.filter(log => {
    const regNo = (log.registration_no || '').toLowerCase();
    const drvName = (log.driver_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return regNo.includes(query) || drvName.includes(query);
  });

  // Sort logs by date
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = parseDate(a.log_date);
    const dateB = parseDate(b.log_date);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Filter out deactivated vehicles for selection
  const activeVehicles = vehicles.filter(v => v.is_active === 1);

  const exportPDF = () => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Add document title and stats header
      doc.setFontSize(18);
      doc.text("Garage Fuel Logs Report", 14, 15);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 22);
      doc.text(`Total Records: ${sortedLogs.length} | Total Volume: ${totalLiters.toFixed(2)} L | Total Cost: Rs ${totalCost.toFixed(2)}`, 14, 27);
      
      // Format rows for autoTable
      const tableBody = sortedLogs.map(log => [
        formatDate(log.log_date),
        `${log.registration_no || ''} (${log.make || ''} ${log.model || ''})`,
        log.driver_name || 'No driver assigned',
        `${parseFloat(log.liters || 0).toFixed(2)} L`,
        `Rs ${parseFloat(log.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `${log.odometer_reading != null ? Number(log.odometer_reading).toLocaleString() : '0'} km`
      ]);
      
      doc.autoTable({
        startY: 33,
        head: [['Date & Time', 'Vehicle', 'Driver', 'Fuel Volume', 'Total Cost', 'Odometer']],
        body: tableBody,
      });
      
      doc.save("garage-fuel-logs.pdf");
    } catch (err) {
      alert('Failed to generate PDF. Make sure CDNs are loaded.');
      console.error(err);
    }
  };

  const exportExcel = () => {
    try {
      const XLSX = window.XLSX;
      const dataToExport = sortedLogs.map(log => ({
        'Date & Time': formatDate(log.log_date),
        'Vehicle Registration': log.registration_no || '',
        'Vehicle Make': log.make || '',
        'Vehicle Model': log.model || '',
        'Driver Name': log.driver_name || 'No driver assigned',
        'Fuel Volume (Liters)': parseFloat(log.liters || 0),
        'Total Cost (INR)': parseFloat(log.cost || 0),
        'Odometer (km)': log.odometer_reading != null ? parseInt(log.odometer_reading) : 0
      }));
      
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fuel Logs");
      XLSX.writeFile(wb, "garage-fuel-logs.xlsx");
    } catch (err) {
      alert('Failed to generate Excel. Make sure CDNs are loaded.');
      console.error(err);
    }
  };

  if (loading) return <DashboardSkeleton cards={3} rows={4} cols={6} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fuel Management</h1>
          <p className="text-sm text-muted mt-1">Track vehicle fueling logs, costs, and odometer history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportPDF}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="secondary" onClick={exportExcel}>
            <Download className="w-4 h-4" /> Excel
          </Button>
          <Button onClick={openModal}>
            <Plus className="w-4 h-4" /> Log Fuel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-card animate-fade-in-up delay-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <Coins className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted">Total Expenses</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Fuel className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalLiters.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L</p>
              <p className="text-xs text-muted">Total Fuel Volume</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <Gauge className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalLogsCount}</p>
              <p className="text-xs text-muted">Receipts Logged</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fuel Logs Card */}
      <Card
        header={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <span className="font-semibold text-slate-800">Fuel Receipts Logs</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vehicle or driver..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-xs bg-white focus:border-primary-500 outline-none w-48 transition-all"
                />
              </div>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title={`Sort by date: ${sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
              </button>
            </div>
          </div>
        }
        noPadding
      >
        {sortedLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Fuel className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No fuel logs found.</p>
            {searchQuery && <p className="text-xs text-muted mt-1">Try clearing your search query.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuel Volume</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cost</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer Reading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {sortedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(log.log_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          <Truck className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-800">{log.registration_no}</p>
                          <p className="text-xs text-muted">{log.make} {log.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-700">
                      {log.driver_name ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{log.driver_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No driver assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-800 font-semibold">
                      {parseFloat(log.liters || 0).toFixed(2)} L
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap font-bold text-rose-600">
                      ₹{parseFloat(log.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                      {log.odometer_reading != null ? Number(log.odometer_reading).toLocaleString() : '0'} km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Log Fuel Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError(''); }}
        title="Log Fuel Receipt"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label htmlFor="fuel-vehicle" className="block text-xs font-medium text-slate-700 mb-1">Select Vehicle *</label>
            <select
              id="fuel-vehicle"
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none transition-colors"
            >
              <option value="">— Choose a vehicle —</option>
              {activeVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_no} — {v.make} {v.model} (Odo: {v.current_odometer || 0} km)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fuel-driver" className="block text-xs font-medium text-slate-700 mb-1">Driver (Optional)</label>
            <select
              id="fuel-driver"
              name="driver_id"
              value={formData.driver_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none transition-colors"
            >
              <option value="">— Select Driver (if known) —</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.employee_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fuel-date" className="block text-xs font-medium text-slate-700 mb-1">Log Date & Time *</label>
              <input
                type="datetime-local"
                id="fuel-date"
                name="log_date"
                value={formData.log_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fuel-odo" className="block text-xs font-medium text-slate-700 mb-1">Odometer (km) *</label>
              <input
                type="number"
                id="fuel-odo"
                name="odometer_reading"
                value={formData.odometer_reading}
                onChange={handleChange}
                required
                placeholder="Current km reading"
                min="0"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fuel-liters" className="block text-xs font-medium text-slate-700 mb-1">Liters *</label>
              <input
                type="number"
                step="0.01"
                id="fuel-liters"
                name="liters"
                value={formData.liters}
                onChange={handleChange}
                required
                placeholder="Volume in Liters"
                min="0.01"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fuel-cost" className="block text-xs font-medium text-slate-700 mb-1">Total Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                id="fuel-cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
                placeholder="Amount spent"
                min="0.01"
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
              <Fuel className="w-4 h-4" /> Save Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
