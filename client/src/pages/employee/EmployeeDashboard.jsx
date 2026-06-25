import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { FileText, Plus, Clock, CheckCircle, XCircle, ExternalLink, Trash2 } from 'lucide-react';
import { parseDate } from '../../utils/date';

export default function EmployeeDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const loadStart = useRef(Date.now());

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    loadStart.current = Date.now();
    try {
      const { data } = await api.get('/requests/my');
      setRequests(data.requests);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status.includes('Pending')).length,
    approved: requests.filter(r => r.status.includes('Approved') || r.status === 'Vehicle_Assigned' || r.status === 'In_Transit' || r.status === 'Completed').length,
    rejected: requests.filter(r => r.status.includes('Rejected')).length,
    deleted: requests.filter(r => r.status === 'Deleted').length,
  };

  if (loading) return <DashboardSkeleton cards={5} rows={5} cols={6} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
          <p className="text-sm text-muted mt-1">Submit and track your vehicle requests</p>
        </div>
        <Link
          to="/employee/new-request"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Requests', value: stats.total, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-50', delay: 'delay-1' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50', delay: 'delay-2' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-50', delay: 'delay-3' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-danger-600', bg: 'bg-danger-50', delay: 'delay-4' },
          { label: 'Deleted', value: stats.deleted, icon: Trash2, color: 'text-slate-600', bg: 'bg-slate-50', delay: 'delay-5' },
        ].map(({ label, value, icon: Icon, color, bg, delay }) => {
          const isPendingGlow = label === 'Pending' && value > 0;
          return (
            <Card key={label} className={`hover-card animate-fade-in-up ${delay} ${isPendingGlow ? 'border-beam' : ''}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Requests Table */}
      <Card header="Recent Requests" noPadding>
        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No requests yet. Create your first vehicle request!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested On</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Travel Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.slice(0, 10).map((req, i) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{req.id}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">{req.destination}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${req.work_type === 'Personal' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {req.work_type === 'Personal' ? 'Personal' : 'Company'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.created_at)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.travel_date)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${req.travel_type.includes('Beyond') ? 'bg-warning-50 text-warning-600' : 'bg-primary-50 text-primary-600'}`}>
                        {req.travel_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-3.5 text-slate-600 text-xs max-w-[200px] whitespace-normal break-words">
                      {[req.hod_remarks && `HOD: ${req.hod_remarks}`, req.coo_remarks && `COO: ${req.coo_remarks}`].filter(Boolean).join(' | ') || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{req.registration_no || '—'}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link to={`/requests/${req.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                          View <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {req.status === 'Pending_HOD' && (
                          <button 
                            onClick={() => setRequestToDelete(req.id)}
                            className="inline-flex items-center gap-1 text-danger-600 hover:text-danger-700 font-medium"
                          >
                            Delete <XCircle className="w-3.5 h-3.5" />
                          </button>
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

      {requestToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h3>
            <p className="text-slate-600 mb-6">ARE YOU SURE YOU WANT TO DELETE request {requestToDelete}</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                No
              </button>
              <button 
                onClick={() => {
                  api.patch(`/requests/${requestToDelete}/delete`)
                    .then(() => {
                      alert('Request deleted successfully.');
                      setRequestToDelete(null);
                      fetchRequests();
                    })
                    .catch(err => alert(err.response?.data?.error || 'Failed to delete request.'));
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-lg transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
