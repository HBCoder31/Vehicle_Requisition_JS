import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { CheckCircle, XCircle, MapPin, Building2, ExternalLink, History, Ticket, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseDate } from '../../utils/date';
import TravelTicketsTab from '../phase2/TravelTicketsTab';

export default function CooDashboard() {
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadStart = useRef(Date.now());
  const [actionModal, setActionModal] = useState({ open: false, request: null, action: '' });
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'tickets'

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    loadStart.current = Date.now();
    try {
      const [reqRes, myReqRes, histRes] = await Promise.all([
        api.get('/approvals/coo'),
        api.get('/requests/my'),
        api.get('/approvals/coo/history'),
      ]);
      setRequests(reqRes.data.requests);
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
      await api.patch(`/approvals/coo/${actionModal.request.id}`, {
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

  if (loading) return <DashboardSkeleton cards={3} rows={4} cols={5} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">COO Dashboard</h1>
          <p className="text-sm text-muted mt-1">Approve travel requests or book a vehicle</p>
        </div>
        <Link
          to="/coo/new-request"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors shadow-sm"
        >
          <MapPin className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover-card animate-fade-in-up delay-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50">
              <MapPin className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{requests.length}</p>
              <p className="text-xs text-muted">Pending Beyond-Travel Approvals</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-50">
              <Clock className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{myRequests.filter(r => r.status === 'Expired').length}</p>
              <p className="text-xs text-muted">My Expired Requests</p>
            </div>
          </div>
        </Card>
        <Card className="hover-card animate-fade-in-up delay-3">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50">
              <Ticket className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{myRequests.length}</p>
              <p className="text-xs text-muted">My Total Requests</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card header="Pending COO Approvals" noPadding>
        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-12 h-12 text-success-200 mx-auto mb-3" />
            <p className="text-sm text-muted">No pending COO approvals. All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Destination</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Requested On</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">HOD</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">#{req.id}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-800">{req.requester_name}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <Building2 className="w-3 h-3" /> {req.department_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{req.destination}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${req.work_type === 'Personal' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {req.work_type === 'Personal' ? 'Personal' : 'Company'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.created_at)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-slate-600">{parseDate(req.travel_date)?.toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-xs text-success-600">✓ {req.hod_name || 'Approved'}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/requests/${req.id}`} className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded-md transition-colors" title="View Details">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Button size="sm" variant="success" onClick={() => setActionModal({ open: true, request: req, action: 'approve' })}>
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setActionModal({ open: true, request: req, action: 'reject' })}>
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
              <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
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
                    <td className="px-6 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.status.includes('Approved') ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-700'}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
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
                      <td className="px-6 py-3.5 font-medium text-slate-800">{req.requester_name}</td>
                      <td className="px-6 py-3.5 text-slate-700">{req.destination}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${req.work_type === 'Personal' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {req.work_type === 'Personal' ? 'Personal' : 'Company'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{parseDate(req.coo_action_at)?.toLocaleDateString()}</td>
                      <td className="px-6 py-3.5 text-slate-600 italic truncate max-w-xs">{req.coo_remarks || '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.status.includes('Approved') ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-700'}`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </td>
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
                <Link to="/coo/history" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
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
          <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
            <p><span className="font-medium">Requester:</span> {actionModal.request?.requester_name}</p>
            <p><span className="font-medium">Department:</span> {actionModal.request?.department_name}</p>
            <p><span className="font-medium">Destination:</span> {actionModal.request?.destination}</p>
            <p><span className="font-medium">Purpose:</span> {actionModal.request?.purpose}</p>
          </div>
          <div>
            <label htmlFor="coo-remarks" className="block text-sm font-medium text-slate-700 mb-1">Remarks (optional)</label>
            <textarea
              id="coo-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setActionModal({ open: false, request: null, action: '' }); setRemarks(''); }}>Cancel</Button>
            <Button variant={actionModal.action === 'approve' ? 'success' : 'danger'} loading={processing} onClick={handleAction}>
              {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
