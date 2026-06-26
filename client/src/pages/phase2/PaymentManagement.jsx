import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { 
  Users, CreditCard, IndianRupee, Search, RefreshCw, 
  Plus, History, ShieldAlert, CheckCircle2, Calendar, 
  Wallet, DollarSign 
} from 'lucide-react';

export default function PaymentManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'payment' or 'history'
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form States
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/phase2/balances');
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch employee balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const openPaymentModal = (emp) => {
    setSelectedEmp(emp);
    setAmountPaid('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setReceiptNumber('');
    setRemarks('');
    setActiveModal('payment');
  };

  const openHistoryModal = async (emp) => {
    setSelectedEmp(emp);
    setActiveModal('history');
    try {
      setLoadingHistory(true);
      const res = await api.get(`/phase2/payments/${emp.id}`);
      setPaymentHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeModals = () => {
    setActiveModal(null);
    setSelectedEmp(null);
    setPaymentHistory([]);
    setError('');
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!amountPaid || isNaN(amountPaid) || parseFloat(amountPaid) <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }
    if (!receiptNumber) {
      setError('Please provide a Receipt/Reference number.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/phase2/payments', {
        employee_id: selectedEmp.id,
        payment_date: paymentDate,
        amount_paid: parseFloat(amountPaid),
        payment_mode: paymentMode,
        receipt_number: receiptNumber,
        remarks: remarks
      });
      setSuccess(`Payment of ₹${amountPaid} for ${selectedEmp.full_name} logged successfully!`);
      setTimeout(() => setSuccess(''), 4000);
      closeModals();
      fetchBalances();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_number.toLowerCase().includes(search.toLowerCase()) ||
    (e.department_name && e.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  // Totals calculations
  const totalOutstanding = employees.reduce((sum, e) => sum + parseFloat(e.outstanding_balance || 0), 0);
  const totalReceived = employees.reduce((sum, e) => sum + parseFloat(e.total_paid || 0), 0);
  const totalBilled = employees.reduce((sum, e) => sum + parseFloat(e.total_cost || 0), 0);

  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner className="w-10 h-10 text-primary-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading Employee Ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary-600" />
            Travel Payment Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Log and audit employee payments to settle their travel ledger accounts</p>
        </div>
        <Button variant="secondary" onClick={fetchBalances} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Reload Data
        </Button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-card border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Billed Spend</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalBilled.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Accumulated travel invoices</span>
        </Card>

        <Card className="hover-card border-l-4 border-l-success-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Payments Settled</p>
          <p className="text-2xl font-bold text-success-600 mt-1">₹{totalReceived.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Accumulated cash/digital receipts</span>
        </Card>

        <Card className="hover-card border-l-4 border-l-warning-500 bg-amber-50/5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding Balance</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block font-medium">Dues pending reconciliation</span>
        </Card>
      </div>

      {/* Employee List */}
      <Card 
        header={
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
            <span>Employee Ledger Summaries</span>
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name, emp no, dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
              />
            </div>
          </div>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-right">Trips Logged</th>
                <th className="px-6 py-3 text-right">Distance (KM)</th>
                <th className="px-6 py-3 text-right">Total Cost (₹)</th>
                <th className="px-6 py-3 text-right">Paid (₹)</th>
                <th className="px-6 py-3 text-right">Outstanding (₹)</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    No employees found matching filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{emp.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{emp.employee_number}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{emp.department_name || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium">{emp.total_trips}</td>
                    <td className="px-6 py-4 text-right font-medium">{parseFloat(emp.total_distance).toFixed(1)} km</td>
                    <td className="px-6 py-4 text-right font-semibold">₹ {parseFloat(emp.total_cost).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-semibold">₹ {parseFloat(emp.total_paid).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${parseFloat(emp.outstanding_balance) > 0 ? 'text-warning-600' : 'text-slate-800'}`}>
                        ₹ {parseFloat(emp.outstanding_balance).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => openHistoryModal(emp)}
                          className="py-1 px-2 text-xs flex items-center gap-1 hover:bg-slate-100"
                        >
                          <History className="w-3.5 h-3.5" /> History
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => openPaymentModal(emp)}
                          className="py-1 px-2.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Log Payment
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RECORD PAYMENT MODAL */}
      {activeModal === 'payment' && selectedEmp && (
        <Modal isOpen={true} onClose={closeModals} title="Record Employee Payment">
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-danger-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border border-slate-100 space-y-1">
              <p><span className="font-semibold text-slate-700">Employee:</span> {selectedEmp.full_name} ({selectedEmp.employee_number})</p>
              <p><span className="font-semibold text-slate-700">Outstanding Balance:</span> <span className="font-bold text-warning-600">₹{parseFloat(selectedEmp.outstanding_balance).toFixed(2)}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid (₹) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="e.g. 500.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date *</label>
                <input 
                  type="date" 
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                >
                  <option value="UPI">UPI / Digital</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Bank Transfer">Bank NetBanking</option>
                  <option value="Salary Deduction">Salary Deduction</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Receipt / Ref Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ref ID / Receipt #"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
              <textarea 
                placeholder="Log transaction details..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 h-20 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={closeModals} disabled={submitting}>Cancel</Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Log Payment Now'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW PAYMENT HISTORY MODAL */}
      {activeModal === 'history' && selectedEmp && (
        <Modal isOpen={true} onClose={closeModals} title={`Payment History - ${selectedEmp.full_name}`}>
          {loadingHistory ? (
            <div className="p-10 flex flex-col items-center justify-center">
              <Spinner className="w-8 h-8 text-primary-600" />
              <p className="text-xs text-slate-500 mt-2">Loading transactions...</p>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-1">
              <Wallet className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No payments recorded yet.</p>
              <p className="text-xs">Ledger payments will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {paymentHistory.map((pm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> ₹ {parseFloat(pm.amount_paid).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Ref: <span className="font-semibold">{pm.receipt_number}</span> | Mode: {pm.payment_mode}</p>
                    {pm.remarks && <p className="text-[10px] text-slate-400 mt-1 italic">"{pm.remarks}"</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-600">{new Date(pm.payment_date).toLocaleDateString()}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Recorded by: {pm.recorder_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
            <Button variant="secondary" onClick={closeModals}>Close Window</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
