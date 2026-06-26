import { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { 
  History, ScrollText, Download, TrendingUp, IndianRupee, Compass, 
  MapPin, Calendar, Clock, Gauge, CreditCard, Receipt 
} from 'lucide-react';

export default function TravelHistory() {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billLoadingId, setBillLoadingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/phase2/travel-history');
      setHistory(res.data.data.history || []);
      setSummary(res.data.data.summary || null);
    } catch (err) {
      console.error('Failed to fetch travel history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadBill = async (tripLogId) => {
    try {
      setBillLoadingId(tripLogId);
      
      // 1. Fetch details
      const res = await api.get(`/phase2/bill/${tripLogId}`);
      const trip = res.data.data;
      if (!trip) {
        alert('Could not retrieve billing details.');
        return;
      }

      // Generate a unique bill number
      const dateCode = new Date(trip.exit_time).getFullYear().toString().slice(-2) + 
                       String(new Date(trip.exit_time).getMonth() + 1).padStart(2, '0');
      const billNumber = `OPL/VRP/${dateCode}/${trip.id}`;

      // 2. Log generation
      await api.post('/phase2/bill/log', {
        trip_log_id: trip.id,
        bill_number: billNumber
      });

      // 3. Generate PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Premium Styling
      // Theme colors: Navy #0F172A, Teal #0F766E, Gold/Brown #B45309
      
      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark Navy
      doc.rect(0, 0, 210, 38, 'F');

      // Company Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("ORIENT PAPER MILLS", 14, 18);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("A Subsidiary of CK Birla Group | Brajrajnagar, Odisha, India", 14, 24);
      doc.text("Phone: +91 6645 222116 | Email: logistics@orientpaperindia.com", 14, 29);

      // Invoice Label (Right side)
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 184, 166); // Teal color
      doc.text("TRIP INVOICE", 150, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Receipt #: ${billNumber}`, 150, 24);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 150, 29);

      // Reset text color to dark slate
      doc.setTextColor(51, 65, 85);
      
      // Invoice Details Block
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("EMPLOYEE DETAILS", 14, 50);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 52, 95, 52); // line separator
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Name: ${trip.requester_name}`, 14, 58);
      doc.text(`Emp No: ${trip.employee_number}`, 14, 63);
      doc.text(`Department: ${trip.department_name} (${trip.department_code})`, 14, 68);
      doc.text(`Email: ${trip.requester_email}`, 14, 73);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("VEHICLE & DRIVER", 115, 50);
      doc.line(115, 52, 196, 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Registration: ${trip.registration_no}`, 115, 58);
      doc.text(`Vehicle Type: ${trip.vehicle_type}`, 115, 63);
      doc.text(`Make/Model: ${trip.make} ${trip.model}`, 115, 68);
      doc.text(`Driver Name: ${trip.driver_name || 'Self Driven'}`, 115, 73);

      // Travel Details Block
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("TRIP ROUTE & TIMINGS", 14, 88);
      doc.line(14, 90, 196, 90);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`Pickup Point: ${trip.pickup_location || 'Company Premises'}`, 14, 96);
      doc.text(`Destination: ${trip.destination}`, 14, 101);
      doc.text(`Departure Time: ${new Date(trip.exit_time).toLocaleString('en-IN')}`, 14, 106);
      doc.text(`Return Time: ${new Date(trip.entry_time).toLocaleString('en-IN')}`, 14, 111);

      // Charge Details (AutoTable)
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("BILLING BREAKDOWN", 14, 126);
      
      const body = [
        ["Odometer Out", `${trip.odometer_out} KM`],
        ["Odometer In", `${trip.odometer_in} KM`],
        ["Distance Travelled", `${trip.distance_travelled} KM`],
        ["Vehicle Rate (per KM)", `Rs. ${parseFloat(trip.cost_per_km).toFixed(2)}`],
        ["Subtotal Travel Charges", `Rs. ${parseFloat(trip.travel_cost).toFixed(2)}`]
      ];

      doc.autoTable({
        startY: 129,
        head: [['Item Description', 'Details / Cost']],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 9.5 }
      });

      // Total Dues / Ledger Summary
      const finalY = doc.previousAutoTable.finalY + 10;
      doc.setFillColor(248, 250, 252);
      doc.rect(14, finalY, 182, 25, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, finalY, 182, 25, 'D');

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL AMOUNT INVOICED:", 20, finalY + 10);
      doc.text(`Rs. ${parseFloat(trip.travel_cost).toFixed(2)}`, 85, finalY + 10);

      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.text(`Current Employee Outstanding Ledger Balance: Rs. ${parseFloat(trip.outstanding_balance || 0).toFixed(2)}`, 20, finalY + 18);

      // Bottom Signature Section
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text("Prepared By: Logistics Desk", 14, finalY + 45);
      doc.text("Approved By: Gate Security Manager", 130, finalY + 45);
      doc.setDrawColor(180, 180, 180);
      doc.line(14, finalY + 41, 70, finalY + 41);
      doc.line(130, finalY + 41, 186, finalY + 41);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("This is a computer-generated invoice and requires no physical signature.", 55, finalY + 65);

      // Save
      doc.save(`Trip-Bill-${trip.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate trip PDF receipt.');
    } finally {
      setBillLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner className="w-10 h-10 text-primary-600" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading Travel History & Dues...</p>
      </div>
    );
  }

  // Set default values if summary is missing
  const activeSummary = summary || {
    total_trips: 0,
    total_distance: 0,
    total_cost: 0,
    total_paid: 0,
    outstanding_balance: 0
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <History className="w-7 h-7 text-primary-600" />
          My Travel Ledger & Billing
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your trip logs, billing statements, and outstanding ledger balance</p>
      </div>

      {/* Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card className="bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Trips</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{activeSummary.total_trips} trips</p>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Dispatched trips
          </div>
        </Card>

        <Card className="bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance Travelled</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{parseFloat(activeSummary.total_distance).toFixed(1)} KM</p>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Cumulative distance
          </div>
        </Card>

        <Card className="bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accumulated Cost</p>
          <p className="text-xl font-bold text-slate-800 mt-1">₹{parseFloat(activeSummary.total_cost).toLocaleString('en-IN')}</p>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5" /> Total billed amount
          </div>
        </Card>

        <Card className="bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Paid</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">₹{parseFloat(activeSummary.total_paid).toLocaleString('en-IN')}</p>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Cleared travel dues
          </div>
        </Card>

        <Card className={`border-l-4 ${parseFloat(activeSummary.outstanding_balance) > 0 ? 'border-l-warning-500 bg-amber-50/10' : 'border-l-success-500 bg-emerald-50/10'}`}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
          <p className={`text-xl font-bold mt-1 ${parseFloat(activeSummary.outstanding_balance) > 0 ? 'text-warning-600' : 'text-success-700'}`}>
            ₹{parseFloat(activeSummary.outstanding_balance).toLocaleString('en-IN')}
          </p>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" /> Remaining balance
          </div>
        </Card>

      </div>

      {/* Travel History Table */}
      <Card header="Detailed Trip Logs & Billing Statements" noPadding>
        {history.length === 0 ? (
          <div className="p-10 text-center">
            <ScrollText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No completed travel logs found in your account.</p>
            <p className="text-xs text-slate-400 mt-0.5">Approved dispatches will build your ledger once completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
                  <th className="px-6 py-3">Route Details</th>
                  <th className="px-6 py-3">Timing</th>
                  <th className="px-6 py-3">Vehicle / Driver</th>
                  <th className="px-6 py-3 text-right">Running KM</th>
                  <th className="px-6 py-3 text-right">Cost (₹)</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {history.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary-500" /> {trip.destination}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 ml-4.5">From: {trip.pickup_location || 'Premises'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {trip.travel_date}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-300" /> {trip.travel_time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold">{trip.registration_no}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{trip.driver_name || 'Self Driven'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trip.distance_travelled !== null ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold">{trip.distance_travelled} km</span>
                          <span className="text-[10px] text-slate-400 block">{trip.odometer_out} → {trip.odometer_in}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending gate in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trip.travel_cost !== null ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">₹{parseFloat(trip.travel_cost).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 block">₹{parseFloat(trip.cost_per_km).toFixed(1)}/km</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={trip.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trip.status === 'Vehicle Returned' ? (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleDownloadBill(trip.id)}
                          disabled={billLoadingId === trip.id}
                          className="font-semibold text-xs py-1 px-2.5 flex items-center gap-1 mx-auto hover:bg-slate-100"
                        >
                          {billLoadingId === trip.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" /> Bill
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
