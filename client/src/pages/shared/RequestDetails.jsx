import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { ArrowLeft, Clock, FileText, CheckCircle, XCircle, Edit, MessageSquare, MapPin, Users, Calendar, Truck, Trash2, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { parseDate } from '../../utils/date';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [feedback, setFeedback] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comments: '' });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [reqRes, histRes] = await Promise.all([
          api.get(`/requests/${id}`),
          api.get(`/requests/${id}/history`)
        ]);
        setRequest(reqRes.data.request);
        setHistory(histRes.data.data);
        
        if (reqRes.data.request.status === 'Completed') {
          try {
            const fbRes = await api.get(`/feedback/${id}/feedback`);
            if (fbRes.data && fbRes.data.data) {
              setFeedback(fbRes.data.data);
            }
          } catch (err) {
            console.error('Failed to fetch feedback:', err);
          }
        }
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

  const handleSubmitFeedback = async () => {
    setSubmittingFeedback(true);
    try {
      await api.post(`/feedback/${id}/feedback`, feedbackForm);
      alert('Feedback submitted successfully!');
      
      const fbRes = await api.get(`/feedback/${id}/feedback`);
      if (fbRes.data && fbRes.data.data) {
        setFeedback(fbRes.data.data);
      }
      
      const histRes = await api.get(`/requests/${id}/history`);
      setHistory(histRes.data.data);
      
      setShowFeedbackModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

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
          {((request.status === 'Pending_HOD') || (request.status === 'Pending_GM_HR' && ['HOD', 'GM-HR'].includes(user?.role))) && user?.id === request.employee_id && (
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
                      {parseDate(request.travel_date)?.toLocaleDateString()} at {request.travel_time}
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

          {feedback && (
            <Card header="Driver Feedback">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= feedback.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">({feedback.rating}/5)</span>
                </div>
                {feedback.comments ? (
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    "{feedback.comments}"
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic">No comments provided.</p>
                )}
                <p className="text-[10px] text-slate-400">
                  Submitted by {feedback.requester_name || 'Requester'} on {parseDate(feedback.created_at)?.toLocaleDateString()}
                </p>
              </div>
            </Card>
          )}

          {!feedback && request.status === 'Completed' && user?.id === request.employee_id && (
            <Card header="Driver Feedback">
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-slate-600">
                  How was your journey? Please rate and share feedback for your driver, {request.assigned_driver}.
                </p>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  <Star className="w-4 h-4 fill-white animate-pulse" /> Submit Feedback
                </button>
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

                if (actionStr.includes('Approved') || actionStr.includes('Approve')) {
                  Icon = CheckCircle;
                  colorClass = 'text-success-600 bg-success-100';
                } else if (actionStr.includes('Rejected') || actionStr.includes('Reject') || actionStr.includes('Deleted')) {
                  Icon = XCircle;
                  colorClass = 'text-danger-600 bg-danger-100';
                } else if (actionStr.includes('Assign') || actionStr.includes('Transit') || actionStr.includes('Pickup')) {
                  Icon = Truck;
                  colorClass = 'text-primary-600 bg-primary-100';
                } else if (actionStr.includes('Completed')) {
                  Icon = CheckCircle;
                  colorClass = 'text-success-600 bg-success-100';
                } else if (actionStr.includes('Feedback')) {
                  Icon = Star;
                  colorClass = 'text-amber-600 bg-amber-100';
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
                        {parseDate(item.changed_at)?.toLocaleString()}
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

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Driver Feedback</h3>
            <p className="text-sm text-slate-600 mb-4">
              Rate your trip with <span className="font-semibold">{request.assigned_driver}</span>.
            </p>
            
            <div className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm((f) => ({ ...f, rating: star }))}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || feedbackForm.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Comments Textarea */}
              <div>
                <label htmlFor="feedback-comments" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Comments
                </label>
                <textarea
                  id="feedback-comments"
                  rows={4}
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm((f) => ({ ...f, comments: e.target.value }))}
                  placeholder="Share details about your experience with the driver (e.g. driving, punctuality, behavior)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackForm({ rating: 5, comments: '' });
                  }}
                  disabled={submittingFeedback}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
