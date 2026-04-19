import { useState } from 'react';
import api from '../../api/axios';

function SummaryCard({ title, value, color = 'blue' }) {
  const colorMap = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${colorMap[color]} shadow-sm p-5`}
    >
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!startDate || !endDate) {
      return 'Both start date and end date are required.';
    }
    if (new Date(startDate) > new Date(endDate)) {
      return 'Start date cannot be after end date.';
    }
    return '';
  };

  const handleGenerate = async () => {
    setSubmitted(true);
    const err = validate();

    if (err) {
      setInlineError(err);
      setApiError('');
      setReport(null);
      return;
    }

    setInlineError('');
    setApiError('');
    setLoading(true);
    setReport(null);

    try {
      const res = await api.get('/admin/reports/revenue', {
        params: { startDate, endDate },
      });
      setReport(res.data.data || null);
    } catch (e) {
      setApiError(e.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const breakdown = report?.breakdown || [];
  const totalRevenue = Number(report?.total_revenue || 0);

  const noData =
    submitted &&
    report &&
    Number(report.total_bookings || 0) === 0 &&
    Number(report.confirmed_bookings || 0) === 0 &&
    Number(report.cancelled_bookings || 0) === 0 &&
    totalRevenue === 0 &&
    breakdown.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Revenue Reports</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2">
            Generate revenue breakdowns by date range
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Date Range
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (submitted) setInlineError(validate());
                }}
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (submitted) setInlineError(validate());
                }}
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition shrink-0"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {inlineError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{inlineError}</p>
          )}

          {apiError && (
            <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {apiError}
            </div>
          )}
        </div>

        {report && !noData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
              <SummaryCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                color="green"
              />
              <SummaryCard
                title="Total Bookings"
                value={Number(report.total_bookings || 0).toLocaleString()}
                color="blue"
              />
              <SummaryCard
                title="Confirmed Bookings"
                value={Number(report.confirmed_bookings || 0).toLocaleString()}
                color="yellow"
              />
              <SummaryCard
                title="Cancelled Bookings"
                value={Number(report.cancelled_bookings || 0).toLocaleString()}
                color="red"
              />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Revenue by Package
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {new Date(report.startDate).toLocaleDateString()} –{' '}
                  {new Date(report.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-left">
                        Package Name
                      </th>
                      <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-center">
                        Booking Count
                      </th>
                      <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-right">
                        Revenue
                      </th>
                      <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-right">
                        % of Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {breakdown.map((row, i) => {
                      const revenue = Number(row.revenue || 0);
                      const pct =
                        totalRevenue > 0
                          ? ((revenue / totalRevenue) * 100).toFixed(1)
                          : '0.0';

                      return (
                        <tr
                          key={row.package_id || i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-b border-slate-50 dark:border-slate-700/50"
                        >
                          <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {row.package_name}
                          </td>
                          <td className="py-3 px-4 text-sm text-center text-slate-600 dark:text-slate-300">
                            {row.booking_count}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 text-right">
                            ${revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(Number(pct), 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-slate-600 dark:text-slate-300 w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {noData && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center text-sm text-slate-400 dark:text-slate-500">
            No data found for this date range
          </div>
        )}
      </div>
    </div>
  );
}