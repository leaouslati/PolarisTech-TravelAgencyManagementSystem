import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function getStatusClass(status) {
  if (status === 'confirmed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
}

export default function MyBookings() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pageError, setPageError]       = useState('');
  const [editRow, setEditRow]           = useState(null);   // booking_id being edited
  const [showEditModal, setShowEditModal] = useState(false);
  const [cancelRow, setCancelRow]       = useState(null);   // booking_id being cancelled
  const [formData, setFormData]         = useState({ travel_date: '', num_travelers: 1 });
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingCancelMsg, setPendingCancelMsg] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setPageError('');
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.data || []);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const openEdit = (booking) => {
    setEditRow(booking.booking_id);
    setFormData({
      travel_date: booking.travel_date?.slice(0, 10),
      num_travelers: booking.num_travelers,
    });
    setShowEditModal(true);
  };

  const closeEdit = () => { setShowEditModal(false); setEditRow(null); };

  const handleModify = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setPageError('');
      await api.put(`/bookings/${editRow}`, formData);
      closeEdit();
      await fetchBookings();
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to modify booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      setPageError('');
      await api.post(`/bookings/${cancelRow}/cancel`, { reason: 'Customer requested cancellation' });
      setCancelRow(null);
      await fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to cancel booking';
      if (msg.includes('already pending')) {
        setPendingCancelMsg(true);
        setTimeout(() => setPendingCancelMsg(false), 3000);
      } else {
        setPageError(msg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">My Bookings</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            You have no bookings yet. Browse packages to get started.
          </p>
          <Link
            to="/customer/browse"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Browse Packages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        <div className="flex flex-col mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">My Bookings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View, manage, and modify your travel bookings here.
          </p>
        </div>

        {pageError && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg" role="alert" aria-live="polite">
            {pageError}
          </div>
        )}

        {pendingCancelMsg && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm px-4 py-3 rounded-lg">
            A cancellation request is already pending for this booking
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                  {['Booking ID', 'Package', 'Destination', 'Travel Date', 'Travelers', 'Status', 'Total Price', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide text-left align-middle">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {bookings.map((booking) => (
                  <tr key={booking.booking_id} className="transition-colors align-middle">
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 align-middle">{booking.booking_id}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 align-middle">{booking.package_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 align-middle text-center">{booking.destination_city}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 align-middle">{booking.travel_date?.slice(0, 10)}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 align-middle text-center">{booking.num_travelers}</td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 align-middle text-center">
                      ${Number(booking.total_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex gap-3 flex-wrap items-center">
                        <Link
                          to={`/customer/bookings/${booking.booking_id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                          View
                        </Link>
                        {booking.status !== 'cancelled' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(booking)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                            >
                              Modify
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelRow(booking.booking_id)}
                              className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Edit Modal — rendered OUTSIDE the table ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Modify Booking</h2>
                <button type="button" onClick={closeEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleModify}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Travel Date</label>
                    <input
                      type="date"
                      value={formData.travel_date}
                      onChange={e => setFormData({ ...formData, travel_date: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Travelers</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.num_travelers}
                      onChange={e => setFormData({ ...formData, num_travelers: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    aria-label="Save booking changes"
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {actionLoading && <Spinner />}
                    {actionLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal — rendered OUTSIDE the table ── */}
      {cancelRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCancelRow(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Cancel Booking</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Are you sure you want to cancel booking <span className="font-medium">{cancelRow}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setCancelRow(null)}
                className="px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                aria-label="Confirm cancellation of this booking"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionLoading && <Spinner />}
                {actionLoading ? 'Submitting…' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
