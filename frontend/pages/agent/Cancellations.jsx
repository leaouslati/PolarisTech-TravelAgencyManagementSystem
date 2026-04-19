import { useEffect, useState } from 'react';
import api from '../../api/axios';

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const statusBadge = (status) => {
  const base = 'px-2.5 py-0.5 text-xs font-medium rounded-full';
  if (status === 'pending')  return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
  if (status === 'approved') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  if (status === 'rejected') return `${base} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
  return `${base} bg-slate-100 text-slate-600`;
};

const Spinner = () => (
  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function Cancellations() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actioning, setActioning] = useState({});
  const [search, setSearch]       = useState('');

  useEffect(() => {
    api.get('/agent/cancellations')
      .then(res => setRequests(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (cancelId, action) => {
    setActioning(prev => ({ ...prev, [cancelId]: action }));
    try {
      await api.patch(`/agent/cancellations/${cancelId}/${action}`);
      setRequests(prev =>
        prev.map(r =>
          r.cancel_id === cancelId
            ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} the cancellation. Please try again.`);
    } finally {
      setActioning(prev => {
        const next = { ...prev };
        delete next[cancelId];
        return next;
      });
    }
  };

  const filtered = requests.filter(r =>
    r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.package_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Cancellation Requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and action customer cancellation requests
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer or package..."
            className={inputClass}
          />
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                {search ? 'No results found.' : 'No cancellation requests'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                {search ? '' : 'All clear — nothing to review right now'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    {['Booking ID', 'Customer', 'Package', 'Reason', 'Date Requested', 'Status', 'Actions'].map(h => (
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
                  {filtered.map(r => {
                    const isPending   = r.status === 'pending';
                    const busyApprove = actioning[r.cancel_id] === 'approve';
                    const busyReject  = actioning[r.cancel_id] === 'reject';

                    return (
                      <tr
                        key={r.cancel_id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.booking_id}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {r.customer_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {r.package_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs">
                          <p className="line-clamp-2">{r.reason ?? '—'}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={statusBadge(r.status)}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => !actioning[r.cancel_id] && handleAction(r.cancel_id, 'approve')}
                                disabled={!!actioning[r.cancel_id]}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
                              >
                                {busyApprove && <Spinner />}
                                Approve
                              </button>
                              <button
                                onClick={() => !actioning[r.cancel_id] && handleAction(r.cancel_id, 'reject')}
                                disabled={!!actioning[r.cancel_id]}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {busyReject && <Spinner />}
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                          )}
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
    </div>
  );
}
