import { useEffect, useState } from 'react';
import { CalendarCheck, MapPin, DollarSign } from 'lucide-react';
import api from '../../api/axios';

const inputCls =
  'w-full px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 transition-colors duration-200';

const GENDER_OPTIONS = ['', 'Male', 'Female', 'Other', 'Prefer not to say'];

function EditModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name:     profile.full_name     || '',
    username:      profile.username      || '',
    email:         profile.email         || '',
    phone:         profile.phone         || '',
    address:       profile.address       || '',
    gender:        profile.gender        || '',
    date_of_birth: profile.date_of_birth ? profile.date_of_birth.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={set('full_name')} className={inputCls} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={set('username')} className={inputCls} placeholder="username" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+961 70 000 000" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Address</label>
            <input type="text" value={form.address} onChange={set('address')} className={inputCls} placeholder="Street, City, Country" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Gender</label>
              <select value={form.gender} onChange={set('gender')} className={inputCls}>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g || 'Select gender'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={inputCls} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="py-3 px-4 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300">{value || <span className="text-slate-400 dark:text-slate-500 italic">Not set</span>}</p>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState({ bookings: 0, confirmed: 0, spent: 0 });

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => setProfile(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/bookings/my')
      .then(res => {
        const data = res.data.data || [];
        const confirmed = data.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
        const spent = data
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + Number(b.total_price || 0), 0);
        setStats({ bookings: data.length, confirmed, spent });
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaved = (updated) => {
    setProfile(updated);
    setEditing(false);
    showToast('Profile updated successfully');
  };

  const roleColors = {
    Customer:      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    TravelAgent:   'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Administrator: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };

  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.bookings,
      Icon: CalendarCheck,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-900/40',
      colSpan: 1,
    },
    {
      label: 'Confirmed Trips',
      value: stats.confirmed,
      Icon: MapPin,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-900/40',
      colSpan: 1,
    },
    {
      label: 'Total Spent',
      value: `$${stats.spent.toLocaleString()}`,
      Icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-900/40',
      colSpan: 2,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-black dark:text-white">My Profile</h1>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-2">View and manage your account details</p>
          </div>
          {profile && (
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Stat Cards moved inside avatar card */}

        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-64 animate-pulse" />
        ) : !profile ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center text-sm text-slate-400">
            Failed to load profile
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Avatar card with stat cards inside */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{profile.full_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
              <span className={`mt-3 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${roleColors[profile.role] || 'bg-slate-100 text-slate-700'}`}>
                {profile.role}
              </span>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
              {/* Stat Cards inside avatar card */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {statCards.map(({ label, value, Icon, color, bg, border, colSpan }) => (
                  <div
                    key={label}
                    className={`${bg} border ${border} rounded-xl p-4 flex items-center gap-3 shadow-sm ${colSpan === 2 ? 'sm:col-span-2' : ''}`}
                  >
                    <div className={`p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Account Details</p>
              </div>
              <Field label="Full Name" value={profile.full_name} />
              <Field label="Username" value={profile.username} />
              <Field label="Email" value={profile.email} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Address" value={profile.address} />
              <Field label="Gender" value={profile.gender} />
              <Field label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null} />
            </div>
          </div>
        )}
      </div>

      {editing && profile && (
        <EditModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
