import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { parseDate } from '../../utils/date';
import { 
  Plane, Train, Bus, Ticket, ExternalLink, Calendar, Search, 
  MapPin, HelpCircle, AlertCircle, Clock, CheckCircle 
} from 'lucide-react';

export default function TravelTicketsTab({ requests }) {
  const [modeFilter, setModeFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // 1. Filter only outstation requests that request tickets
  const ticketRequests = (requests || []).filter(req => req.want_ticket === 1);

  // 2. Apply filters
  const filteredTickets = ticketRequests.filter(req => {
    // Mode filter
    const matchesMode = modeFilter === 'All' || req.mode_of_transport === modeFilter;
    
    // Date filter
    let matchesDate = true;
    if (req.travel_date) {
      const travelDateStr = req.travel_date; // YYYY-MM-DD
      if (fromDate && travelDateStr < fromDate) matchesDate = false;
      if (toDate && travelDateStr > toDate) matchesDate = false;
    }
    
    return matchesMode && matchesDate;
  });

  // Helpers
  const getModeIcon = (mode) => {
    switch (mode) {
      case 'Flight': return <Plane className="w-4 h-4 text-sky-600" />;
      case 'Train': return <Train className="w-4 h-4 text-emerald-600" />;
      case 'Bus': return <Bus className="w-4 h-4 text-amber-600" />;
      default: return <Ticket className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-success-50 text-success-700 border-success-200';
      case 'Clarification_Required':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Booked': return 'Booked';
      case 'Clarification_Required': return 'Clarification Required';
      default: return 'Pending Booking';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-50 p-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Transport Mode filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mode of Transport</label>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-border">
              {['All', 'Flight', 'Train', 'Bus'].map(m => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    modeFilter === m 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-lg text-xs bg-white outline-none w-full"
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-lg text-xs bg-white outline-none w-full"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-xs text-primary-600 hover:underline mt-5 self-center whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-border rounded-xl">
          <Ticket className="w-12 h-12 mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-semibold">No travel tickets found.</p>
          <p className="text-xs text-muted mt-1">Make sure you have requested tickets on your outstation requisitions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map(req => (
            <Card key={req.id} className="hover-card border-l-4 border-l-indigo-500 overflow-hidden relative">
              <div className="flex justify-between items-start gap-4">
                {/* Left block: route & details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Request #{req.id}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(req.ticket_status)}`}>
                      {getStatusLabel(req.ticket_status)}
                    </span>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Destination: {req.destination}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Date: {req.travel_date} | Time: {req.travel_time}
                    </p>
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-600 mt-2">
                      {getModeIcon(req.mode_of_transport)}
                      <span className="font-medium text-[11px] uppercase tracking-wider">
                        {req.mode_of_transport} Booking ({req.ticket_from || '—'} ➔ {req.ticket_to || '—'})
                      </span>
                    </div>
                  </div>

                  {/* Booking Output Details */}
                  {req.ticket_status === 'Booked' && (
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                      <p><span className="font-semibold text-slate-600">Carrier / Operator:</span> {req.carrier_name || 'N/A'}</p>
                      <div className="flex items-center gap-2">
                        <p><span className="font-semibold text-slate-600">PNR:</span> <code className="font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{req.pnr}</code></p>
                        {req.seat_no && <p><span className="font-semibold text-slate-600">Seat:</span> <span className="font-medium">{req.seat_no}</span></p>}
                      </div>
                      {req.travel_admin_remarks && (
                        <p className="text-[11px] text-slate-500 italic">Note: {req.travel_admin_remarks}</p>
                      )}
                    </div>
                  )}

                  {/* Clarification Output Details */}
                  {req.ticket_status === 'Clarification_Required' && req.travel_admin_remarks && (
                    <div className="p-2.5 bg-red-50/50 border border-red-100 rounded-lg text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Clarification Needed:</span>
                        <p className="italic mt-0.5">{req.travel_admin_remarks}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right block: Action links */}
                <div className="flex flex-col gap-2 items-end">
                  <Link
                    to={`/requests/${req.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="View Request Details"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </Link>

                  {req.ticket_status === 'Booked' && req.ticket_file_url && (
                    <a
                      href={req.ticket_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
                    >
                      Ticket PDF
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
