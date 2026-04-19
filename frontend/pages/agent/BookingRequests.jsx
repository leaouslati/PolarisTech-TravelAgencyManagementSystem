import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const statusBadge = (status) => {
  const base = 'px-2.5 py-0.5 text-xs font-medium rounded-full';
  if (status === 'pending') return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
  if (status === 'confirmed') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  if (status === 'cancelled') return `${base} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
  return `${base} bg-slate-100 text-slate-600`;
};

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const BookingRequests = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioning, setActioning] = useState({});

  const fetchBookings = async () => {
    try {
      const res = await api.get('/agent/bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id, action) => {
    setActioning(prev => ({ ...prev, [id]: action }));

    try {
      await api.patch(`/agent/bookings/${id}/${action}`);

      const newStatus = action === 'approve' ? 'confirmed' : 'cancelled';

      setBookings(prev =>
        prev.map(b =>
          b.booking_id === id ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} booking`);
    } finally {
      setActioning(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const filtered = bookings.filter(b =>
    b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.package_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">
            Booking Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and manage all customer booking requests
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                No booking requests found.
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
              <table className="w-full min-w-[1100px] text-sm">

                {/* Header */}
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    {[
                      'Booking ID',
                      'Customer',
                      'Package',
                      'Travel Date',
                      'Travelers',
                      'Add-ons',
                      'Total Price',
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

                {/* Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map(b => {
                    const isPending = b.status === 'pending';
                    const busyApprove = actioning[b.booking_id] === 'approve';
                    const busyDecline = actioning[b.booking_id] === 'decline';

                    return (
                      <tr key={b.booking_id} className="transition-colors">

                        <td className="py-3 px-4 font-medium">
                          <button
                            onClick={() => navigate(`/agent/messages/${b.booking_id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            BK-{String(b.booking_id).padStart(4, '0')}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {b.customer_name}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {b.package_name}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {b.travel_date
                            ? new Date(b.travel_date).toLocaleDateString()
                            : '—'}
                        </td>

                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                          {b.num_travelers || '—'}
                        </td>

                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {b.addons || <span className="text-xs text-slate-400">None</span>}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          ${Number(b.total_price || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <span className={statusBadge(b.status)}>
                            {b.status}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isPending ? (
                            <div className="flex gap-2">
                              <span
                                onClick={() => !actioning[b.booking_id] && handleAction(b.booking_id, 'approve')}
                                className={`cursor-pointer select-none text-green-600 dark:text-green-400 font-medium text-xs px-2 py-1 ${busyApprove ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{ userSelect: 'none' }}
                              >
                                {busyApprove ? '...' : 'Approve'}
                              </span>
                              <span
                                onClick={() => !actioning[b.booking_id] && handleAction(b.booking_id, 'decline')}
                                className={`cursor-pointer select-none text-red-600 dark:text-red-400 font-medium text-xs px-2 py-1 ${busyDecline ? 'opacity-50 pointer-events-none' : ''}`}
                                style={{ userSelect: 'none' }}
                              >
                                {busyDecline ? '...' : 'Decline'}
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

export default BookingRequests;