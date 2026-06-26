import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { 
  ScrollText, IndianRupee, ShieldAlert, CheckCircle2, 
  Settings, PenSquare, RefreshCw, HelpCircle, Truck 
} from 'lucide-react';

export default function BillingManagement() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingRow, setEditingRow] = useState(null); // Vehicle type name
  const [editValue, setEditValue] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/phase2/rates');
      setRates(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch billing rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleStartEdit = (row) => {
    setEditingRow(row.vehicle_type);
    setEditValue(row.cost_per_km);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditValue('');
    setError('');
  };

  const handleSaveRate = async (vehicleType) => {
    if (!editValue || isNaN(editValue) || parseFloat(editValue) < 0) {
      setError('Please enter a valid rate per KM.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/phase2/rates', {
        vehicle_type: vehicleType,
        cost_per_km: parseFloat(editValue)
      });
      setSuccess(`Rate for ${vehicleType} updated successfully!`);
      setTimeout(() => setSuccess(''), 4000);
      setEditingRow(null);
      fetchRates();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update rate.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && rates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner className="w-10 h-10 text-primary-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading Billing Configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ScrollText className="w-7 h-7 text-primary-600" />
          Billing & Cost Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure distance-based travel rates per KM for different vehicle categories</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-xl flex items-center gap-2 animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-danger-600 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rates Table (Left 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <Card 
            header={
              <div className="flex justify-between items-center w-full">
                <span>Vehicle Type Travel Rates</span>
                <Button variant="secondary" size="sm" onClick={fetchRates} className="flex items-center gap-1.5 text-xs py-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
              </div>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="px-6 py-3">Vehicle Type</th>
                    <th className="px-6 py-3 text-right">Cost Per KM (₹)</th>
                    <th className="px-6 py-3">Last Updated By</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {rates.map((row) => (
                    <tr key={row.vehicle_type} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        {row.vehicle_type}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingRow === row.vehicle_type ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400">₹</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 text-right text-sm border border-slate-300 rounded p-1 outline-none focus:border-primary-500"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-800">₹ {parseFloat(row.cost_per_km).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {row.updater_name ? (
                          <div>
                            <p className="font-semibold text-slate-700">{row.updater_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">On {new Date(row.updated_at).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Default Seed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingRow === row.vehicle_type ? (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={handleCancelEdit}
                              disabled={submitting}
                              className="py-1 px-2.5 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveRate(row.vehicle_type)}
                              disabled={submitting}
                              className="py-1 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              {submitting ? <Spinner size="sm" /> : 'Save'}
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleStartEdit(row)}
                            className="py-1 px-2.5 text-xs text-primary-600 flex items-center gap-1 ml-auto"
                          >
                            <PenSquare className="w-3.5 h-3.5" /> Edit Rate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Explain Logic Sidebar (Right 1/3) */}
        <div className="space-y-6">
          <Card header="How Travel Billing Works">
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">1. Gate Logs</p>
                  <p className="mt-0.5">When a vehicle exits, gate security logs the departure odometer. When it returns, the incoming odometer is recorded.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">2. Cost Calculation</p>
                  <p className="mt-0.5">The system computes distance: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[10px]">Distance = Odo_In - Odo_Out</code>. This is multiplied by the vehicle category rate per KM defined here.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-teal-50 rounded-lg text-teal-600 shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">3. Employee Ledger</p>
                  <p className="mt-0.5">Calculated cost is automatically added to the employee's travel summary dues, and they can download PDF receipts from their panel.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-primary-900 to-indigo-950 text-white border-none">
            <h4 className="font-bold text-base">Cost-Distance Formula</h4>
            <div className="bg-white/10 p-3 rounded-lg border border-white/10 mt-3 font-mono text-center text-xs tracking-wide">
              Trip Cost = KM * Rate
            </div>
            <p className="text-[10px] text-primary-200 mt-3">All rate updates are recorded in the system audit logs for administrative compliance.</p>
          </Card>
        </div>

      </div>
    </div>
  );
}
