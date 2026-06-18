import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { Download, TrendingUp, Users, Car, MapPin, Fuel, Wrench } from 'lucide-react';
// Recharts and others disabled. Using native HTML/CSS charts instead.

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AdminAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data } = await api.get('/analytics/metrics');
      setMetrics(data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Fleet Analytics Report", 14, 15);
      
      doc.autoTable({
        startY: 25,
        head: [['Metric', 'Value']],
        body: [
          ['Total Requests', metrics.summary.requests.total],
          ['Approved Requests', metrics.summary.requests.approved],
          ['Active Fleet', metrics.summary.vehicles],
          ['Active Drivers', metrics.summary.drivers],
          ['Total Fuel Cost', `Rs ${metrics.financial.fuel.total_fuel_cost}`],
          ['Total Maintenance Cost', `Rs ${metrics.financial.maintenance.total_maintenance_cost}`]
        ]
      });
      
      doc.save("fleet-analytics.pdf");
    } catch (err) {
      alert('Failed to generate PDF. Make sure CDNs are loaded.');
      console.error(err);
    }
  };

  const exportExcel = () => {
    try {
      const XLSX = window.XLSX;
      const ws = XLSX.utils.json_to_sheet([
        { Metric: 'Total Requests', Value: metrics.summary.requests.total },
        { Metric: 'Approved Requests', Value: metrics.summary.requests.approved },
        { Metric: 'Active Fleet', Value: metrics.summary.vehicles },
        { Metric: 'Active Drivers', Value: metrics.summary.drivers },
        { Metric: 'Total Fuel Cost', Value: metrics.financial.fuel.total_fuel_cost },
        { Metric: 'Total Maintenance Cost', Value: metrics.financial.maintenance.total_maintenance_cost }
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Analytics");
      XLSX.writeFile(wb, "fleet-analytics.xlsx");
    } catch (err) {
      alert('Failed to generate Excel. Make sure CDNs are loaded.');
      console.error(err);
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!metrics) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Analytics</h1>
          <p className="text-sm text-muted mt-1">High-level overview of fleet operations and usage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`${api.defaults.baseURL}/analytics/export`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <Button variant="secondary" onClick={exportPDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="secondary" onClick={exportExcel}><Download className="w-4 h-4 mr-2" /> Excel</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-muted font-medium uppercase">Total Requests</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{metrics.summary.requests.total}</p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-success-600 font-medium">{metrics.summary.requests.approved} Approved</span>
            <span className="text-danger-600 font-medium">{metrics.summary.requests.rejected} Rejected</span>
          </div>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted font-medium uppercase">Active Fleet</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{metrics.summary.vehicles}</p>
          <p className="text-xs text-muted mt-2">{metrics.summary.drivers} Active Drivers</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted font-medium uppercase">Fuel Cost</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">₹{Number(metrics.financial.fuel.total_fuel_cost).toLocaleString()}</p>
          <p className="text-xs text-muted mt-2">{Number(metrics.financial.fuel.total_liters).toLocaleString()} Liters Consumed</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-muted font-medium uppercase">Maintenance Cost</p>
          <p className="text-3xl font-bold text-warning-600 mt-2">₹{Number(metrics.financial.maintenance.total_maintenance_cost).toLocaleString()}</p>
          <p className="text-xs text-muted mt-2">Lifetime maintenance</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Requests Trend */}
        <Card header="Monthly Requests Trend">
          <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '8px 8px 0 8px' }}>
            {metrics.monthlyTrend?.length > 0 ? metrics.monthlyTrend.map((m, i) => {
              const max = Math.max(...metrics.monthlyTrend.map(x => x.count)) || 1;
              const barH = Math.max(Math.round((m.count / max) * 180), 20);
              const label = m.month ? m.month.slice(0, 7) : '';
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9' }}>{m.count}</span>
                  <div
                    style={{ width: '100%', height: barH, background: 'linear-gradient(to top, #0ea5e9, #38bdf8)', borderRadius: '4px 4px 0 0' }}
                    title={`${label}: ${m.count} requests`}
                  />
                  <span style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>{label}</span>
                </div>
              );
            }) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>No data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Department Usage */}
        <Card header="Department Usage">
          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metrics.departmentUsage?.filter(d => d.request_count > 0).length > 0
              ? metrics.departmentUsage.filter(d => d.request_count > 0).map((d, i) => {
                  const max = Math.max(...metrics.departmentUsage.map(x => x.request_count)) || 1;
                  const pct = Math.max(Math.round((d.request_count / max) * 100), 4);
                  const colors = ['#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6'];
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{d.department}</span>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{d.request_count} requests</span>
                      </div>
                      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 999, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })
              : <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No data available</p>
            }
          </div>
        </Card>

        {/* Top Vehicle Utilization */}
        <Card header="Top Vehicle Utilization (Trips)" className="lg:col-span-2">
          <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '8px 8px 0 8px', overflowX: 'auto' }}>
            {metrics.vehicleUtilization?.filter(v => v.trips_completed > 0).length > 0
              ? metrics.vehicleUtilization.filter(v => v.trips_completed > 0).map((v, i) => {
                  const max = Math.max(...metrics.vehicleUtilization.map(x => x.trips_completed)) || 1;
                  const barH = Math.max(Math.round((v.trips_completed / max) * 180), 20);
                  return (
                    <div key={i} style={{ minWidth: 64, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{v.trips_completed}</span>
                      <div
                        style={{ width: '100%', height: barH, background: 'linear-gradient(to top, #10b981, #34d399)', borderRadius: '4px 4px 0 0' }}
                        title={`${v.registration_no}: ${v.trips_completed} trips`}
                      />
                      <span style={{ fontSize: 10, color: '#64748b', textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.registration_no}>
                        {v.registration_no}
                      </span>
                    </div>
                  );
                })
              : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>No completed trips yet</p>
                </div>
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
