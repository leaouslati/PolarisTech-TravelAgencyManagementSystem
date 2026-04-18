import { useEffect, useState } from 'react';
import axios from 'axios';

const statusBadge = (status) => {
  const map = {
    pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    rejected: 'bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-400',
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function Cancellations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actioning, setActioning] = useState({}); // { [cancelId]: 'approve' | 'reject' }

  useEffect(() => {
    axios.get('/api/agent/cancellations')
      .then(res => setRequests(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (cancelId, action) => {
    setActioning(prev => ({ ...prev, [cancelId]: action }));
    try {
      await axios.patch(`/api/agent/cancellations/${cancelId}/${action}`);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cancellation Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and action customer cancellation requests
        </p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">

        {/* Loading skeleton */}
        {loading && (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-16">
            <svg className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">No cancellation requests</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">All clear — nothing to review right now</p>
          </div>
        )}

        {/* Table */}
        {!loading && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Booking ID', 'Customer', 'Package', 'Reason', 'Date Requested', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const isPending    = r.status === 'pending';
                  const busyApprove  = actioning[r.cancel_id] === 'approve';
                  const busyReject   = actioning[r.cancel_id] === 'reject';

                  return (
                    <tr
                      key={r.cancel_id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        BK-{String(r.booking_id).padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.customer_name}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.package_name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs">
                        <p className="line-clamp-2">{r.reason ?? '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{statusBadge(r.status)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            {/* Approve Cancellation */}
                            <button
                              onClick={() => handleAction(r.cancel_id, 'approve')}
                              disabled={!!actioning[r.cancel_id]}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
                            >
                              {busyApprove && (
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              Approve
                            </button>
                            {/* Reject */}
                            <button
                              onClick={() => handleAction(r.cancel_id, 'reject')}
                              disabled={!!actioning[r.cancel_id]}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {busyReject && (
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
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
  );
}