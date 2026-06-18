import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { Users, Truck, FileText, Activity, TrendingUp, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!data) return <p className="text-center text-muted py-20">Failed to load dashboard data.</p>;

  const totalRequests = data.requestsByStatus.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-muted mt-1">System overview and monitoring</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-card animate-fade-in-up delay-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50"><FileText className="w-6 h-6 text-primary-600" /></div>
            <div><p className="text-2xl font-bold">{totalRequests}</p><p className="text-xs text-muted">Total Requests</p></div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success-50"><Users className="w-6 h-6 text-success-600" /></div>
            <div><p className="text-2xl font-bold">{data.employees.active}</p><p className="text-xs text-muted">Active Employees</p></div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning-50"><Truck className="w-6 h-6 text-warning-600" /></div>
            <div><p className="text-2xl font-bold">{data.vehicles.available}/{data.vehicles.total}</p><p className="text-xs text-muted">Vehicles Available</p></div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-info-50"><TrendingUp className="w-6 h-6 text-primary-600" /></div>
            <div><p className="text-2xl font-bold">{data.vehicles.in_use}</p><p className="text-xs text-muted">Vehicles In Use</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Status */}
        <Card header="Requests by Status">
          <div className="space-y-3">
            {data.requestsByStatus.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-sm font-semibold text-slate-700">{count}</span>
              </div>
            ))}
            {data.requestsByStatus.length === 0 && (
              <p className="text-sm text-muted text-center py-4">No requests yet.</p>
            )}
          </div>
        </Card>

        {/* Department Breakdown */}
        <Card header="Requests by Department">
          <div className="space-y-3">
            {data.departmentBreakdown.map(({ name, request_count }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted" />
                  <span className="text-sm text-slate-700">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${totalRequests ? (request_count / totalRequests * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-8 text-right">{request_count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card header="Recent Activity" noPadding>
        <div className="divide-y divide-border">
          {data.recentActivity.map(log => (
            <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-muted shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{log.actor_name || 'System'}</span>
                    {' — '}
                    <span className="text-slate-500">{log.action.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-xs text-muted">{log.entity_type} #{log.entity_id}</p>
                </div>
              </div>
              <span className="text-xs text-muted shrink-0">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
          {data.recentActivity.length === 0 && (
            <p className="text-sm text-muted text-center py-6">No activity yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
