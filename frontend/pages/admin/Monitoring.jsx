import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import api from '../../api/axios';

const bookingStatusColors = {
  pending:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

// Bug fix: was 'pending_review' — DB value is 'pending_approval'
const pkgStatusColors = {
  active:           'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  inactive:         'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const TH = 'text-left py-3 px-4 text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wide whitespace-nowrap';

export default function Monitoring() {
  const [tab, setTab] = useState('bookings');

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [pkgSearch, setPkgSearch] = useState('');

  const fetchBookings = useCallback(() => {
    setBookingsLoading(true);
    const params = bookingStatusFilter ? `?status=${bookingStatusFilter}` : '';
    api.get(`/admin/bookings${params}`)
      .then(res => setBookings(res.data.data || []))
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, [bookingStatusFilter]);

  const fetchPackages = useCallback(() => {
    setPackagesLoading(true);
    api.get('/admin/packages')
      .then(res => setPackages(res.data.data || []))
      .catch(() => {})
      .finally(() => setPackagesLoading(false));
  }, []);

  useEffect(() => { if (tab === 'bookings') fetchBookings(); }, [tab, fetchBookings]);
  useEffect(() => { if (tab === 'packages') fetchPackages(); }, [tab, fetchPackages]);

  const filteredPackages = packages.filter(p => {
    if (!pkgSearch) return true;
    const q = pkgSearch.toLowerCase();
    return p.package_name?.toLowerCase().includes(q) || p.agent_name?.toLowerCase().includes(q) || p.destination?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Monitoring</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2">Overview of all bookings and travel packages</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit mb-6 shadow-sm">
          {['bookings', 'packages'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-5">
              <select
                value={bookingStatusFilter}
                onChange={e => setBookingStatusFilter(e.target.value)}
                className="px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {bookingsLoading ? (
                <div className="p-12 text-center text-sm text-slate-400">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">No bookings found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                        {['Booking ID', 'Customer', 'Package', 'Destination', 'Travel Date', 'Travelers', 'Status', 'Total'].map(h => (
                          <th key={h} className={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {bookings.map(b => (
                        <tr key={b.booking_id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">{b.booking_id}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-200 whitespace-nowrap">{b.customer_name}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{b.package_name}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{b.destination}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{b.travel_date}</td>
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">{b.num_travelers}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${bookingStatusColors[b.status] || 'bg-slate-100 text-slate-700'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">${Number(b.total_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Packages Tab */}
        {tab === 'packages' && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-5">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={pkgSearch}
                  onChange={e => setPkgSearch(e.target.value)}
                  placeholder="Search packages..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {packagesLoading ? (
                <div className="p-12 text-center text-sm text-slate-400">Loading packages...</div>
              ) : filteredPackages.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">No packages found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                        {['Package', 'Agent', 'Destination', 'Price', 'Slots', 'Travel Date', 'Status'].map(h => (
                          <th key={h} className={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredPackages.map(p => (
                        <tr key={p.package_id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{p.package_name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.agent_name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.destination}</td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">${Number(p.total_price).toLocaleString()}</td>
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">{p.available_slots}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.travel_date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${pkgStatusColors[p.status_availability] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                              {p.status_availability?.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
