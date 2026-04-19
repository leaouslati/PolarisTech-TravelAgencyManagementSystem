import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

const FIELD_LABELS = {
  package_name: 'Package Name',
  destination_id: 'Destination ID',
  total_price: 'Total Price',
  travel_date: 'Travel Date',
  return_date: 'Return Date',
  duration: 'Duration (days)',
  description: 'Description',
  status_availability: 'Status',
  available_slots: 'Available Slots',
};

function DiffRow({ label, oldValue, newValue }) {
  const changed = oldValue !== newValue;

  return (
    <tr className="border-b border-slate-50 dark:border-slate-700/50">
      <td className="py-2 px-4 text-xs font-semibold text-slate-500 uppercase">{label}</td>

      <td className="py-2 px-4 text-sm bg-slate-100 dark:bg-slate-700">
        {String(oldValue ?? '-')}
      </td>

      <td
        className={`py-2 px-4 text-sm font-medium ${
          changed
            ? 'bg-yellow-200 dark:bg-yellow-900/40'
            : 'bg-blue-100 dark:bg-blue-900/40'
        }`}
      >
        {String(newValue)}
      </td>
    </tr>
  );
}

function UpdateCard({ update, onApprove, onReject, processing }) {
  const [expanded, setExpanded] = useState(false);
  
  const proposed = typeof update.updated_data === 'string'
  ? JSON.parse(update.updated_data)
  : update.updated_data;

const current = typeof update.current_data === 'string'
  ? JSON.parse(update.current_data)
  : update.current_data || {};
  
  const changedFields = Object.keys(proposed).filter(k => FIELD_LABELS[k]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header Row */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{update.package_name}</p>
            <span className="text-xs text-slate-400 dark:text-slate-500">by {update.agent_name}</span>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Requested {new Date(update.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="ml-4 shrink-0 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Diff */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <div className="px-5 py-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Proposed Changes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-2 px-4 text-left w-40">Field</th>
                  <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-2 px-4 text-left">New Value</th>
                </tr>
              </thead>
              <tbody>
                {changedFields.map(key => (
                  <DiffRow key={key} label={FIELD_LABELS[key] || key} proposed={proposed[key]} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
        <button
          onClick={() => onReject(update.update_id)}
          disabled={!!processing}
          className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition"
        >
          {processing === `reject-${update.update_id}` ? 'Rejecting...' : 'Reject'}
        </button>
        <button
          onClick={() => onApprove(update.update_id)}
          disabled={!!processing}
          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          {processing === `approve-${update.update_id}` ? 'Approving...' : 'Approve'}
        </button>
      </div>
    </div>
  );
}

export default function PackageUpdates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetchUpdates = useCallback(() => {
    setLoading(true);
    api.get('/admin/package-updates')
      .then(res => setUpdates(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleApprove = async (updateId) => {
    setProcessing(`approve-${updateId}`);
    try {
      await api.patch(`/admin/package-updates/${updateId}/approve`);
      showToast('Package update approved successfully', 'success');
      fetchUpdates();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to approve update', 'error');
    } finally {
      setProcessing('');
    }
  };

  const handleReject = async (updateId) => {
    setProcessing(`reject-${updateId}`);
    try {
      await api.patch(`/admin/package-updates/${updateId}/reject`);
      showToast('Package update rejected', 'success');
      fetchUpdates();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to reject update', 'error');
    } finally {
      setProcessing('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Package Update Requests</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2">
            {!loading && `${updates.length} pending request${updates.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-24 animate-pulse" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-16 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">No pending package update requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map(u => (
              <UpdateCard
                key={u.update_id}
                update={u}
                onApprove={handleApprove}
                onReject={handleReject}
                processing={processing}
              />
            ))}
          </div>
        )}
      </div>

      {toast.msg && (
        <div className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
