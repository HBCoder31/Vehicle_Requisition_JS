import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import DashboardSkeleton from '../../components/ui/DashboardSkeleton';
import { parseDate } from '../../utils/date';
import { 
  Plane, Train, Bus, Search, Filter, ClipboardList, CheckCircle, 
  AlertCircle, History, ExternalLink, Ticket, Upload, Send, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TravelAdminDashboard() {
  const [pending, setPending] = useState([]);
  const [expired, setExpired] = useState([]);
  const [stats, setStats] = useState({
    Flight: { expired: 0, booked: 0, total: 0 },
    Train: { expired: 0, booked: 0, total: 0 },
    Bus: { expired: 0, booked: 0, total: 0 }
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'expired', 'history'
  const [filterMode, setFilterMode] = useState('All'); // 'All', 'Flight', 'Train', 'Bus'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [bookModal, setBookModal] = useState({ open: false, request: null });
  const [clarifyModal, setClarifyModal] = useState({ open: false, request: null });
  
  const [bookingForm, setBookingForm] = useState({
    pnr: '',
    carrier_name: '',
    seat_no: '',
    ticket_file_url: '',
    travel_admin_remarks: ''
  });
  const [clarifyForm, setClarifyForm] = useState({ remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const loadStart = useRef(Date.now());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    loadStart.current = Date.now();
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/travel-admin/pending'),
        api.get('/travel-admin/history')
      ]);
      setPending(pendingRes.data.requests || []);
      setExpired(pendingRes.data.expired || []);
      setStats(pendingRes.data.stats || {
        Flight: { expired: 0, booked: 0, total: 0 },
        Train: { expired: 0, booked: 0, total: 0 },
        Bus: { expired: 0, booked: 0, total: 0 }
      });
      setHistory(historyRes.data.history || []);
    } catch (err) {
      console.error('Failed to fetch travel admin data:', err);
    } finally {
      const elapsed = Date.now() - loadStart.current;
      const remaining = Math.max(0, 1000 - elapsed);
      setTimeout(() => setLoading(false), remaining);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.pnr) return alert('PNR is required.');
    setSubmitting(true);
    try {
      await api.patch(`/travel-admin/book/${bookModal.request.id}`, bookingForm);
      setBookModal({ open: false, request: null });
      setBookingForm({ pnr: '', carrier_name: '', seat_no: '', ticket_file_url: '', travel_admin_remarks: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to book ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClarifySubmit = async (e) => {
    e.preventDefault();
    if (!clarifyForm.remarks) return alert('Clarification remarks are required.');
    setSubmitting(true);
    try {
      await api.patch(`/travel-admin/clarification/${clarifyModal.request.id}`, clarifyForm);
      setClarifyModal({ open: false, request: null });
      setClarifyForm({ remarks: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request clarification.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to render mode icons
  const getModeIcon = (mode) => {
    switch (mode) {
      case 'Flight': return <Plane className="w-4 h-4 text-sky-600" />;
      case 'Train': return <Train className="w-4 h-4 text-emerald-600" />;
      case 'Bus': return <Bus className="w-4 h-4 text-amber-600" />;
      default: return <Ticket className="w-4 h-4 text-slate-600" />;
    }
  };

  // Filter and Search Lists
  const getFilteredList = (list) => {
    return list.filter(req => {
      const matchesMode = filterMode === 'All' || req.mode_of_transport === filterMode;
      const matchesQuery = 
        req.requester_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.employee_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(req.id).includes(searchQuery);
      return matchesMode && matchesQuery;
    });
  };

  const filteredPending = getFilteredList(pending);
  const filteredHistory = getFilteredList(history);
  const filteredExpired = getFilteredList(expired);

  if (loading) return <DashboardSkeleton cards={3} rows={5} cols={6} />;

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-600 mb-1.5';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Travel Desk Dashboard</h1>
          <p className="text-sm text-muted mt-1">Book plane, train, and bus tickets for approved requisitions</p>
        </div>
        <Button onClick={fetchData} variant="secondary" className="w-fit">
          Refresh Data
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Flight Bookings Card */}
        <Card className="hover-card border-l-4 border-sky-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-sky-50"><Plane className="w-5 h-5 text-sky-600" /></div>
            <h3 className="font-bold text-slate-800 text-lg">Flight Bookings</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-slate-800">{stats.Flight.total}</p>
              <p className="text-[10px] text-slate-500 font-medium">Total Bookings</p>
            </div>
            <div className="bg-success-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-success-700">{stats.Flight.booked}</p>
              <p className="text-[10px] text-success-600 font-medium">Booking Done</p>
            </div>
            <div className="bg-rose-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-rose-700">{stats.Flight.expired}</p>
              <p className="text-[10px] text-rose-600 font-medium">Expired Booking</p>
            </div>
          </div>
        </Card>

        {/* Train Bookings Card */}
        <Card className="hover-card border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50"><Train className="w-5 h-5 text-emerald-600" /></div>
            <h3 className="font-bold text-slate-800 text-lg">Train Bookings</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-slate-800">{stats.Train.total}</p>
              <p className="text-[10px] text-slate-500 font-medium">Total Bookings</p>
            </div>
            <div className="bg-success-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-success-700">{stats.Train.booked}</p>
              <p className="text-[10px] text-success-600 font-medium">Booking Done</p>
            </div>
            <div className="bg-rose-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-rose-700">{stats.Train.expired}</p>
              <p className="text-[10px] text-rose-600 font-medium">Expired Booking</p>
            </div>
          </div>
        </Card>

        {/* Bus Bookings Card */}
        <Card className="hover-card border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-amber-50"><Bus className="w-5 h-5 text-amber-600" /></div>
            <h3 className="font-bold text-slate-800 text-lg">Bus Bookings</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-slate-800">{stats.Bus.total}</p>
              <p className="text-[10px] text-slate-500 font-medium">Total Bookings</p>
            </div>
            <div className="bg-success-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-success-700">{stats.Bus.booked}</p>
              <p className="text-[10px] text-success-600 font-medium">Booking Done</p>
            </div>
            <div className="bg-rose-50 p-2 rounded-lg">
              <p className="text-lg font-bold text-rose-700">{stats.Bus.expired}</p>
              <p className="text-[10px] text-rose-600 font-medium">Expired Booking</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center border-b border-border pb-4">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Pending Tickets ({filteredPending.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'expired'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Expired Bookings ({filteredExpired.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            Booking History ({filteredHistory.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by requester, dest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:border-primary-500 outline-none w-full sm:w-60"
            />
          </div>

          {/* Mode Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {['All', 'Flight', 'Train', 'Bus'].map(m => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  filterMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table views */}
      {activeTab === 'pending' && (
        <Card noPadding header="Pending Ticket Bookings">
          {filteredPending.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Ticket className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-semibold">No pending bookings match filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Request</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Travel Details</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Booking Required</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Ticket Status</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPending.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/25">
                      <td className="px-6 py-4">
                        <Link to={`/requests/${req.id}`} className="font-bold text-primary-600 hover:underline">
                          #{req.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{req.requester_name}</div>
                        <div className="text-xs text-slate-400 font-bold">{req.employee_number}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <p className="font-semibold">Dest: {req.destination}</p>
                        <p className="text-xs text-slate-500">Date: {req.travel_date} | {req.travel_time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          {getModeIcon(req.mode_of_transport)}
                          {req.mode_of_transport}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          From: <span className="font-semibold">{req.ticket_from || '—'}</span> To: <span className="font-semibold">{req.ticket_to || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${
                          req.ticket_status === 'Clarification_Required' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {req.ticket_status === 'Clarification_Required' ? 'Clarification Needed' : 'Pending Booking'}
                        </span>
                        {req.travel_admin_remarks && req.ticket_status === 'Clarification_Required' && (
                          <p className="text-[11px] text-red-600 mt-1 max-w-xs italic">Remarks: {req.travel_admin_remarks}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/requests/${req.id}`} className="text-slate-600 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100" title="View details">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Button size="sm" variant="secondary" onClick={() => setClarifyModal({ open: true, request: req })}>
                            <HelpCircle className="w-3.5 h-3.5" /> Clarify
                          </Button>
                          <Button size="sm" onClick={() => setBookModal({ open: true, request: req })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                            <Ticket className="w-3.5 h-3.5" /> Log Ticket
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
      )}

      {/* Expired Bookings Tab */}
      {activeTab === 'expired' && (
        <Card noPadding header="Expired Ticket Requests">
          {filteredExpired.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-semibold">No expired ticket bookings match filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Request</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Travel Details</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Transport Mode</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpired.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/25">
                      <td className="px-6 py-4">
                        <Link to={`/requests/${req.id}`} className="font-bold text-primary-600 hover:underline">
                          #{req.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{req.requester_name}</div>
                        <div className="text-xs text-slate-400 font-bold">{req.employee_number}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <p className="font-semibold">Dest: {req.destination}</p>
                        <p className="text-xs text-slate-500">Date: {req.travel_date} | {req.travel_time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          {getModeIcon(req.mode_of_transport)}
                          {req.mode_of_transport}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          From: <span className="font-semibold">{req.ticket_from || '—'}</span> To: <span className="font-semibold">{req.ticket_to || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/requests/${req.id}`} className="text-slate-600 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 inline-flex items-center gap-1 font-semibold" title="View details">
                          View <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <Card noPadding header="Completed Booking Logs">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto text-slate-200 mb-3" />
              <p className="text-sm font-semibold">No booking history matches filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Request</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Requester</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Booking Details</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Carrier & PNR</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Booked On</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHistory.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/25">
                      <td className="px-6 py-4">
                        <Link to={`/requests/${req.id}`} className="font-bold text-primary-600 hover:underline">
                          #{req.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{req.requester_name}</td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          {getModeIcon(req.mode_of_transport)} {req.mode_of_transport}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Dest: {req.destination}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">Carrier: {req.carrier_name || 'N/A'}</p>
                        <p className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit mt-0.5">PNR: {req.pnr}</p>
                        {req.seat_no && <p className="text-[11px] text-slate-500 mt-0.5">Seat: {req.seat_no}</p>}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {req.booked_at ? new Date(req.booked_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.ticket_file_url ? (
                          <a 
                            href={req.ticket_file_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View E-Ticket
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No File</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Book Ticket Modal */}
      {bookModal.open && (
        <Modal
          isOpen={bookModal.open}
          onClose={() => setBookModal({ open: false, request: null })}
          title={`Log Ticket Booking — #${bookModal.request?.id}`}
        >
          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <p><span className="font-semibold">Passenger:</span> {bookModal.request?.requester_name}</p>
              <p><span className="font-semibold">Transport Mode:</span> {bookModal.request?.mode_of_transport}</p>
              <p><span className="font-semibold">From-To Route:</span> {bookModal.request?.ticket_from} ➔ {bookModal.request?.ticket_to}</p>
            </div>

            <div>
              <label htmlFor="pnr" className={labelClass}>PNR Number / Booking ID *</label>
              <input
                id="pnr"
                type="text"
                required
                placeholder="Enter 6-char PNR or booking ID..."
                value={bookingForm.pnr}
                onChange={(e) => setBookingForm(f => ({ ...f, pnr: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="carrier" className={labelClass}>Carrier / Operator Name</label>
                <input
                  id="carrier"
                  type="text"
                  placeholder="e.g. IndiGo, Air India..."
                  value={bookingForm.carrier_name}
                  onChange={(e) => setBookingForm(f => ({ ...f, carrier_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="seat" className={labelClass}>Seat / Berth Number</label>
                <input
                  id="seat"
                  type="text"
                  placeholder="e.g. 14A, SL-22..."
                  value={bookingForm.seat_no}
                  onChange={(e) => setBookingForm(f => ({ ...f, seat_no: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ticket-url" className={labelClass}>Ticket URL / Attachment Link</label>
              <input
                id="ticket-url"
                type="url"
                placeholder="https://example.com/tickets/file.pdf"
                value={bookingForm.ticket_file_url}
                onChange={(e) => setBookingForm(f => ({ ...f, ticket_file_url: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="remarks" className={labelClass}>Remarks / Booking Notes</label>
              <textarea
                id="remarks"
                placeholder="Add baggage info or special notes..."
                value={bookingForm.travel_admin_remarks}
                onChange={(e) => setBookingForm(f => ({ ...f, travel_admin_remarks: e.target.value }))}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setBookModal({ open: false, request: null })} disabled={submitting}>Cancel</Button>
              <Button type="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Confirm Booking
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clarification Modal */}
      {clarifyModal.open && (
        <Modal
          isOpen={clarifyModal.open}
          onClose={() => setClarifyModal({ open: false, request: null })}
          title={`Request Ticket Clarification — #${clarifyModal.request?.id}`}
        >
          <form onSubmit={handleClarifySubmit} className="space-y-4">
            <div>
              <label htmlFor="clarification-remarks" className={labelClass}>Specify details needed from Employee *</label>
              <textarea
                id="clarification-remarks"
                required
                placeholder="Describe details needed (e.g. 'Please select standard departure window' or 'Confirm baggage details')..."
                value={clarifyForm.remarks}
                onChange={(e) => setClarifyForm(f => ({ ...f, remarks: e.target.value }))}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setClarifyModal({ open: false, request: null })} disabled={submitting}>Cancel</Button>
              <Button type="submit" loading={submitting} variant="danger">
                Send Query
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
