import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

const MOODS = ['Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic'];

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const inputErrorClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-red-400 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-red-500 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-500 dark:text-red-400">{message}</p> : null;

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

const EMPTY_ERRORS = {
  package_name: '',
  destination_id: '',
  travel_date: '',
  return_date: '',
  total_price: '',
  available_slots: '',
  duration: '',
  description: '',
};

const Required = () => <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>;

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_ERRORS);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  useEffect(() => {
    if (submitMessage) {
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSubmitMessage(''), 4000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [submitMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear the field error as the user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleMood = (mood) => {
    setForm(prev => ({
      ...prev,
      moods: prev.moods.includes(mood)
        ? prev.moods.filter(m => m !== mood)
        : [...prev.moods, mood],
    }));
  };

  // Returns an errors object; empty strings mean no error
  const validateFields = () => {
    const errors = { ...EMPTY_ERRORS };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!form.package_name.trim()) {
      errors.package_name = 'Package name is required.';
    }

    if (!form.destination_id) {
      errors.destination_id = 'Please select a destination.';
    }

    if (!form.travel_date) {
      errors.travel_date = 'Travel date is required.';
    } else if (new Date(form.travel_date) <= today) {
      errors.travel_date = 'Travel date must be in the future.';
    }

    if (!form.return_date) {
      errors.return_date = 'Return date is required.';
    } else if (form.travel_date && new Date(form.return_date) <= new Date(form.travel_date)) {
      errors.return_date = 'Return date must be after the travel date.';
    }

    if (!form.duration) {
      errors.duration = 'Duration is required.';
    }

    if (!form.total_price) {
      errors.total_price = 'Price is required.';
    } else if (Number(form.total_price) <= 0) {
      errors.total_price = 'Price must be greater than $0.';
    }

    if (!form.available_slots) {
      errors.available_slots = 'Available slots is required.';
    } else if (Number(form.available_slots) < 1) {
      errors.available_slots = 'Must have at least 1 available slot.';
    }

    if (!form.description.trim()) {
      errors.description = 'Description is required.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const errors = validateFields();
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors(EMPTY_ERRORS);
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
    setFieldErrors(EMPTY_ERRORS);
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
    setFieldErrors(EMPTY_ERRORS);
    setSubmitError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFieldErrors(EMPTY_ERRORS);
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
          <div role="status" className="mb-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg">
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
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                  <svg className="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  You have no packages yet.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Create your first package to get started.
                </p>
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  + Create New Package
                </button>
              </div>
            ) : (
              <table className="w-full min-w-160 text-sm" role="table">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    {['Package', 'Destination', 'Date', 'Price', 'Slots', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        scope="col"
                        className="text-left py-3 px-4 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {packages.map(pkg => (
                    <tr
                      key={pkg.package_id}
                      tabIndex={0}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"
                      aria-label={`Package: ${pkg.package_name}`}
                    >
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
                            aria-label={`Edit package ${pkg.package_name}`}
                            className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(pkg)}
                            aria-label={`Delete package ${pkg.package_name}`}
                            className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Package' : 'Create New Package'}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {editingId ? 'Edit Package' : 'Create New Package'}
                </h2>
                <button type="button" onClick={closeModal} aria-label="Close modal" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>

              {submitError && (
                <div role="alert" className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label htmlFor="package_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Package Name <Required />
                    </label>
                    <input
                      id="package_name"
                      name="package_name"
                      value={form.package_name}
                      onChange={handleChange}
                      placeholder="e.g. Paris Adventure"
                      aria-label="Package name"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.package_name}
                      aria-describedby={fieldErrors.package_name ? 'err-package_name' : undefined}
                      className={fieldErrors.package_name ? inputErrorClass : inputClass}
                    />
                    <FieldError message={fieldErrors.package_name} />
                  </div>

                  <div>
                    <label htmlFor="destination_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Destination <Required />
                    </label>
                    <select
                      id="destination_id"
                      name="destination_id"
                      value={form.destination_id}
                      onChange={handleChange}
                      aria-label="Destination"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.destination_id}
                      className={fieldErrors.destination_id ? inputErrorClass : inputClass}
                    >
                      <option value="">Select destination</option>
                      {destinations.map(d => (
                        <option key={d.destination_id} value={d.destination_id}>
                          {d.city}, {d.country}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.destination_id} />
                  </div>

                  <div>
                    <label htmlFor="travel_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Travel Date <Required />
                    </label>
                    <input
                      id="travel_date"
                      type="date"
                      name="travel_date"
                      value={form.travel_date}
                      onChange={handleChange}
                      aria-label="Travel date"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.travel_date}
                      className={fieldErrors.travel_date ? inputErrorClass : inputClass}
                    />
                    <FieldError message={fieldErrors.travel_date} />
                  </div>

                  <div>
                    <label htmlFor="return_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Return Date <Required />
                    </label>
                    <input
                      id="return_date"
                      type="date"
                      name="return_date"
                      value={form.return_date}
                      onChange={handleChange}
                      aria-label="Return date"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.return_date}
                      className={fieldErrors.return_date ? inputErrorClass : inputClass}
                    />
                    <FieldError message={fieldErrors.return_date} />
                  </div>

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Duration (days) <Required />
                    </label>
                    <input
                      id="duration"
                      type="number"
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      placeholder="e.g. 7"
                      min="1"
                      aria-label="Duration in days"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.duration}
                      className={fieldErrors.duration ? inputErrorClass : inputClass}
                    />
                    <FieldError message={fieldErrors.duration} />
                  </div>

                  <div>
                    <label htmlFor="total_price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Price ($) <Required />
                    </label>
                    <input
                      id="total_price"
                      type="number"
                      name="total_price"
                      value={form.total_price}
                      onChange={handleChange}
                      placeholder="e.g. 1500"
                      min="1"
                      aria-label="Price in US dollars"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.total_price}
                      className={fieldErrors.total_price ? inputErrorClass : inputClass}
                    />
                    <FieldError message={fieldErrors.total_price} />
                  </div>

                  <div>
                    <label htmlFor="available_slots" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Available Slots <Required />
                    </label>
                    <input
                      id="available_slots"
                      type="number"
                      name="available_slots"
                      value={form.available_slots}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                      min="1"
                      aria-label="Available slots"
                      aria-required="true"
                      aria-invalid={!!fieldErrors.available_slots}
                      className={fieldErrors.available_slots ? inputErrorClass : inputClass}
                    />
                    <FieldError message={fieldErrors.available_slots} />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description <Required />
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the package..."
                    aria-label="Package description"
                    aria-required="true"
                    aria-invalid={!!fieldErrors.description}
                    className={fieldErrors.description ? inputErrorClass : inputClass}
                  />
                  <FieldError message={fieldErrors.description} />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mood Tags</label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Mood tags">
                    {MOODS.map(mood => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => toggleMood(mood)}
                        aria-pressed={form.moods.includes(mood)}
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
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    {editingId ? 'Submit Update' : 'Create Package'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-200"
                  >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Confirm package deletion">
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
              <div role="alert" className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
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