import { useEffect, useState } from 'react';
import axios from 'axios';

const moodsList = ['Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic'];

const ManagePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ moods: [] });
  const [editingId, setEditingId] = useState(null);

  const fetchPackages = async () => {
    try {
      const res = await axios.get('/api/agent/packages');
      setPackages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMoodChange = (mood) => {
    const current = form.moods;
    setForm({
      ...form,
      moods: current.includes(mood)
        ? current.filter(m => m !== mood)
        : [...current, mood]
    });
  };

  const validate = () => {
    if (!form.package_name || !form.destination_id || !form.travel_date || !form.return_date || !form.total_price || !form.available_slots) {
      alert('All fields are required');
      return false;
    }
    if (form.total_price <= 0) {
      alert('Price must be positive');
      return false;
    }
    if (new Date(form.travel_date) <= new Date()) {
      alert('Travel date must be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingId) {
        await axios.put(`/api/agent/packages/${editingId}`, form);
        alert('Update submitted for admin approval');
      } else {
        await axios.post('/api/agent/packages', form);
      }

      setForm({ moods: [] });
      setEditingId(null);
      fetchPackages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg.package_id);
    setForm({
      package_name: pkg.package_name,
      destination_id: '',
      travel_date: pkg.travel_date,
      return_date: '',
      duration: '',
      total_price: pkg.total_price,
      description: '',
      available_slots: pkg.available_slots,
      moods: []
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    await axios.delete(`/api/agent/packages/${id}`);
    fetchPackages();
  };

  const getStatusBadge = (status) => {
    const base = "px-2.5 py-0.5 text-xs font-medium rounded-full";

    if (status === 'active')
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;

    if (status === 'pending_approval')
      return `${base} bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`;

    if (status === 'inactive')
      return `${base} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;

    return base;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Manage Packages
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create and manage your travel packages
        </p>
      </div>

      {/* Create Button */}
      <button
        onClick={() => setForm({ moods: [] })}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
      >
        Create New Package
      </button>

      {/* Table */}
      <div className="overflow-x-auto mt-6">
        {loading ? (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 mb-2 rounded w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              No packages found
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Package','Destination','Date','Price','Slots','Status','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {packages.map(pkg => (
                <tr
                  key={pkg.package_id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {pkg.package_name}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {pkg.destination.city}, {pkg.destination.country}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {pkg.travel_date}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    ${pkg.total_price}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {pkg.available_slots}
                  </td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadge(pkg.status_availability)}>
                      {pkg.status_availability}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.package_id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Input label="Package Name" name="package_name" value={form.package_name} onChange={handleChange} />

          <Select label="Destination" name="destination_id" value={form.destination_id} onChange={handleChange} />

          <Input type="date" label="Travel Date" name="travel_date" value={form.travel_date} onChange={handleChange} />

          <Input type="date" label="Return Date" name="return_date" value={form.return_date} onChange={handleChange} />

          <Input label="Duration (days)" name="duration" value={form.duration} onChange={handleChange} />

          <Input label="Price" name="total_price" value={form.total_price} onChange={handleChange} />

          <Input label="Available Slots" name="available_slots" value={form.available_slots} onChange={handleChange} />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Moods */}
        <div className="mt-4 flex flex-wrap gap-3">
          {moodsList.map(m => (
            <label key={m} className="text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="mr-1"
                checked={form.moods.includes(m)}
                onChange={() => handleMoodChange(m)}
              />
              {m}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          {editingId ? 'Update Package' : 'Create Package'}
        </button>
      </form>
    </div>
  );
};

// Reusable Input
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <input
      {...props}
      value={props.value || ''}
      className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg
      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500"
    />
  </div>
);

// Reusable Select
const Select = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <select
      {...props}
      className="w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg
      dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
    >
      <option value="">Select destination</option>
      <option value="1">Paris, France</option>
      <option value="2">Rome, Italy</option>
      <option value="3">Tokyo, Japan</option>
      <option value="4">Dubai, UAE</option>
      <option value="5">New York, USA</option>
      <option value="6">London, UK</option>
      <option value="7">Bali, Indonesia</option>
    </select>
  </div>
);

export default ManagePackages;