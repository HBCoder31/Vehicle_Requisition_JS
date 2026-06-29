import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { Plus, Edit2, Trash2, Search, CheckCircle, Upload, Download, Printer, Info, X } from 'lucide-react';

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState({ open: false, employee: null });
  const [form, setForm] = useState({ employee_number: '', email: '', password: '', full_name: '', role: 'Employee', department_id: '', phone: '' });
  const [processing, setProcessing] = useState(false);
  const [formatModalOpen, setFormatModalOpen] = useState(false);
  // Popover: only used for editing (not creating)
  const [popover, setPopover] = useState({ open: false, x: 0, y: 0 });
  const popoverRef = useRef(null);
  const anchorRef = useRef(null);

  const updatePopoverPosition = useCallback(() => {
    if (!anchorRef.current) return;
    const isMobile = window.innerWidth < 640;
    let x = 0;
    let y = 0;

    if (isMobile) {
      // Center on screen on mobile layout
      const popoverWidth = Math.min(420, window.innerWidth * 0.92);
      x = (window.innerWidth - popoverWidth) / 2;
      y = (window.innerHeight - 450) / 2;
      if (y < 12) y = 12;
    } else {
      const rect = anchorRef.current.getBoundingClientRect();
      const popoverWidth = 420;
      const gap = 8;
      
      // Place to the left of the button; flip right if near left edge
      x = rect.left - popoverWidth - gap;
      if (x < 12) x = rect.right + gap;
      y = rect.top - 8;
      
      // Prevent going below viewport
      const estimatedHeight = 480;
      if (y + estimatedHeight > window.innerHeight - 12) {
        y = window.innerHeight - estimatedHeight - 12;
      }
      if (y < 12) y = 12;
    }
    
    setPopover(prev => {
      if (prev.x === x && prev.y === y) return prev;
      return { ...prev, x, y };
    });
  }, []);

  useEffect(() => {
    if (!popover.open) return;

    const handleScroll = () => {
      updatePopoverPosition();
    };

    const scrollContainer = document.getElementById('page-content');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('resize', handleScroll);

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleScroll);
    };
  }, [popover.open, updatePopoverPosition]);

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

  function openEdit(emp, btnEl) {
    setForm({
      employee_number: emp.employee_number || '',
      email: emp.email,
      password: '',
      full_name: emp.full_name,
      role: emp.role,
      department_id: emp.department_id || '',
      phone: emp.phone || '',
    });
    setEditModal({ open: false, employee: emp });
    
    if (btnEl) {
      anchorRef.current = btnEl;
      const isMobile = window.innerWidth < 640;
      let x = 0;
      let y = 0;
      
      if (isMobile) {
        const popoverWidth = Math.min(420, window.innerWidth * 0.92);
        x = (window.innerWidth - popoverWidth) / 2;
        y = (window.innerHeight - 450) / 2;
        if (y < 12) y = 12;
      } else {
        const rect = btnEl.getBoundingClientRect();
        const popoverWidth = 420;
        const gap = 8;
        
        x = rect.left - popoverWidth - gap;
        if (x < 12) x = rect.right + gap;
        y = rect.top - 8;
        
        const estimatedHeight = 480;
        if (y + estimatedHeight > window.innerHeight - 12) {
          y = window.innerHeight - estimatedHeight - 12;
        }
        if (y < 12) y = 12;
      }
      setPopover({ open: true, x, y });
    }
  }

  function closePopover() {
    anchorRef.current = null;
    setPopover({ open: false, x: 0, y: 0 });
    setEditModal({ open: false, employee: null });
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
      setPopover({ open: false, x: 0, y: 0 });
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

  function handleDownloadTemplate() {
    const headers = 'employee_number,email,password,full_name,role,department,phone\n';
    const sampleRow1 = 'EMP1001,john.doe@example.com,pass1234,John Doe,Employee,IT,9876543210\n';
    const sampleRow2 = 'EMP1002,jane.smith@example.com,,Jane Smith,HOD,HR,\n';
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + sampleRow1 + sampleRow2);
    
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrintFormat() {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this website.');
      return;
    }
    
    const deptList = departments.map(d => `${d.name} (${d.code})`).join(', ') || 'None registered yet';

    printWindow.document.write(`
      <html>
        <head>
          <title>CSV Format Guidelines - Vehicle Requisitional and Travel Portal</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #334155;
              line-height: 1.5;
              padding: 40px;
              margin: 0;
            }
            h1 {
              font-size: 24px;
              color: #0f172a;
              margin-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
            }
            p {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .badge-required {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .badge-optional {
              background-color: #f1f5f9;
              color: #334155;
            }
            h3 {
              font-size: 16px;
              color: #1e293b;
              margin-top: 24px;
              margin-bottom: 8px;
            }
            ul {
              padding-left: 20px;
              margin-bottom: 24px;
            }
            li {
              font-size: 13px;
              color: #475569;
              margin-bottom: 6px;
            }
            .no-print-btn {
              background-color: #3b82f6;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
              margin-bottom: 20px;
            }
            .no-print-btn:hover {
              background-color: #2563eb;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;">
            <button class="no-print-btn" onclick="window.print()">Print Document</button>
          </div>
          <h1>CSV Employee Import Format Guide</h1>
          <p>Please structure your CSV columns exactly as specified below. The CSV importer is flexible and recognizes various header aliases.</p>
          
          <table>
            <thead>
              <tr>
                <th>Recommended Header</th>
                <th>Required</th>
                <th>Recognized Aliases</th>
                <th>Rules & Guidelines</th>
                <th>Sample Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>employee_number</strong></td>
                <td><span class="badge badge-required">Yes</span></td>
                <td>emp_no, employee number, employeenumber</td>
                <td>Unique employee code to identify the user.</td>
                <td>EMP1001</td>
              </tr>
              <tr>
                <td><strong>email</strong></td>
                <td><span class="badge badge-required">Yes</span></td>
                <td>mail</td>
                <td>Unique, valid email address used for login.</td>
                <td>john.doe@example.com</td>
              </tr>
              <tr>
                <td><strong>full_name</strong></td>
                <td><span class="badge badge-required">Yes</span></td>
                <td>name, full name, fullname</td>
                <td>Display name of the employee.</td>
                <td>John Doe</td>
              </tr>
              <tr>
                <td><strong>password</strong></td>
                <td><span class="badge badge-optional">No</span></td>
                <td>—</td>
                <td>User's password. Defaults to <strong>password123</strong> if omitted.</td>
                <td>pass1234</td>
              </tr>
              <tr>
                <td><strong>role</strong></td>
                <td><span class="badge badge-optional">No</span></td>
                <td>—</td>
                <td>Must match one of: Employee, HOD, GM-HR, COO, Garage, Admin, Security. Defaults to <strong>Employee</strong>.</td>
                <td>Employee</td>
              </tr>
              <tr>
                <td><strong>department</strong></td>
                <td><span class="badge badge-optional">No</span></td>
                <td>department_code, dept, department_id</td>
                <td>Matches name or code of any system department.</td>
                <td>IT</td>
              </tr>
              <tr>
                <td><strong>phone</strong></td>
                <td><span class="badge badge-optional">No</span></td>
                <td>phone_number, mobile, phone number</td>
                <td>Optional contact number.</td>
                <td>9876543210</td>
              </tr>
            </tbody>
          </table>

          <h3>System Validation Rules:</h3>
          <ul>
            <li><strong>Unique Constraints:</strong> Rows containing duplicate email addresses or employee numbers will be automatically skipped to prevent data corruption.</li>
            <li><strong>Valid Roles:</strong> Acceptable roles are: <code>Employee</code>, <code>HOD</code>, <code>GM-HR</code>, <code>COO</code>, <code>Garage</code>, <code>Admin</code>, <code>Security</code>. If a role is incorrect or misspelled, the row is skipped.</li>
            <li><strong>Active Departments:</strong> Currently configured departments in the portal are: <strong>${deptList}</strong>. You can use either the full department name or the department code.</li>
          </ul>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
    Security: 'bg-slate-100 text-slate-700',
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
          <button
            onClick={() => setFormatModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
            title="View CSV Import Format Guide"
          >
            <Info className="w-4 h-4 text-slate-500" /> CSV Format
          </button>
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
                      <button onClick={(e) => openEdit(emp, e.currentTarget)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50" title="Edit">
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

      {/* Add Employee Modal (centered, for creating new) */}
      <Modal
        isOpen={editModal.open && !editModal.employee}
        onClose={() => setEditModal({ open: false, employee: null })}
        title="Add Employee"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emp-role" className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select id="emp-role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                {['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin', 'Security', 'Travel Admin'].map(r => <option key={r} value={r}>{r}</option>)}
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
            <Button loading={processing} onClick={handleSave}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Popover — rendered via Portal so fixed coords always match viewport */}
      {popover.open && createPortal(
        <>
          {/* Invisible backdrop to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={closePopover} />
          {/* Popover card */}
          <div
            ref={popoverRef}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 w-[92vw] sm:w-[420px] animate-modal-spring"
            style={{ top: popover.y, left: popover.x }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {editModal.employee?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{editModal.employee?.full_name}</p>
                  <p className="text-[10px] text-slate-400">{editModal.employee?.employee_number}</p>
                </div>
              </div>
              <button onClick={closePopover} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Form body */}
            <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Employee No.</label>
                  <input type="text" value={form.employee_number} onChange={e => setForm(f => ({ ...f, employee_number: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">New Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" placeholder="Leave blank to keep" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                    {['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin', 'Security', 'Travel Admin'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                  <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none">
                    <option value="">— None —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="secondary" onClick={closePopover}>Cancel</Button>
              <Button loading={processing} onClick={handleSave}>Update</Button>
            </div>
          </div>
        </>
      , document.body)}

      {/* CSV Format Guidelines Modal */}
      <Modal
        isOpen={formatModalOpen}
        onClose={() => setFormatModalOpen(false)}
        title="CSV Import Format & Guidelines"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            To import employees in bulk, upload a CSV file matching the structure below. Column headers are case-insensitive and support multiple common aliases.
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-3 py-2 border-r border-slate-200">Header</th>
                  <th className="px-3 py-2 border-r border-slate-200 text-center">Required</th>
                  <th className="px-3 py-2 border-r border-slate-200">Recognized Aliases</th>
                  <th className="px-3 py-2">Rules & Defaults</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">employee_number</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-semibold uppercase border border-red-100">Yes</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">emp_no, employee number, employeenumber</td>
                  <td className="px-3 py-2">Unique employee code.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">email</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-semibold uppercase border border-red-100">Yes</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">mail</td>
                  <td className="px-3 py-2">Unique valid email address.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">full_name</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-semibold uppercase border border-red-100">Yes</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">name, full name, fullname</td>
                  <td className="px-3 py-2">Display name.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">password</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase border border-slate-200">No</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">—</td>
                  <td className="px-3 py-2">Defaults to <code className="bg-slate-50 px-1 py-0.5 rounded border border-slate-200 text-slate-800">password123</code>.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">role</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase border border-slate-200">No</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">—</td>
                  <td className="px-3 py-2">Employee, HOD, GM-HR, COO, Garage, Admin, Security, Travel Admin. Defaults to <code className="bg-slate-50 px-1 py-0.5 rounded border border-slate-200 text-slate-800">Employee</code>.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">department</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase border border-slate-200">No</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">department_code, dept, department_id</td>
                  <td className="px-3 py-2">Name or Code (e.g. IT, HR, Finance).</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800">phone</td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase border border-slate-200">No</span>
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-slate-500">phone_number, mobile, phone number</td>
                  <td className="px-3 py-2">Optional phone number.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-150 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Info className="w-4 h-4 text-blue-500" /> Validation & Import Rules:
            </span>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Duplicate employee numbers or emails will be skipped.</li>
              <li>Roles must match system design (e.g. GM-HR, COO).</li>
              <li>Currently active departments: <span className="font-medium">{departments.map(d => `${d.name} (${d.code})`).join(', ') || 'None'}</span></li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={handlePrintFormat}
              className="inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Format Guide
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Template
              </Button>
              <Button onClick={() => setFormatModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
