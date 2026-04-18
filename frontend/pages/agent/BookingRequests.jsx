import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const statusBadge = (status) => {
  const map = {
    pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    cancelled: 'bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-400',
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function BookingRequests() {
  const navigate = useNavigate();
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [actioning, setActioning] = useState({}); // { [bookingId]: 'approve' | 'decline' }

  useEffect(() => {
    axios.get('/api/agent/bookings')
      .then(res => setBookings(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (bookingId, action) => {
    setActioning(prev => ({ ...prev, [bookingId]: action }));
    try {
      await axios.patch(`/api/agent/bookings/${bookingId}/${action}`);
      const newStatus = action === 'approve' ? 'confirmed' : 'cancelled';
      setBookings(prev =>
        prev.map(b => b.booking_id === bookingId ? { ...b, status: newStatus } : b)
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} booking. Please try again.`);
    } finally {
      setActioning(prev => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
    }
  };

  const filtered = bookings.filter(b =>
    b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.package_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Booking Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and manage all customer booking requests
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer name or package name…"
          className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg
                     placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500
                     transition-colors duration-200"
        />
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">

        {/* Loading skeleton */}
        {loading && (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 dark:text-slate-500 text-sm">No booking requests found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Booking ID', 'Customer', 'Package', 'Travel Date', 'Travelers', 'Add-ons', 'Total Price', 'Status', 'Actions'].map(h => (
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
                {filtered.map(b => {
                  const isPending = b.status === 'pending';
                  const busyApprove = actioning[b.booking_id] === 'approve';
                  const busyDecline = actioning[b.booking_id] === 'decline';

                  return (
                    <tr
                      key={b.booking_id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {/* Booking ID — clickable to messages */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/agent/messages/${b.booking_id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          BK-{String(b.booking_id).padStart(4, '0')}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{b.customer_name}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{b.package_name}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {b.travel_date ? new Date(b.travel_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 text-center">{b.travelers ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {b.addons ? (
                          <span className="text-xs">{b.addons}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        ${Number(b.total_price ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{statusBadge(b.status)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            {/* Approve */}
                            <button
                              onClick={() => handleAction(b.booking_id, 'approve')}
                              disabled={!!actioning[b.booking_id]}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {busyApprove && (
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              Approve
                            </button>
                            {/* Decline */}
                            <button
                              onClick={() => handleAction(b.booking_id, 'decline')}
                              disabled={!!actioning[b.booking_id]}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {busyDecline && (
                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              Decline
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