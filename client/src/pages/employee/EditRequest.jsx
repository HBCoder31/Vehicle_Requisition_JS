import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateString } from '../../utils/date';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Send, MapPin, Calendar, Clock, Users, FileText } from 'lucide-react';

export default function EditRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const { data } = await api.get('/destinations');
        setDestinations(data.destinations || []);
      } catch (err) {
        console.error('Failed to load destinations:', err);
      }
    }
    fetchDestinations();
  }, []);

  const [form, setForm] = useState({
    purpose: '',
    pickup_location: '',
    destination: '',
    travel_type: 'Within Anuppur/Shahdol',
    passengers: 1,
    travel_date: '',
    travel_time: '',
    return_date: '',
    return_time: '',
    work_type: 'Company',
    want_ticket: 0,
    mode_of_transport: '',
    ticket_from: '',
    ticket_to: ''
  });

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  const handleLocationSearch = async (query, field) => {
    if (query.length < 2) {
      if (field === 'from') setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }

    try {
      const endpoint = form.mode_of_transport === 'Flight' ? '/requests/lookup/airports' : '/requests/lookup/railways';
      const { data } = await api.get(endpoint, { params: { q: query } });
      const formatted = (data.data || []).map(item => {
        if (form.mode_of_transport === 'Flight') {
          return `${item.city} - ${item.name} (${item.iata_code})`;
        } else {
          return `${item.name} (${item.code}) - ${item.state || ''}`;
        }
      });
      if (field === 'from') setFromSuggestions(formatted);
      else setToSuggestions(formatted);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  useEffect(() => {
    async function fetchRequest() {
      try {
        const { data } = await api.get(`/requests/${id}`);
        const reqData = data.request;
        
        // Safety check: only allow editing if it belongs to user and is Pending_HOD
        if (reqData.employee_id !== user.id) {
          setError('You are not authorized to edit this request.');
          setLoading(false);
          return;
        }
        const isEditable = (reqData.status === 'Pending_HOD') || (reqData.status === 'Pending_GM_HR' && ['HOD', 'GM-HR'].includes(user?.role));
        if (!isEditable) {
          setError('This request can no longer be edited as it has moved past the initial pending stage.');
          setLoading(false);
          return;
        }

        setForm({
          purpose: reqData.purpose || '',
          pickup_location: reqData.pickup_location || '',
          destination: reqData.destination || '',
          travel_type: reqData.travel_type || 'Within Anuppur/Shahdol',
          passengers: reqData.passengers || 1,
          travel_date: getLocalDateString(reqData.travel_date),
          travel_time: reqData.travel_time ? reqData.travel_time.substring(0, 5) : '',
          return_date: getLocalDateString(reqData.return_date),
          return_time: reqData.return_time ? reqData.return_time.substring(0, 5) : '',
          work_type: reqData.work_type || 'Company',
          want_ticket: reqData.want_ticket || 0,
          mode_of_transport: reqData.mode_of_transport || '',
          ticket_from: reqData.ticket_from || '',
          ticket_to: reqData.ticket_to || ''
        });
      } catch (err) {
        setError('Failed to load request details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [id, user.id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.put(`/requests/${id}`, form);
      setSuccess('Request updated successfully!');
      setTimeout(() => navigate(`/requests/${id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update request.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Edit Request #{id}</h1>
        <p className="text-sm text-muted mt-1">Update the details of your pending requisition</p>
      </div>

      <Card>
        {error && !form.purpose ? (
          <div className="p-4 bg-danger-50 border border-danger-500/20 rounded-lg text-danger-700">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-sm text-danger-700">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-success-50 border border-success-500/20 rounded-lg text-sm text-success-700">{success}</div>
            )}

            {/* Work Category */}
            <div>
              <label className={labelClass}>Requisition Purpose Category</label>
              <div className="flex gap-6">
                {[
                  { label: "Company's Work", value: 'Company' },
                  { label: 'Personal Work', value: 'Personal' }
                ].map(item => (
                  <label key={item.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="work_type"
                      value={item.value}
                      checked={form.work_type === item.value}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-border focus:ring-primary-500"
                    />
                    <span className={`text-sm ${form.work_type === item.value ? 'text-slate-800 font-semibold' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label htmlFor="purpose" className={labelClass}>
                <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Purpose of Travel
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                rows={3}
                className={inputClass}
                placeholder="Describe the purpose of your trip..."
              />
            </div>

            {/* Pickup Location */}
            <div>
              <label htmlFor="pickup_location" className={labelClass}>
                <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Pickup Location
              </label>
              <input
                id="pickup_location"
                name="pickup_location"
                type="text"
                value={form.pickup_location}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="e.g., Main Office Gate"
              />
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className={labelClass}>
                <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                value={form.destination}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Enter destination name..."
                list="destinations-list"
              />
              <datalist id="destinations-list">
                {destinations.map(d => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>

            {/* Travel Type */}
            <div>
              <label className={labelClass}>Travel Type</label>
              <div className="flex gap-4">
                {['Within Anuppur/Shahdol', 'Beyond Anuppur/Shahdol'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="travel_type"
                      value={type}
                      checked={form.travel_type === type}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-border focus:ring-primary-500"
                    />
                    <span className={`text-sm ${form.travel_type === type ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                      {type}
                    </span>
                  </label>
                ))}
              </div>
              {form.travel_type === 'Beyond Anuppur/Shahdol' && (
                <p className="mt-1.5 text-xs text-warning-600 bg-warning-50 px-3 py-1.5 rounded-md">
                  ⚠ Requests beyond Anuppur/Shahdol require additional COO approval.
                </p>
              )}
            </div>

            {form.travel_type === 'Beyond Anuppur/Shahdol' && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 shadow-inner">
                <div>
                  <label className={labelClass}>Want to book ticket?</label>
                  <div className="flex gap-4">
                    {['No', 'Yes'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          want_ticket: opt === 'Yes' ? 1 : 0,
                          mode_of_transport: opt === 'No' ? '' : (prev.mode_of_transport || 'Bus'),
                          ticket_from: opt === 'No' ? '' : prev.ticket_from,
                          ticket_to: opt === 'No' ? '' : prev.ticket_to
                        }))}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                          (opt === 'Yes' ? form.want_ticket === 1 : form.want_ticket === 0)
                            ? 'bg-primary-900 border-primary-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {(form.want_ticket === 1 || form.want_ticket === 0) && (
                  <p className="text-xs text-primary-700 bg-primary-50 px-3 py-2 rounded-md font-medium border border-primary-100/50">
                    ℹ After approval from higher authorities your form will be sent to Travel admin.
                  </p>
                )}

                {form.want_ticket === 1 && (
                  <div className="space-y-4 pt-2 border-t border-slate-200/50">
                    <div>
                      <label className={labelClass}>Mode of transport needed</label>
                      <div className="flex gap-3">
                        {['Bus', 'Train', 'Flight'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setForm(prev => ({ 
                              ...prev, 
                              mode_of_transport: mode,
                              ticket_from: '',
                              ticket_to: ''
                            }))}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                              form.mode_of_transport === mode
                                ? 'bg-indigo-900 border-indigo-900 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="ticket_from" className={labelClass}>From</label>
                        <input
                          id="ticket_from"
                          name="ticket_from"
                          type="text"
                          required={form.want_ticket === 1}
                          value={form.ticket_from}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => ({ ...prev, ticket_from: val }));
                            if (form.mode_of_transport !== 'Bus') {
                              handleLocationSearch(val, 'from');
                            }
                          }}
                          className={inputClass}
                          placeholder={
                            form.mode_of_transport === 'Bus' ? 'Enter starting location' :
                            form.mode_of_transport === 'Train' ? 'Search railway station...' : 'Search airport...'
                          }
                          list="edit-from-suggestions-list"
                          autoComplete="off"
                        />
                        {form.mode_of_transport !== 'Bus' && (
                          <datalist id="edit-from-suggestions-list">
                            {fromSuggestions.map((s, idx) => (
                              <option key={`edit-from-sug-${idx}`} value={s} />
                            ))}
                          </datalist>
                        )}
                      </div>

                      <div>
                        <label htmlFor="ticket_to" className={labelClass}>To</label>
                        <input
                          id="ticket_to"
                          name="ticket_to"
                          type="text"
                          required={form.want_ticket === 1}
                          value={form.ticket_to}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => ({ ...prev, ticket_to: val }));
                            if (form.mode_of_transport !== 'Bus') {
                              handleLocationSearch(val, 'to');
                            }
                          }}
                          className={inputClass}
                          placeholder={
                            form.mode_of_transport === 'Bus' ? 'Enter destination location' :
                            form.mode_of_transport === 'Train' ? 'Search railway station...' : 'Search airport...'
                          }
                          list="edit-to-suggestions-list"
                          autoComplete="off"
                        />
                        {form.mode_of_transport !== 'Bus' && (
                          <datalist id="edit-to-suggestions-list">
                            {toSuggestions.map((s, idx) => (
                              <option key={`edit-to-sug-${idx}`} value={s} />
                            ))}
                          </datalist>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="travel_date" className={labelClass}>
                  <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Travel Date
                </label>
                <input
                  id="travel_date"
                  name="travel_date"
                  type="date"
                  min={todayDate}
                  value={form.travel_date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="travel_time" className={labelClass}>
                  <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Travel Time
                </label>
                <input
                  id="travel_time"
                  name="travel_time"
                  type="time"
                  min={form.travel_date === todayDate ? nowTime : undefined}
                  value={form.travel_time}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="return_date" className={labelClass}>Return Date (Optional)</label>
                <input
                  id="return_date"
                  name="return_date"
                  type="date"
                  min={form.travel_date || todayDate}
                  value={form.return_date}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="return_time" className={labelClass}>Return Time (Optional)</label>
                <input
                  id="return_time"
                  name="return_time"
                  type="time"
                  min={form.return_date === form.travel_date && form.travel_time ? form.travel_time : (form.return_date === todayDate ? nowTime : undefined)}
                  value={form.return_time}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Passengers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="passengers" className={labelClass}>
                  <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Number of Passengers
                </label>
                <input
                  id="passengers"
                  name="passengers"
                  type="number"
                  min="1"
                  max="50"
                  value={form.passengers}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                <Send className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
