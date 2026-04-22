import { useState, useEffect } from 'react';
import api from '../../api/axios';

const statusBadge = (status) => {
  const base = 'px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap';
  if (status === 'active') return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
  if (status === 'pending_approval') return `${base} bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`;
  if (status === 'inactive') return `${base} bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400`;
  if (status === 'rejected') return `${base} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
  return `${base} bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400`;
};

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

function Spinner({ size = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${size} text-white`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Confirm Delete</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Spinner size="h-3 w-3" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const emptyForm = { name: '', destination: '', duration: '', price: '' };

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingPkg, setEditingPkg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/agent/packages');
      setPackages(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load packages.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingPkg(null);
    setErrorMsg('');
  };

  const handleEdit = (pkg) => {
    setForm({
      name: pkg.name || '',
      destination: pkg.destination || '',
      duration: pkg.duration || '',
      price: pkg.price ?? '',
    });
    setEditingPkg(pkg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const pkgId = editingPkg?.id || editingPkg?.package_id;

      if (editingPkg) {
        await api.put(`/agent/packages/${pkgId}`, form);
        setPackages(prev =>
          prev.map(p =>
            (p.id || p.package_id) === pkgId
              ? { ...p, ...form, status: 'pending_approval' }
              : p
          )
        );
        setSuccessMsg('Update submitted for admin approval');
      } else {
        const res = await api.post('/agent/packages', form);
        const newPkg = res.data.data || res.data;
        setPackages(prev => [...prev, newPkg]);
        setSuccessMsg('Package created successfully');
      }

      resetForm();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save package. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    const pkgId = confirmDelete?.id || confirmDelete?.package_id;

    try {
      await api.delete(`/agent/packages/${pkgId}`);
      setPackages(prev => prev.filter(p => (p.id || p.package_id) !== pkgId));
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete package. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusLabel = (s) =>
    (s || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Manage Packages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage your travel packages</p>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Create / Edit Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-5">
            {editingPkg ? `Edit: ${editingPkg.name}` : 'Create New Package'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Package Name
              </label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Paris Adventure"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Destination
              </label>
              <input
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                required
                placeholder="e.g. Paris, France"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Duration
              </label>
              <input
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                required
                placeholder="e.g. 7 days"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Price (USD)
              </label>
              <input
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
                type="number"
                min="0"
                placeholder="e.g. 1500"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Spinner size="h-3 w-3" />}
                {editingPkg ? 'Submit Update' : 'Create Package'}
              </button>

              {editingPkg && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Packages Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 dark:text-slate-500 text-sm">No packages yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    {['Package', 'Destination', 'Duration', 'Price', 'Status', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {packages.map(pkg => {
                    const pkgId = pkg.id || pkg.package_id;
                    return (
                      <tr
                        key={pkgId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {pkg.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pkg.destination}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{pkg.duration}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          ${Number(pkg.price || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={statusBadge(pkg.status)}>{statusLabel(pkg.status)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(pkg)}
                              className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium rounded-lg transition-colors"
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
          )}
        </div>

      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default ManagePackages;
