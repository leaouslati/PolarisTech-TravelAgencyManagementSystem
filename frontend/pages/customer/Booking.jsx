import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const inputClass =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500 ' +
  'transition-colors duration-200';

const STEPS = ['Travel Details', 'Select Add-ons', 'Review & Confirm'];

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgError, setPkgError] = useState('');

  const [step, setStep] = useState(1);
  const [travelDate, setTravelDate] = useState('');
  const [numTravelers, setNumTravelers] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    api
      .get(`/packages/${id}`)
      .then((res) => setPkg(res.data.data))
      .catch(() => setPkgError('Package not found. Please go back and try again.'))
      .finally(() => setPkgLoading(false));
  }, [id]);

  const addons = pkg?.add_ons ?? [];

  const selectedAddonObjects = useMemo(
    () => addons.filter((addon) => selectedAddons.includes(addon.addon_id)),
    [addons, selectedAddons]
  );

  const totalPrice = useMemo(() => {
    if (!pkg) return 0;
    const addonsTotal = selectedAddonObjects.reduce((sum, addon) => sum + Number(addon.price), 0);
    return Number(pkg.total_price) * Number(numTravelers) + addonsTotal;
  }, [pkg, selectedAddonObjects, numTravelers]);

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleNextFromStep1 = () => {
    const newErrors = {};

    if (!travelDate) newErrors.travelDate = 'Travel date is required';
    if (!numTravelers || Number(numTravelers) < 1) {
      newErrors.numTravelers = 'At least 1 traveler is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const handleConfirmBooking = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setSubmitError('');

      const res = await api.post('/bookings', {
        package_id: Number(id),
        travel_date: travelDate,
        num_travelers: Number(numTravelers),
        addon_ids: selectedAddons
      });

      setSuccessData(res.data.data);
    } catch (error) {
      setSubmitError(
        error.response?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (pkgLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (pkgError || !pkg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">{pkgError}</p>
          <button
            onClick={() => navigate('/customer/browse')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Booking Submitted
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Your booking is pending agent approval.
          </p>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 px-5 py-4 mb-6 text-left space-y-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Booking ID</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                {successData.booking_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Package</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {pkg.package_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Travel Date</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {travelDate}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Price</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                ${Number(successData.total_price).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Pending agent approval
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/customer/payment/${successData.booking_id}`)}
            className="block w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors mb-3"
          >
            Proceed to Payment
          </button>

          <Link
            to="/customer/bookings"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Book Your Trip
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {pkg.package_name} — {pkg.destination.city}, {pkg.destination.country}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="mb-8">
                <div className="sm:hidden text-sm font-medium text-slate-700 dark:text-slate-200">
                  Step {step} of 3 — {STEPS[step - 1]}
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  {STEPS.map((label, i) => {
                    const num = i + 1;
                    const active = step === num;
                    const done = step > num;

                    return (
                      <div key={num} className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                          ${
                            done
                              ? 'bg-green-500 text-white'
                              : active
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {done ? (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            num
                          )}
                        </div>

                        <span
                          className={`text-sm truncate ${
                            active
                              ? 'font-medium text-slate-800 dark:text-slate-100'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {label}
                        </span>

                        {i < STEPS.length - 1 && (
                          <div
                            className={`h-px flex-1 mx-1 ${
                              done ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-600'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Travel Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className={inputClass}
                    />
                    {errors.travelDate && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.travelDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Number of Travelers <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numTravelers}
                      onChange={(e) => setNumTravelers(e.target.value)}
                      className={inputClass}
                    />
                    {errors.numTravelers && (
                      <p className="mt-1.5 text-xs text-red-500">{errors.numTravelers}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextFromStep1}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {addons.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                      No add-ons available for this package.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {addons.map((addon) => {
                        const checked = selectedAddons.includes(addon.addon_id);

                        return (
                          <label
                            key={addon.addon_id}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors
                              ${
                                checked
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAddon(addon.addon_id)}
                                className="w-4 h-4 accent-blue-600"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {addon.name}
                              </span>
                            </div>

                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              +${Number(addon.price).toLocaleString()}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Selected add-ons: {selectedAddonObjects.length}
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      ← Back
                    </button>

                    <button
                      onClick={() => setStep(3)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Row label="Package" value={pkg.package_name} />
                    <Row label="Destination" value={`${pkg.destination.city}, ${pkg.destination.country}`} />
                    <Row label="Travel Date" value={travelDate} />
                    <Row label="Travelers" value={numTravelers} />
                  </div>

                  {selectedAddonObjects.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                        Selected Add-ons
                      </p>
                      <div className="space-y-1.5">
                        {selectedAddonObjects.map((addon) => (
                          <div
                            key={addon.addon_id}
                            className="flex justify-between text-sm text-slate-600 dark:text-slate-300"
                          >
                            <span>{addon.name}</span>
                            <span className="font-medium">
                              +${Number(addon.price).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Total Price
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ${totalPrice.toLocaleString()}
                    </span>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
                      {submitError}
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                    >
                      ← Back
                    </button>

                    <button
                      onClick={handleConfirmBooking}
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading && <Spinner />}
                      {loading ? 'Submitting…' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sticky top-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Package Summary
              </p>

              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                {pkg.package_name}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {pkg.destination.city}, {pkg.destination.country}
              </p>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Price per traveler</span>
                  <span className="font-medium">${Number(pkg.total_price).toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Travelers</span>
                  <span className="font-medium">{numTravelers}</span>
                </div>

                {selectedAddonObjects.map((addon) => (
                  <div
                    key={addon.addon_id}
                    className="flex justify-between text-xs text-slate-500 dark:text-slate-400"
                  >
                    <span>{addon.name}</span>
                    <span>+${Number(addon.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>

              {pkg.available_slots <= 5 && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Only {pkg.available_slots} slot{pkg.available_slots !== 1 ? 's' : ''} left!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  );
}