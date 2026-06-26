import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { 
  Truck, Gauge, Compass, MapPin, ClipboardList, CheckCircle2, 
  Search, RefreshCw, Activity, ArrowUpRight, Wrench 
} from 'lucide-react';

export default function FleetOperations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/phase2/garage/status');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch fleet status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner className="w-10 h-10 text-primary-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading Fleet Operations...</p>
      </div>
    );
  }

  const vehicles = data?.vehicles || [];
  const outsideVehicles = data?.outsideVehicles || [];
  const pendingTrips = data?.pendingTrips || 0;

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.registration_no.toLowerCase().includes(search.toLowerCase()) ||
                          v.make.toLowerCase().includes(search.toLowerCase()) ||
                          v.model.toLowerCase().includes(search.toLowerCase()) ||
                          v.vehicle_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const totalFleet = vehicles.length;
  const available = vehicles.filter(v => v.status === 'Available').length;
  const inUse = vehicles.filter(v => v.status === 'In_Use' || v.status === 'In_Transit' || v.status === 'Vehicle Out').length;
  const maintenance = vehicles.filter(v => v.status === 'Maintenance').length;
  const totalKmRun = vehicles.reduce((sum, v) => sum + parseFloat(v.total_km || 0), 0);
  const dailyKmRun = vehicles.reduce((sum, v) => sum + parseFloat(v.daily_km || 0), 0);
  const monthlyKmRun = vehicles.reduce((sum, v) => sum + parseFloat(v.monthly_km || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary-600" />
            Fleet Operations & Dispatch
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Track real-time odometer readings, utilization, and trip log integrations</p>
        </div>
        <Button variant="secondary" onClick={fetchData} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Reload Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-card border-l-4 border-l-primary-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fleet Size</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{totalFleet} Vehicles</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">{pendingTrips} dispatches waiting</p>
        </Card>

        <Card className="hover-card border-l-4 border-l-success-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Fleet</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{available} Active</p>
            </div>
            <div className="p-3 bg-success-50 rounded-xl text-success-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Ready for immediate assignment</p>
        </Card>

        <Card className="hover-card border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currently Out</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{inUse} On Road</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Compass className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Active dispatches logged at gate</p>
        </Card>

        <Card className="hover-card border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Total Run</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{dailyKmRun.toFixed(0)} KM</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Monthly total: {monthlyKmRun.toFixed(0)} KM</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fleet Utilization Table (Left 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <Card header="Vehicle Utilization & Odometer Readings" noPadding>
            {/* Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search vehicle reg no, make..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {['All', 'Available', 'In_Use', 'Maintenance'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      filterStatus === status 
                        ? 'bg-primary-900 border-primary-950 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status === 'In_Use' ? 'Out on Trip' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="px-6 py-3">Vehicle Details</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Odometer</th>
                    <th className="px-6 py-3 text-right">Today's Run</th>
                    <th className="px-6 py-3 text-right">Total Run</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400">
                        No vehicles matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{v.registration_no}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{v.make} {v.model}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">{v.vehicle_type}</td>
                        <td className="px-6 py-4 text-right font-medium">{v.current_odometer || 0} km</td>
                        <td className="px-6 py-4 text-right text-indigo-600 font-semibold">{parseFloat(v.daily_km || 0).toFixed(0)} km</td>
                        <td className="px-6 py-4 text-right text-slate-600 font-semibold">{parseFloat(v.total_km || 0).toFixed(0)} km</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={v.status === 'In_Use' ? 'Vehicle Out' : v.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Tracking Sidebar (Right 1/3) */}
        <div className="space-y-6">
          <Card header="Currently Out on Trips" className="border border-slate-200">
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {outsideVehicles.length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-1">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">All fleet vehicles in garage.</p>
                  <p className="text-xs">No active dispatches are logged out.</p>
                </div>
              ) : (
                outsideVehicles.map((trip, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{trip.registration_no}</h4>
                        <p className="text-[10px] text-slate-500">{trip.make} {trip.model}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Out
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Driver:</span> {trip.driver_name || 'Self Driven'}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Passenger:</span> {trip.requester_name}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Departed:</span> {new Date(trip.exit_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card header="Dispatch Waiting List">
            <div className="flex items-center gap-4 bg-primary-50 p-4 rounded-xl border border-primary-100">
              <ClipboardList className="w-8 h-8 text-primary-600 shrink-0" />
              <div>
                <p className="text-lg font-bold text-primary-950">{pendingTrips}</p>
                <p className="text-xs text-primary-800 font-semibold">Approved requests waiting for vehicle & driver assignments</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
