import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

function statusBadgeClass(status) {
  if (status === 'confirmed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (status === 'modified')  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
}

function paymentBadgeClass(status) {
  if (status === 'paid')   return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{value ?? '—'}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
      <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="px-5 py-1">{children}</div>
  </div>
);

// Timeline step config
const TIMELINE_STEPS = [
  { key: 'submitted',    label: 'Submitted',     description: 'Booking received' },
  { key: 'agent_review', label: 'Agent Review',  description: 'Under review' },
  { key: 'confirmed',    label: 'Confirmed',     description: 'Booking confirmed' },
  { key: 'travel',       label: 'Travel',        description: 'Trip in progress' },
];

function getActiveStep(booking) {
  if (!booking) return 0;
  const travelDate = booking.travel_date ? new Date(booking.travel_date) : null;
  const travelPassed = travelDate && travelDate <= new Date();

  if (booking.status === 'cancelled') return 1; // stays at agent review
  if (travelPassed && booking.status === 'confirmed') return 3;
  if (booking.status === 'confirmed') return 2;
  return 1; // pending / modified
}

function BookingTimeline({ booking }) {
  const activeStep = getActiveStep(booking);
  const isCancelled = booking?.status === 'cancelled';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Booking Status</h2>
      </div>
      <div className="px-5 py-5">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This booking has been cancelled.
          </div>
        ) : (
          <div className="flex items-start gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const done    = i <= activeStep;
              const current = i === activeStep;
              const isLast  = i === TIMELINE_STEPS.length - 1;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center">
                  {/* connector row */}
                  <div className="flex items-center w-full">
                    {/* left line */}
                    <div className={`flex-1 h-0.5 ${i === 0 ? 'invisible' : done ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    {/* dot */}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                      ${done
                        ? current
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-blue-500 border-blue-500'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {done && !current ? (
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : current ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                    {/* right line */}
                    <div className={`flex-1 h-0.5 ${isLast ? 'invisible' : done && i < activeStep ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  </div>
                  {/* label */}
                  <div className="mt-2 text-center px-1">
                    <p className={`text-xs font-semibold ${done ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(res => setBooking(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load booking details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl px-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error || 'Booking not found'}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const addonsTotal = (booking.addons || []).reduce((sum, a) => sum + Number(a.price), 0);
  // First successful payment's transaction_id
  const paidPayment = (booking.payments || []).find(p => p.payment_status === 'paid');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100
                       dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{booking.booking_id}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Booking details</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* Package */}
        <Section title="Package">
          <InfoRow label="Package Name" value={booking.package_name} />
          <InfoRow label="Destination"  value={`${booking.city}, ${booking.country}`} />
          {booking.description && <InfoRow label="Description" value={booking.description} />}
        </Section>

        {/* Booking info */}
        <Section title="Booking Details">
          <InfoRow label="Travel Date" value={booking.travel_date?.slice(0, 10)} />
          <InfoRow label="Travelers"   value={booking.num_travelers} />
          <InfoRow label="Booked On"   value={booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : null} />
        </Section>

        {/* Add-ons */}
        {booking.addons?.length > 0 && (
          <Section title="Add-ons">
            {booking.addons.map(addon => (
              <div key={addon.addon_id} className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="text-sm text-slate-700 dark:text-slate-300">{addon.name}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">+${Number(addon.price).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-slate-500 dark:text-slate-400">Add-ons total</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">${addonsTotal.toLocaleString()}</span>
            </div>
          </Section>
        )}

        {/* Payment */}
        <Section title="Payment">
          <InfoRow label="Package price (per person)" value={`$${Number(booking.package_price ?? 0).toLocaleString()}`} />
          <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Price</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">
              ${Number(booking.total_price).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span className="text-sm text-slate-500 dark:text-slate-400">Payment Status</span>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${paymentBadgeClass(booking.payment_status)}`}>
              {(booking.payment_status || 'unpaid').charAt(0).toUpperCase() + (booking.payment_status || 'unpaid').slice(1)}
            </span>
          </div>
          {paidPayment && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-slate-500 dark:text-slate-400">Transaction ID</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 font-mono">
                {paidPayment.transaction_id}
              </span>
            </div>
          )}
        </Section>

        {/* Timeline */}
        <BookingTimeline booking={booking} />

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-2">
          {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
            <Link
              to={`/customer/payment/${booking.booking_id}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Pay Now
            </Link>
          )}
          <Link
            to="/customer/bookings"
            className="px-5 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600
                       text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg
                       border border-slate-200 dark:border-slate-600 transition-colors"
          >
            ← Back to My Bookings
          </Link>
        </div>

      </div>
    </div>
  );
}
