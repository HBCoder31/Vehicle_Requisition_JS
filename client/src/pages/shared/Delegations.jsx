import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { Users, XCircle } from 'lucide-react';
import { parseDate } from '../../utils/date';

export default function Delegations() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ delegatee_id: '', start_date: '', end_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedApprovals, setSelectedApprovals] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [delRes, usersRes] = await Promise.all([
        api.get('/delegations'),
        api.get('/delegations/eligible-users')
      ]);
      setDelegations(delRes.data.delegations || []);
      setEligibleUsers(usersRes.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/delegations', form);
      setForm({ delegatee_id: '', start_date: '', end_date: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create delegation');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Are you sure you want to cancel this delegation?')) return;
    try {
      await api.patch(`/delegations/${id}/cancel`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel');
    }
  }

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Delegation Management</h1>
        <p className="text-sm text-muted mt-1">Delegate your approval authority to another employee while you are away.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="md:col-span-1">
          <Card title="New Delegation">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delegate To</label>
                <select 
                  required
                  value={form.delegatee_id}
                  onChange={e => setForm({...form, delegatee_id: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
                >
                  <option value="">-- Select Employee --</option>
                  {eligibleUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input 
                  type="date" required
                  value={form.start_date}
                  onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input 
                  type="date" required
                  value={form.end_date}
                  onChange={e => setForm({...form, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
                />
              </div>

              <Button type="submit" className="w-full" loading={submitting}>
                Create Delegation
              </Button>
            </form>
          </Card>
        </div>

        {/* History / Active */}
        <div className="md:col-span-2">
          <Card title="Active & Past Delegations" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Delegator</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Delegatee</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Period</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Approvals Done</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {delegations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No delegations found.
                      </td>
                    </tr>
                  ) : delegations.map(del => {
                    const isActive = del.is_active === 1 && parseDate(del.end_date) >= new Date(new Date().setHours(0,0,0,0));
                    const isOwner = del.delegator_id === user.id;

                    return (
                      <tr key={del.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-medium text-slate-800">
                          {isOwner ? 'You' : del.delegator_name}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {del.delegatee_id === user.id ? 'You' : del.delegatee_name}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {parseDate(del.start_date)?.toLocaleDateString()} - {parseDate(del.end_date)?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {del.approvals && del.approvals.length > 0 ? (
                            <button
                              onClick={() => setSelectedApprovals(del)}
                              className="px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-xs font-semibold hover:bg-primary-100 transition-colors inline-flex items-center gap-1"
                            >
                              <span>{del.approvals.length} {del.approvals.length === 1 ? 'Approval' : 'Approvals'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-normal">None</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-600'}`}>
                            {isActive ? 'Active' : 'Inactive/Expired'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {isActive && isOwner && (
                            <button onClick={() => handleCancel(del.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors" title="Cancel Delegation">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {selectedApprovals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-slide-up max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Approvals Done</h3>
                <p className="text-xs text-slate-500 mt-1">
                  By {selectedApprovals.delegatee_name} on behalf of {selectedApprovals.delegator_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedApprovals(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
              >
                <XCircle className="w-5.5 h-5.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {selectedApprovals.approvals.map(app => (
                <div key={app.request_id} className="p-3 border border-border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Request #{app.request_id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Destination: {app.destination}</p>
                      <p className="text-xs text-slate-500">Requested By: {app.requester_name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      app.action_type.includes('Approved') 
                        ? 'bg-success-100 text-success-700' 
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {app.action_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    {parseDate(app.changed_at)?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-border flex justify-end">
              <Button onClick={() => setSelectedApprovals(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
