import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { CheckCircle, XCircle, Clock, FileText, TrendingUp, ExternalLink, History, Trash2, Ticket, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseDate } from '../../utils/date';
import TravelTicketsTab from '../phase2/TravelTicketsTab';

export default function HodDashboard() {
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [actionModal, setActionModal] = useState({ open: false, request: null, action: '' });
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'tickets'

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    loadStart.current = Date.now();
    try {
      const [reqRes, statsRes, myReqRes, histRes] = await Promise.all([
        api.get('/approvals/hod'),
        api.get('/approvals/hod/stats'),
        api.get('/requests/my'),
        api.get('/approvals/hod/history'),
      ]);
      setRequests(reqRes.data.requests);
      setStats(statsRes.data.stats);
      setMyRequests(myReqRes.data.requests);
      setApprovalHistory(histRes.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  }

  async function handleAction() {
    setProcessing(true);
    try {
      await api.patch(`/approvals/hod/${actionModal.request.id}`, {
        action: actionModal.action,
        remarks,
      });
      setActionModal({ open: false, request: null, action: '' });
      setRemarks('');
      fetchData();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.message || errData?.error;
      alert(typeof msg === 'string' ? msg : 'Action failed.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <DashboardSkeleton cards={5} rows={4} cols={5} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HOD Dashboard</h1>
          <p className="text-sm text-muted mt-1">Approve vehicle requests or create your own</p>
        </div>
        <Link
          to="/hod/new-request"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
        >
          <TrendingUp className="w-4 h-4" /> {/* Or Plus icon, but using imported ones */}
          New Request
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50', delay: 'delay-1' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-50', delay: 'delay-2' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-danger-600', bg: 'bg-danger-50', delay: 'delay-3' },
            { label: 'Deleted', value: stats.deleted, icon: Trash2, color: 'text-slate-600', bg: 'bg-slate-50', delay: 'delay-4' },
            { label: 'Expired', value: stats.expired || 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', delay: 'delay-5' },
            { label: 'Total', value: stats.total, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', delay: 'delay-6' },
          ].map(({ label, value, icon: Icon, color, bg, delay }) => {
            const isPendingGlow = label === 'Pending' && value > 0;
            return (
              <Card key={label} className={`hover-card animate-fade-in-up ${delay} ${isPendingGlow ? 'border-beam' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">{value}</p>
                    <p className="text-xs text-muted">{label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pending Requests */}
      <Card header="Pending Approvals" noPadding>
        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-12 h-12 text-success-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No pending requests. All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requested On</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Travel Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Passengers</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{req.id}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800">{req.requester_name}</p>
                      <p className="text-xs text-muted">{req.requester_email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{req.destination}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${req.work_type === 'Personal' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {req.work_type === 'Personal' ? 'Personal' : 'Company'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.created_at)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.travel_date)?.toLocaleDateString()} {req.travel_time}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${req.travel_type.includes('Beyond') ? 'bg-warning-50 text-warning-600' : 'bg-primary-50 text-primary-600'}`}>
                        {req.travel_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{req.passengers}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/requests/${req.id}`} className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded-md transition-colors" title="View Details">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setActionModal({ open: true, request: req, action: 'approve' })}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setActionModal({ open: true, request: req, action: 'reject' })}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
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

      {/* My Recent Requests / Tickets Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2.5 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'requests' ? 'border-primary-600 text-primary-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Vehicle Requests
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-2.5 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'tickets' ? 'border-primary-600 text-primary-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Ticket className="w-4 h-4" />
          My Travel Tickets ({myRequests.filter(r => r.want_ticket === 1).length})
        </button>
      </div>

      {activeTab === 'requests' ? (
        <Card header="My Recent Requests" noPadding>
          {myRequests.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-muted">You haven't made any requests yet.</p>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requested On</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Travel Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myRequests.slice(0, 10).map((req, i) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{req.id}</td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">{req.destination}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${req.work_type === 'Personal' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {req.work_type === 'Personal' ? 'Personal' : 'Company'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.created_at)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.travel_date)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-3.5">
                      <Link to={`/requests/${req.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      ) : (
        <TravelTicketsTab requests={myRequests} />
      )}

      {/* My Recent Approval History Table */}
      <Card header="My Recent Approval Actions" noPadding>
        {approvalHistory.length === 0 ? (
          <div className="p-10 text-center">
            <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted">You haven't approved or rejected any requests yet.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Remarks</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {approvalHistory.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{req.id}</td>
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-slate-800">{req.requester_name}</p>
                        <p className="text-xs text-muted">{req.requester_email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">{req.destination}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${req.work_type === 'Personal' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {req.work_type === 'Personal' ? 'Personal' : 'Company'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{parseDate(req.hod_action_at)?.toLocaleDateString()}</td>
                      <td className="px-6 py-3.5 text-slate-600 italic truncate max-w-xs">{req.hod_remarks || '—'}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={req.status} /></td>
                      <td className="px-6 py-3.5">
                        <Link to={`/requests/${req.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {approvalHistory.length > 5 && (
              <div className="p-3 border-t border-border text-center bg-slate-50/30">
                <Link to="/hod/history" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                  View All Approval History
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => { setActionModal({ open: false, request: null, action: '' }); setRemarks(''); }}
        title={`${actionModal.action === 'approve' ? 'Approve' : 'Reject'} Request #${actionModal.request?.id}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <p><span className="font-medium">Requester:</span> {actionModal.request?.requester_name}</p>
            <p><span className="font-medium">Destination:</span> {actionModal.request?.destination}</p>
            <p><span className="font-medium">Purpose:</span> {actionModal.request?.purpose}</p>
            {actionModal.action === 'approve' && actionModal.request?.travel_type?.includes('Beyond') && (
              <p className="mt-2 text-xs text-warning-600">ℹ This request will be forwarded to COO for additional approval.</p>
            )}
          </div>
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 mb-1">Remarks (optional)</label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              placeholder="Add any notes..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setActionModal({ open: false, request: null, action: '' }); setRemarks(''); }}>
              Cancel
            </Button>
            <Button
              variant={actionModal.action === 'approve' ? 'success' : 'danger'}
              loading={processing}
              onClick={handleAction}
            >
              {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
