import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { 
  TrendingUp, BarChart3, Building2, Users, Truck, IndianRupee, Compass, 
  MapPin, Calendar, CheckCircle2, ChevronRight, Activity, Globe 
} from 'lucide-react';

export default function FleetAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/phase2/analytics');
      setAnalytics(res.data.data);
      setRole(res.data.role);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner className="w-10 h-10 text-primary-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Computing Travel Analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-3" />
        <p className="text-sm font-semibold">No analytics data available.</p>
      </div>
    );
  }

  // --- HOD DASHBOARD VIEW ---
  if (role === 'HOD') {
    const { totals, employees, recentTrips } = analytics;
    const activeTotals = totals || { total_trips: 0, total_distance: 0, total_cost: 0, total_outstanding: 0 };
    const maxCost = employees.length > 0 ? Math.max(...employees.map(e => parseFloat(e.total_cost || 0)), 1) : 1;

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="bg-gradient-to-r from-warning-500/10 to-primary-600/10 border border-warning-200/50 p-6 rounded-2xl">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-warning-600" />
            Department Travel Analytics (HOD)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance tracking and travel ledger summaries for your department</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Department Trips</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{activeTotals.total_trips} Trips</p>
            <span className="text-[10px] text-slate-500 mt-2 block font-medium">Accumulated trips completed</span>
          </Card>
          <Card className="hover-card">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Distance</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{parseFloat(activeTotals.total_distance).toFixed(1)} KM</p>
            <span className="text-[10px] text-slate-500 mt-2 block font-medium">Department vehicle running</span>
          </Card>
          <Card className="hover-card">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cost incurred</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">₹{parseFloat(activeTotals.total_cost).toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-slate-500 mt-2 block font-medium">Subject to rate metrics</span>
          </Card>
          <Card className="hover-card border-l-4 border-l-warning-500 bg-amber-50/5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding Dues</p>
            <p className="text-2xl font-bold text-warning-600 mt-1">₹{parseFloat(activeTotals.total_outstanding).toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-slate-500 mt-2 block font-medium">Dues pending payment</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Breakdown */}
          <Card header="Employee Travel Breakdown">
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {employees.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No employee travel data logged.</p>
              ) : (
                employees.map((e, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{e.full_name}</span>
                        <span className="text-slate-400 ml-1.5 font-mono">({e.employee_number})</span>
                      </div>
                      <span className="font-bold text-slate-700">₹{parseFloat(e.total_cost).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-600 rounded-full transition-all duration-300"
                          style={{ width: `${(parseFloat(e.total_cost) / maxCost) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 w-16 text-right font-medium">{e.total_trips} trips ({parseFloat(e.total_distance).toFixed(0)} km)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Department Trips */}
          <Card header="Recent Department Trips" noPadding>
            <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
              {recentTrips.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No recent department trips.</p>
              ) : (
                recentTrips.map((trip) => (
                  <div key={trip.id} className="p-4 hover:bg-slate-50/50 transition-colors flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{trip.destination}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Passenger: <span className="font-semibold">{trip.requester_name}</span> | Vehicle: {trip.registration_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-700">₹{parseFloat(trip.travel_cost).toFixed(0)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{trip.travel_date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- CONSOLIDATED COMPANY WIDE VIEW (GM-HR, COO, Admin) ---
  const { totals, departmentBreakdown, topEmployees, vehicleBreakdown, monthlyBreakdown } = analytics;
  const activeTotals = totals || { total_distance: 0, total_cost: 0, total_paid: 0, total_outstanding: 0 };

  const maxDeptCost = departmentBreakdown.length > 0 ? Math.max(...departmentBreakdown.map(d => parseFloat(d.total_cost || 0)), 1) : 1;
  const maxEmpCost = topEmployees.length > 0 ? Math.max(...topEmployees.map(e => parseFloat(e.total_cost || 0)), 1) : 1;
  const maxVehCost = vehicleBreakdown.length > 0 ? Math.max(...vehicleBreakdown.map(v => parseFloat(v.total_cost || 0)), 1) : 1;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-7 h-7 text-indigo-400" />
            Consolidated Fleet Analytics
          </h1>
          <p className="text-xs text-primary-200 mt-1">Company-wide statistics, department utilization, vehicle running, and cost distributions</p>
        </div>
        <span className="px-3 py-1 bg-white/10 text-white font-bold rounded-lg text-xs tracking-wider border border-white/20">
          ROLE: {role}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-card border-l-4 border-l-primary-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consolidated Run KM</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{parseFloat(activeTotals.total_distance).toLocaleString('en-IN')} KM</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Total logged gate travel</span>
        </Card>
        <Card className="hover-card border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consolidated Billed Cost</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">₹{parseFloat(activeTotals.total_cost).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Calculated based on rate settings</span>
        </Card>
        <Card className="hover-card border-l-4 border-l-success-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cleared Dues</p>
          <p className="text-2xl font-bold text-success-600 mt-1">₹{parseFloat(activeTotals.total_paid).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Payment history logged</span>
        </Card>
        <Card className="hover-card border-l-4 border-l-warning-500 bg-amber-50/5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Ledger Balance</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">₹{parseFloat(activeTotals.total_outstanding).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Unpaid travel ledger total</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Comparison */}
        <Card header="Department Wise Travel Metrics">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {departmentBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No department logs recorded.</p>
            ) : (
              departmentBreakdown.map((d, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{d.department_name}</span>
                      <span className="text-slate-400 ml-1 font-mono">({d.department_code})</span>
                    </div>
                    <span className="font-bold text-slate-700">₹{parseFloat(d.total_cost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${(parseFloat(d.total_cost) / maxDeptCost) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-20 text-right font-medium">{d.total_trips} trips ({parseFloat(d.total_distance).toFixed(0)} km)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Travel spenders (Employees) */}
        <Card header="Top Employee Travel Ledgers">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {topEmployees.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No employee metrics recorded.</p>
            ) : (
              topEmployees.map((e, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{e.full_name}</span>
                      <span className="text-slate-400 ml-1.5 font-mono">({e.employee_number})</span>
                    </div>
                    <span className="font-bold text-slate-700">₹{parseFloat(e.total_cost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${(parseFloat(e.total_cost) / maxEmpCost) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-24 text-right font-medium">Bal: ₹{parseFloat(e.outstanding_balance).toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Vehicle Usage Breakdown */}
        <Card header="Vehicle Wise Run & Cost Stats">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {vehicleBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No vehicle usage logged.</p>
            ) : (
              vehicleBreakdown.map((v, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{v.registration_no}</span>
                      <span className="text-slate-400 ml-1.5 font-mono">({v.make} {v.model})</span>
                    </div>
                    <span className="font-bold text-slate-700">₹{parseFloat(v.total_cost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                        style={{ width: `${(parseFloat(v.total_cost) / maxVehCost) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-20 text-right font-medium">{v.total_trips} trips ({parseFloat(v.total_distance).toFixed(0)} km)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card header="Monthly Distance & Spend Trends">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {monthlyBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No monthly trends recorded.</p>
            ) : (
              monthlyBreakdown.map((m, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary-500" /> {m.month}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total run: {parseFloat(m.total_distance).toFixed(0)} KM</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">₹{parseFloat(m.total_cost).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Monthly billings</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
