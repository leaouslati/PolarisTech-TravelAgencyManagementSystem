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
  if (status === 'confirmed') {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }
  if (status === 'cancelled') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);
  const [formData, setFormData] = useState({ travel_date: '', num_travelers: 1 });
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleModify = async (bookingId) => {
    try {
      setActionLoading(true);
      setPageError('');
      await api.put(`/bookings/${bookingId}`, formData);
      setEditRow(null);
      await fetchBookings();
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to modify booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      setActionLoading(true);
      setPageError('');
      await api.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Customer requested cancellation'
      });
      setCancelRow(null);
      await fetchBookings();
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to cancel booking');
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
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            My Bookings
          </h1>
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            My Bookings
          </h1>

          {pageError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {pageError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Booking ID</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Package</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Destination</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Travel Date</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Travelers</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Total Price</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Actions</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tbody key={booking.booking_id}>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{booking.booking_id}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{booking.package_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{booking.destination_city}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        {booking.travel_date?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{booking.num_travelers}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        ${Number(booking.total_price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/customer/bookings/${booking.booking_id}`}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg transition-colors"
                          >
                            View
                          </Link>

                          <button
                            onClick={() => {
                              setEditRow(booking.booking_id);
                              setCancelRow(null);
                              setFormData({
                                travel_date: booking.travel_date?.slice(0, 10),
                                num_travelers: booking.num_travelers
                              });
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Modify
                          </button>

                          <button
                            onClick={() => {
                              setCancelRow(booking.booking_id);
                              setEditRow(null);
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>

                    {editRow === booking.booking_id && (
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <td colSpan="8" className="px-4 py-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              type="date"
                              value={formData.travel_date}
                              onChange={(e) =>
                                setFormData({ ...formData, travel_date: e.target.value })
                              }
                              className={inputClass}
                            />
                            <input
                              type="number"
                              min="1"
                              value={formData.num_travelers}
                              onChange={(e) =>
                                setFormData({ ...formData, num_travelers: e.target.value })
                              }
                              className={inputClass}
                            />
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleModify(booking.booking_id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-60"
                            >
                              {actionLoading ? 'Saving...' : 'Save'}
                            </button>

                            <button
                              onClick={() => setEditRow(null)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg"
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {cancelRow === booking.booking_id && (
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <td colSpan="8" className="px-4 py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Are you sure?
                            </p>
                            <button
                              onClick={() => handleCancel(booking.booking_id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-60"
                            >
                              {actionLoading ? 'Submitting...' : 'Yes, Cancel Booking'}
                            </button>
                            <button
                              onClick={() => setCancelRow(null)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg"
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}