import { useEffect, useState } from 'react';
import api from '../../api/axios';

const statusBadge = (status) => {
  const base = 'px-2.5 py-0.5 text-xs font-medium rounded-full';
  if (status === 'pending') return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
  if (status === 'approved') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  if (status === 'rejected') return `${base} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
  return `${base} bg-slate-100 text-slate-600`;
};

const Cancellations = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState({});

  const fetchCancellations = async () => {
    try {
      const res = await api.get('/agent/cancellations');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancellations();
  }, []);

  const handleAction = async (id, action) => {
    setActioning(prev => ({ ...prev, [id]: action }));

    try {
      await api.patch(`/agent/cancellations/${id}/${action}`);

      setRequests(prev =>
        prev.map(r =>
          r.cancel_id === id
            ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} request`);
    } finally {
      setActioning(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Cancellation Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and manage customer cancellation requests
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {loading ? (
            <div className="p-6 animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                No cancellation requests found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">

                {/* Table Header */}
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    {[
                      'Booking ID',
                      'Customer',
                      'Package',
                      'Reason',
                      'Date Requested',
                      'Status',
                      'Actions'
                    ].map(h => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {requests.map(r => {
                    const isPending = r.status === 'pending';
                    const busyApprove = actioning[r.cancel_id] === 'approve';
                    const busyReject = actioning[r.cancel_id] === 'reject';

                    return (
                      <tr key={r.cancel_id} className="transition-colors">

                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          BK-{String(r.booking_id).padStart(4, '0')}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {r.customer_name}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {r.package_name}
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs">
                          <p className="line-clamp-2">{r.reason || '—'}</p>
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString()
                            : '—'}
                        </td>

                        <td className="py-3 px-4">
                          <span className={statusBadge(r.status)}>
                            {r.status}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isPending ? (
                            <div className="flex gap-2">


                              <span
                                onClick={() => !actioning[r.cancel_id] && handleAction(r.cancel_id, 'approve')}
                                className={`cursor-pointer select-none text-green-600 dark:text-green-400 font-medium text-sm px-2 py-1 rounded transition-colors duration-150 ${busyApprove ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{ userSelect: 'none' }}
                              >
                                {busyApprove ? '...' : 'Accept'}
                              </span>

                              <span
                                onClick={() => !actioning[r.cancel_id] && handleAction(r.cancel_id, 'reject')}
                                className={`cursor-pointer select-none text-red-600 dark:text-red-400 font-medium text-sm px-2 py-1 rounded transition-colors duration-150 ${busyReject ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{ userSelect: 'none' }}
                              >
                                {busyReject ? '...' : 'Reject'}
                              </span>

                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
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
};

export default Cancellations;