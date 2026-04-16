import { useMemo, useState } from 'react';
import api from '../../api/axios';

const mockPackage = {
  package_id: 1,
  package_name: 'Paris Escape',
  destination: 'Paris, France',
  price: 1500,
  addons: [
    { addon_id: 1, addon_name: 'Airport Transfer', price: 50 },
    { addon_id: 2, addon_name: 'Guided City Tour', price: 120 },
    { addon_id: 3, addon_name: 'Travel Insurance', price: 80 }
  ]
};

export default function Booking() {
  const [step, setStep] = useState(1);
  const [travelDate, setTravelDate] = useState('');
  const [numTravelers, setNumTravelers] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const packageData = mockPackage;

  const addonObjects = packageData.addons.filter((addon) =>
    selectedAddons.includes(addon.addon_id)
  );

  const totalPrice = useMemo(() => {
    const addonsTotal = addonObjects.reduce((sum, addon) => sum + addon.price, 0);
    return packageData.price * Number(numTravelers) + addonsTotal;
  }, [addonObjects, numTravelers, packageData.price]);

  const handleNextFromStep1 = () => {
    const newErrors = {};

    if (!travelDate) newErrors.travelDate = 'Travel date is required';
    if (!numTravelers || Number(numTravelers) < 1) {
      newErrors.numTravelers = 'Number of travelers must be at least 1';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      setSubmitError('');

      const res = await api.post('/bookings', {
        package_id: packageData.package_id,
        travel_date: travelDate,
        num_travelers: Number(numTravelers),
        addon_ids: selectedAddons
      });

      setSuccessData(res.data.data);
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };
// Success screen after booking is submitted
  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h1 className="mb-4 text-2xl font-bold text-slate-800 dark:text-white">
            Booking Submitted
          </h1>
          <p className="mb-2 text-slate-600 dark:text-slate-300">
            Your booking is submitted and pending agent approval.
          </p>
          <p className="font-semibold text-blue-600 dark:text-blue-400">
            Booking ID: {successData.booking_id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Book Your Trip
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-300">
            {packageData.package_name} — {packageData.destination}
          </p>
          <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
            ${packageData.price} per traveler
          </p>
        </div>

        <div className="mb-8 flex items-center gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                step === item
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              Step {item}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Travel Date
              </label>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              {errors.travelDate && (
                <p className="mt-1 text-sm text-red-600">{errors.travelDate}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Number of Travelers
              </label>
              <input
                type="number"
                min="1"
                value={numTravelers}
                onChange={(e) => setNumTravelers(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              {errors.numTravelers && (
                <p className="mt-1 text-sm text-red-600">{errors.numTravelers}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNextFromStep1}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {packageData.addons.map((addon) => (
                <label
                  key={addon.addon_id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(addon.addon_id)}
                      onChange={() => toggleAddon(addon.addon_id)}
                    />
                    <span className="text-slate-800 dark:text-white">
                      {addon.addon_name}
                    </span>
                  </div>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    ${addon.price}
                  </span>
                </label>
              ))}
            </div>

            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-700">
              <p className="text-slate-800 dark:text-white">
                Total: <span className="font-bold">${totalPrice}</span>
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
              <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">
                Review and Confirm
              </h2>

              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <p><strong>Package:</strong> {packageData.package_name}</p>
                <p><strong>Destination:</strong> {packageData.destination}</p>
                <p><strong>Travel Date:</strong> {travelDate}</p>
                <p><strong>Travelers:</strong> {numTravelers}</p>
                <div>
                  <strong>Add-ons:</strong>
                  <ul className="mt-2 list-disc pl-5">
                    {addonObjects.length > 0 ? (
                      addonObjects.map((addon) => (
                        <li key={addon.addon_id}>
                          {addon.addon_name} - ${addon.price}
                        </li>
                      ))
                    ) : (
                      <li>No add-ons selected</li>
                    )}
                  </ul>
                </div>
                <p className="pt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                  Total Price: ${totalPrice}
                </p>
              </div>
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-medium text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Back
              </button>

              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}