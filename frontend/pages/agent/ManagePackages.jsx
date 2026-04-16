import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const MOODS = ['Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic'];

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const EMPTY_FORM = {
  package_name: '',
  destination_id: '',
  travel_date: '',
  return_date: '',
  duration: '',
  total_price: '',
  description: '',
  available_slots: '',
  moods: [],
};

const Required = () => <span className="text-red-500 ml-0.5">*</span>;

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleteError, setDeleteError] = useState('');
  const toastTimer = useRef(null);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/agent/packages');
      setPackages(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    api.get('/agent/destinations')
      .then(res => setDestinations(res.data.data))
      .catch(err => console.error('destinations error:', err));
  }, []);

  // Auto-dismiss success toast after 4 seconds
  useEffect(() => {
    if (submitMessage) {
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSubmitMessage(''), 4000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [submitMessage]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleMood = (mood) => {
    setForm(prev => ({
      ...prev,
      moods: prev.moods.includes(mood)
        ? prev.moods.filter(m => m !== mood)
        : [...prev.moods, mood],
    }));
  };

  const validate = () => {
    if (!form.package_name || !form.destination_id || !form.travel_date || !form.return_date || !form.total_price || !form.available_slots || !form.duration || !form.description) {
      setSubmitError('All required fields must be filled in.');
      return false;
    }
    if (Number(form.total_price) <= 0) {
      setSubmitError('Price must be a positive number.');
      return false;
    }
    if (new Date(form.travel_date) <= new Date()) {
      setSubmitError('Travel date must be in the future.');
      return false;
    }
    if (new Date(form.return_date) <= new Date(form.travel_date)) {
      setSubmitError('Return date must be after the travel date.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitMessage('');
    try {
      if (editingId) {
        await api.put(`/agent/packages/${editingId}`, form);
        setSubmitMessage('Update submitted for admin approval.');
      } else {
        await api.post('/agent/packages', form);
        setSubmitMessage('Package created successfully.');
      }
      closeModal();
      fetchPackages();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg.package_id);
    setForm({
      package_name: pkg.package_name,
      destination_id: String(pkg.destination_id || ''),
      travel_date: pkg.travel_date || '',
      return_date: pkg.return_date || '',
      duration: pkg.duration != null ? String(pkg.duration) : '',
      total_price: pkg.total_price != null ? String(pkg.total_price) : '',
      description: pkg.description || '',
      available_slots: pkg.available_slots != null ? String(pkg.available_slots) : '',
      moods: pkg.moods || [],
    });
    setSubmitError('');
    setShowModal(true);
  };

  const confirmDelete = (pkg) => {
    setDeleteTarget({ id: pkg.package_id, name: pkg.package_name });
    setDeleteError('');
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/agent/packages/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchPackages();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to remove package. Please try again.');
    }
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSubmitError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSubmitError('');
  };

  const getStatusBadge = (status) => {
    const base = 'px-2.5 py-0.5 text-xs font-medium rounded-full';
    if (status === 'active') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
    if (status === 'pending_approval') return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
    return base;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-black dark:text-white">Manage Packages</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage your travel packages</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            + Create New Package
          </button>
        </div>

        {/* Success toast */}
        {submitMessage && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg">
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {submitMessage}
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
                ))}
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 dark:text-slate-500 text-sm">No packages yet. Create your first one above.</p>
              </div>
            ) : (
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    {['Package', 'Destination', 'Date', 'Price', 'Slots', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {packages.map(pkg => (
                      <tr key={pkg.package_id} className="transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{pkg.package_name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pkg.destination.city}, {pkg.destination.country}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pkg.travel_date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">${Number(pkg.total_price).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pkg.available_slots}</td>
                      <td className="py-3 px-4">
                        <span className={getStatusBadge(pkg.status_availability)}>
                          {pkg.status_availability.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(pkg)}
                              className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(pkg)}
                              className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {editingId ? 'Edit Package' : 'Create New Package'}
                </h2>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>

              {submitError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Package Name <Required /></label>
                    <input name="package_name" value={form.package_name} onChange={handleChange} placeholder="e.g. Paris Adventure" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination <Required /></label>
                    <select name="destination_id" value={form.destination_id} onChange={handleChange} className={inputClass}>
                      <option value="">Select destination</option>
                      {destinations.map(d => (
                        <option key={d.destination_id} value={d.destination_id}>
                          {d.city}, {d.country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Travel Date <Required /></label>
                    <input type="date" name="travel_date" value={form.travel_date} onChange={handleChange} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Return Date <Required /></label>
                    <input type="date" name="return_date" value={form.return_date} onChange={handleChange} className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (days) <Required /></label>
                    <input type="number" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 7" min="1" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price ($) <Required /></label>
                    <input type="number" name="total_price" value={form.total_price} onChange={handleChange} placeholder="e.g. 1500" min="1" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Available Slots <Required /></label>
                    <input type="number" name="available_slots" value={form.available_slots} onChange={handleChange} placeholder="e.g. 20" min="1" className={inputClass} />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description <Required /></label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe the package..." className={inputClass} />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mood Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(mood => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => toggleMood(mood)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200
                          ${form.moods.includes(mood)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400'}`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                    {editingId ? 'Submit Update' : 'Create Package'}
                  </button>
                  <button type="button" onClick={closeModal} className="px-5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-200">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6">

            <div className="flex items-center gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Remove Package</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Are you sure you want to remove <span className="font-medium text-slate-800 dark:text-slate-100">"{deleteTarget.name}"</span>?
            </p>

            {deleteError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePackages;
