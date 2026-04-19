import { useState } from 'react';
import api from '../../api/axios';

const formatCurrency = (num) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num || 0); 


export default function Reports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!startDate || !endDate) return 'Both start date and end date are required.';
    if (new Date(startDate) > new Date(endDate)) return 'Start date cannot be after end date.';
    return '';
  };

  const handleGenerate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    setReport(null);
    try {
      const res = await api.get(`/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
      setReport(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Revenue Reports</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2">Generate revenue breakdowns by date range</p>
        </div>

        {/* Date Range Picker */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Date Range</p>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
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
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        {/* Report Results */}
        {report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
              {[
                { label: 'Total Revenue', value: formatCurrency(report.total_revenue), color: 'border-l-green-500' },
                { label: 'Total Bookings', value: formatCurrency(report.total_bookings), color: 'border-l-blue-500' },
                { label: 'Confirmed', value: formatCurrency(report.confirmed_bookings), color: 'border-l-emerald-500' },
                { label: 'Cancelled', value: formatCurrency(report.cancelled_bookings), color: 'border-l-red-500' },
              ].map(card => (
                <div key={card.label} className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${card.color} shadow-sm p-5`}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Breakdown Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Revenue by Package</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {new Date(report.startDate).toLocaleDateString()} – {new Date(report.endDate).toLocaleDateString()}
                </p>
              </div>
              {report.breakdown.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400">No revenue data in this date range</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-left">Package</th>
                        <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-center">Bookings</th>
                        <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-right">Revenue</th>
                        <th className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide py-3 px-4 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.breakdown.map((row, i) => {
                        const pct = report.total_revenue > 0
                          ? ((Number(row.revenue) / Number(report.total_revenue)) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors border-b border-slate-50 dark:border-slate-700/50">
                            <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{row.package_name}</td>
                            <td className="py-3 px-4 text-sm text-center text-slate-600 dark:text-slate-300">{row.booking_count}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 text-right">${Number(row.revenue).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-500 h-1.5 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-300 w-10 text-right">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
