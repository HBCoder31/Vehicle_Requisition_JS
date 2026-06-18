import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { ArrowLeft, Clock, FileText, CheckCircle, XCircle, Edit, MessageSquare, MapPin, Users, Calendar, Truck, Trash2 } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [reqRes, histRes] = await Promise.all([
          api.get(`/requests/${id}`),
          api.get(`/requests/${id}/history`)
        ]);
        setRequest(reqRes.data.request);
        setHistory(histRes.data.data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch request details.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    setShowConfirm(false);
    setDeleting(true);
    try {
      await api.patch(`/requests/${id}/delete`);
      alert('Request deleted successfully.');
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!request) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Request #{request.id}</h1>
          <p className="text-sm text-slate-500">Submitted by {request.requester_name} ({request.department_name})</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {request.status === 'Pending_HOD' && user?.id === request.employee_id && (
            <>
              <button 
                onClick={() => navigate(`/requests/edit/${request.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit Details
              </button>
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger-700 bg-white border border-danger-300 rounded-lg hover:bg-danger-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete Request
              </button>
            </>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card header="Journey Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pickup</p>
                    <p className="text-sm font-medium text-slate-900">{request.pickup_location}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-danger-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Destination</p>
                    <p className="text-sm font-medium text-slate-900">{request.destination}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Travel Date & Time</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(request.travel_date).toLocaleDateString()} at {request.travel_time}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Passengers</p>
                    <p className="text-sm font-medium text-slate-900">{request.passengers}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Category</p>
                    <p className="text-sm font-medium text-slate-900">
                      {request.work_type === 'Personal' ? 'Personal Work' : "Company's Work"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Purpose</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {request.purpose}
              </p>
            </div>
            
            {request.attachment_url && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Attachments</p>
                <a href={request.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  View Document
                </a>
              </div>
            )}
          </Card>

          {request.assigned_vehicle_id && (
            <Card header="Assigned Vehicle & Driver">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Vehicle</p>
                  <p className="text-sm font-bold text-slate-900">{request.registration_no}</p>
                  <p className="text-xs text-slate-600">{request.vehicle_make} {request.vehicle_model}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Driver</p>
                  <p className="text-sm font-medium text-slate-900">{request.assigned_driver || 'Not specified'}</p>
                  {request.driver_phone && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Phone: <a href={`tel:${request.driver_phone}`} className="text-primary-600 hover:underline">{request.driver_phone}</a>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Timeline */}
        <div className="lg:col-span-1">
          <Card header="Activity Timeline" className="h-full">
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 mt-2">
              {history.map((item, idx) => {
                let Icon = Clock;
                let colorClass = 'text-slate-500 bg-slate-100';
                
                const actionStr = item.action_type || item.status_to || '';

                if (actionStr.includes('Approve')) {
                  Icon = CheckCircle;
                  colorClass = 'text-success-600 bg-success-100';
                } else if (actionStr.includes('Reject')) {
                  Icon = XCircle;
                  colorClass = 'text-danger-600 bg-danger-100';
                } else if (actionStr.includes('Assign') || actionStr.includes('Transit')) {
                  Icon = Truck;
                  colorClass = 'text-primary-600 bg-primary-100';
                } else if (actionStr === 'Created' || actionStr.includes('Pending')) {
                  Icon = FileText;
                  colorClass = 'text-info-600 bg-info-100';
                }

                return (
                  <div key={item.id} className="relative pl-6">
                    <span className={`absolute -left-3.5 top-1 p-1.5 rounded-full ring-4 ring-white ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="bg-white">
                      <p className="text-sm font-medium text-slate-900">
                        {actionStr.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500 mb-2">
                        by <span className="font-semibold">{item.actor_name}</span> ({item.actor_role}) <br/>
                        {new Date(item.changed_at).toLocaleString()}
                      </p>
                      {item.comments && (
                        <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded text-sm text-slate-700 border border-slate-100 mt-1">
                          <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <p>{item.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Deletion</h3>
            <p className="text-slate-600 mb-6">ARE YOU SURE YOU WANT TO DELETE request {id}</p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                No
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-lg transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
