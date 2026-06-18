import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

const DestinationManagement = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/destinations');
      setDestinations(data.destinations || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch destinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (d) => {
    setEditingId(d.id);
    setFormData({ name: d.name || '' });
    setShowModal(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/destinations/${editingId}`, formData);
      } else {
        await api.post('/destinations', formData);
      }
      setShowModal(false);
      fetchDestinations();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save destination');
    }
  };

  const handleStatusToggle = async (dest) => {
    const newStatus = dest.is_active ? 'Deactivate' : 'Restore';
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} destination "${dest.name}"?`)) return;

    setUpdatingId(dest.id);
    try {
      const { data } = await api.patch(`/destinations/${dest.id}/status`);
      setDestinations(prev => prev.map(d =>
        d.id === dest.id ? { ...d, is_active: data.is_active } : d
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update destination status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this destination? This action cannot be undone.')) return;
    try {
      await api.delete(`/destinations/${id}`);
      fetchDestinations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete destination.');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Destination Management</h1>
          <p className="text-sm text-muted mt-1">Predefine and manage standard trip destinations</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          + Add Destination
        </button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {destinations.map(d => {
                const isActive = Boolean(d.is_active);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{d.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{d.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isActive ? 'bg-success-50 text-success-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(d)}
                          className="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusToggle(d)}
                          disabled={updatingId === d.id}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-orange-5 text-orange-600 hover:bg-orange-50 border border-orange-100'
                              : 'bg-success-5 text-success-600 hover:bg-success-50 border border-success-100'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Restore'}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="px-2 py-1 text-xs text-danger-600 hover:text-danger-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Destination Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-slate-800">{editingId ? 'Edit Destination' : 'Add New Destination'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Railway Station" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary-500 outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow">Save Destination</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationManagement;
