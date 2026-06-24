import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, Search, CheckCircle, Upload } from 'lucide-react';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState({ open: false, employee: null });
  const [form, setForm] = useState({ employee_number: '', email: '', password: '', full_name: '', role: 'Employee', department_id: '', phone: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/admin/employees'),
        api.get('/admin/departments'),
      ]);
      setEmployees(empRes.data.employees);
      setDepartments(deptRes.data.departments);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setForm({ employee_number: '', email: '', password: '', full_name: '', role: 'Employee', department_id: '', phone: '' });
    setEditModal({ open: true, employee: null });
  }

  function openEdit(emp) {
    setForm({
      employee_number: emp.employee_number || '',
      email: emp.email,
      password: '', // Leave blank when editing unless changing
      full_name: emp.full_name,
      role: emp.role,
      department_id: emp.department_id || '',
      phone: emp.phone || '',
    });
    setEditModal({ open: true, employee: emp });
  }

  async function handleSave() {
    setProcessing(true);
    try {
      if (editModal.employee) {
        await api.put(`/admin/employees/${editModal.employee.id}`, form);
      } else {
        await api.post('/admin/employees', form);
      }
      setEditModal({ open: false, employee: null });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
    finally { setProcessing(false); }
  }

  async function handleToggleStatus(emp) {
    const action = emp.is_active ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} ${emp.full_name}?`)) return;
    try {
      if (emp.is_active) {
        await api.delete(`/admin/employees/${emp.id}`);
      } else {
        await api.put(`/admin/employees/${emp.id}`, { is_active: 1 });
      }
      fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  }

  async function handleImportCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      setLoading(true);
      try {
        const res = await api.post('/admin/employees/import', { csvData: text });
        let report = `CSV import completed:\n- Inserted: ${res.data.inserted}\n- Skipped: ${res.data.skippedCount}`;
        if (res.data.skipped && res.data.skipped.length > 0) {
          report += `\n\nSkipped details:\n` + res.data.skipped.map(s => `- ${s.email || s.employee_number || 'Row'}: ${s.reason}`).join('\n');
        }
        alert(report);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to import CSV.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  }

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = {
    Employee: 'bg-primary-50 text-primary-700',
    HOD:      'bg-warning-50 text-warning-600',
    'GM-HR':  'bg-indigo-50 text-indigo-700',
    COO:      'bg-success-50 text-success-700',
    Garage:   'bg-info-50 text-primary-700',
    Admin:    'bg-danger-50 text-danger-700',
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-sm text-muted mt-1">{employees.length} employees registered</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" /> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Employee</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
        />
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Emp No.</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Department</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                        {emp.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{emp.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 font-medium">{emp.employee_number}</td>
                  <td className="px-6 py-3.5 text-slate-600">{emp.email}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[emp.role]}`}>{emp.role}</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{emp.department_name || '—'}</td>
                  <td className="px-6 py-3.5 text-slate-600">{emp.phone || '—'}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs font-medium ${emp.is_active ? 'text-success-600' : 'text-danger-600'}`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {emp.is_active ? (
                        <button onClick={() => handleToggleStatus(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50" title="Deactivate">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleToggleStatus(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-success-600 hover:bg-success-50" title="Activate">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, employee: null })}
        title={editModal.employee ? 'Edit Employee' : 'Add Employee'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emp-name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input id="emp-name" type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label htmlFor="emp-no" className="block text-sm font-medium text-slate-700 mb-1">Employee Number</label>
              <input id="emp-no" type="text" value={form.employee_number} onChange={e => setForm(f => ({ ...f, employee_number: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
            </div>
          </div>
          {!editModal.employee && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="emp-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input id="emp-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label htmlFor="emp-pass" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input id="emp-pass" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
              </div>
            </div>
          )}
          {editModal.employee && (
            <div>
              <label htmlFor="emp-pass" className="block text-sm font-medium text-slate-700 mb-1">Password (Leave blank to keep current)</label>
              <input id="emp-pass" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" placeholder="••••••••" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emp-role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select id="emp-role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                {['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="emp-dept" className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select id="emp-dept" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                <option value="">— None —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="emp-phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input id="emp-phone" type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditModal({ open: false, employee: null })}>Cancel</Button>
            <Button loading={processing} onClick={handleSave}>
              {editModal.employee ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
