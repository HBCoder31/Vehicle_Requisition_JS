import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { ScrollText, ChevronLeft, ChevronRight, Printer, Download } from 'lucide-react';
import socket from '../../services/socket';

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr);
  // If it's already an ISO string with timezone, parse it directly
  if (str.endsWith('Z') || str.includes('+') || str.includes('-')) {
    return new Date(str);
  }
  // If it's a MySQL datetime string 'YYYY-MM-DD HH:mm:ss', treat it as UTC!
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
    const isoStr = str.replace(' ', 'T') + (str.endsWith('Z') ? '' : 'Z');
    return new Date(isoStr);
  }
  return new Date(str);
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', entity_type: '' });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [empNumber, setEmpNumber] = useState('');
  const [debouncedEmpNumber, setDebouncedEmpNumber] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [printLogs, setPrintLogs] = useState([]);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce employee number input to avoid excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmpNumber(empNumber);
    }, 400);
    return () => clearTimeout(timer);
  }, [empNumber]);

  useEffect(() => { fetchLogs(1); }, [filter, fromDate, toDate, debouncedEmpNumber, sortOrder]);

  useEffect(() => {
    function handleNewAuditLog(newLog) {
      // Check if filters match
      if (filter.action && newLog.action !== filter.action) return;
      if (filter.entity_type && newLog.entity_type !== filter.entity_type) return;
      if (debouncedEmpNumber && (!newLog.actor_employee_number || !newLog.actor_employee_number.toLowerCase().includes(debouncedEmpNumber.toLowerCase()))) return;
      
      // Check date range if specified
      if (fromDate || toDate) {
        const logDateStr = newLog.created_at.split(' ')[0]; // YYYY-MM-DD
        if (fromDate && logDateStr < fromDate) return;
        if (toDate && logDateStr > toDate) return;
      }

      setLogs((prev) => {
        if (prev.some(log => log.id === newLog.id)) return prev;
        const updated = [newLog, ...prev];
        if (updated.length > 20) {
          updated.pop();
        }
        return updated;
      });
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
        pages: Math.ceil((prev.total + 1) / 20)
      }));
    }

    socket.on('audit_log', handleNewAuditLog);
    return () => {
      socket.off('audit_log');
    };
  }, [filter, fromDate, toDate, debouncedEmpNumber]);

  async function fetchLogs(page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter.action) params.set('action', filter.action);
      if (filter.entity_type) params.set('entity_type', filter.entity_type);
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      if (debouncedEmpNumber) params.set('employee_number', debouncedEmpNumber);
      params.set('sort_order', sortOrder);

      const { data } = await api.get(`/admin/audit-logs?${params}`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handlePrint() {
    if (pagination.total <= logs.length) {
      setPrintLogs(logs);
      setTimeout(() => {
        window.print();
      }, 100);
      return;
    }

    setIsPreparingPrint(true);
    try {
      const params = new URLSearchParams();
      if (filter.action) params.set('action', filter.action);
      if (filter.entity_type) params.set('entity_type', filter.entity_type);
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      if (debouncedEmpNumber) params.set('employee_number', debouncedEmpNumber);
      params.set('sort_order', sortOrder);
      params.set('page', 1);
      params.set('limit', 10000); // Fetch up to 10k logs for printing

      const { data } = await api.get(`/admin/audit-logs?${params}`);
      setPrintLogs(data.logs);
      
      setTimeout(() => {
        window.print();
        setIsPreparingPrint(false);
      }, 150);
    } catch (err) {
      console.error('Failed to fetch logs for printing:', err);
      setIsPreparingPrint(false);
    }
  }

  async function handleExport() {
    let logsToExport = logs;
    
    if (pagination.total > logs.length) {
      setIsExporting(true);
      try {
        const params = new URLSearchParams();
        if (filter.action) params.set('action', filter.action);
        if (filter.entity_type) params.set('entity_type', filter.entity_type);
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);
        if (debouncedEmpNumber) params.set('employee_number', debouncedEmpNumber);
        params.set('sort_order', sortOrder);
        params.set('page', 1);
        params.set('limit', 10000); // Fetch up to 10k logs for exporting

        const { data } = await api.get(`/admin/audit-logs?${params}`);
        logsToExport = data.logs;
      } catch (err) {
        console.error('Failed to fetch logs for export:', err);
        setIsExporting(false);
        return;
      }
      setIsExporting(false);
    }

    if (logsToExport.length === 0) return;

    const escape = (val) => {
      if (val == null) return '';
      const str = String(val);
      return (str.includes(',') || str.includes('"') || str.includes('\n'))
        ? '"' + str.replace(/"/g, '""') + '"'
        : str;
    };

    const headers = [
      'Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'
    ];

    const rows = logsToExport.map(log => {
      let detailsStr = '—';
      if (log.details) {
        try {
          detailsStr = typeof log.details === 'string'
            ? JSON.stringify(JSON.parse(log.details))
            : JSON.stringify(log.details);
        } catch (e) {
          detailsStr = String(log.details);
        }
      }

      return [
        parseUTCDate(log.created_at).toLocaleString(),
        log.actor_name ? `${log.actor_name}${log.actor_employee_number ? ` (${log.actor_employee_number})` : ''}` : '—',
        log.action,
        log.entity_type,
        log.entity_id,
        detailsStr,
        log.ip_address || '—'
      ].map(escape);
    });

    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Printable Report Header */}
      <div className="print-header">
        <h1 className="text-xl font-bold">System Activity Audit Logs Report</h1>
        <p className="text-sm">Generated by: Administrator</p>
        <p className="text-xs text-slate-500">
          Generated on: {new Date().toLocaleString('en-IN')} 
          {filter.action ? ` | Action: ${filter.action}` : ''}
          {filter.entity_type ? ` | Entity: ${filter.entity_type}` : ''}
          {fromDate ? ` | From: ${fromDate}` : ''}
          {toDate ? ` | To: ${toDate}` : ''}
          {debouncedEmpNumber ? ` | Employee: ${debouncedEmpNumber}` : ''}
        </p>
      </div>

      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-sm text-muted mt-1">Complete activity history across the portal</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handlePrint}
            disabled={isPreparingPrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            {isPreparingPrint ? 'Preparing Report...' : 'Print Logs'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || logs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center no-print">
        <select
          value={filter.action}
          onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
        >
          <option value="">All Actions</option>
          {['CREATE_REQUEST', 'CANCEL_REQUEST', 'HOD_APPROVE', 'HOD_REJECT', 'COO_APPROVE', 'COO_REJECT',
            'ASSIGN_VEHICLE', 'REASSIGN_VEHICLE', 'RECORD_PICKUP', 'RECORD_DROPOFF', 'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE', 'DEACTIVATE_EMPLOYEE']
            .map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={filter.entity_type}
          onChange={e => setFilter(f => ({ ...f, entity_type: e.target.value }))}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
        >
          <option value="">All Entities</option>
          <option value="vehicle_request">Vehicle Request</option>
          <option value="employee">Employee</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Employee No:</span>
          <input
            type="text"
            placeholder="e.g. EMP001"
            value={empNumber}
            onChange={e => setEmpNumber(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none w-32"
          />
        </div>
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none"
        >
          <option value="desc">Newest First (Descending)</option>
          <option value="asc">Oldest First (Ascending)</option>
        </select>
      </div>

      <Card noPadding className="no-print">
        {loading ? <Spinner className="py-10" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Entity</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Details</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">{parseUTCDate(log.created_at)?.toLocaleString()}</td>
                      <td className="px-6 py-3 text-slate-700">
                        {log.actor_name || '—'}
                        {log.actor_employee_number ? ` (${log.actor_employee_number})` : ''}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono text-slate-600">{log.action}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                      <td className="px-6 py-3 text-xs text-slate-500 max-w-48 truncate">
                        {log.details ? JSON.stringify(typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400 font-mono">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-slate-50/50 no-print">
              <span className="text-xs text-muted">
                Showing {(pagination.page - 1) * 20 + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-600 px-2">{pagination.page} / {pagination.pages}</span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Print-only container containing all fetched logs */}
      <div className="print-only">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Entity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Details</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(printLogs.length > 0 ? printLogs : logs).map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">{parseUTCDate(log.created_at)?.toLocaleString()}</td>
                  <td className="px-6 py-3 text-slate-700">
                    {log.actor_name || '—'}
                    {log.actor_employee_number ? ` (${log.actor_employee_number})` : ''}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-mono text-slate-600">{log.action}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                  <td className="px-6 py-3 text-xs text-slate-500 max-w-48 truncate">
                    {log.details ? JSON.stringify(typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : '—'}
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-400 font-mono">{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
