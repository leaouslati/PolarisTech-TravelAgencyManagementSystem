import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import api from '../../api/axios';

const roleColors = {
  Customer:      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  TravelAgent:   'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Administrator: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const statusColors = {
  Active:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Deleted:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const selectCls =
  'px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';

function ConfirmModal({ title, message, error, onConfirm, onCancel, danger = false, loading = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{message}</p>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${danger ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'}`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await api.put(`/admin/users/${user.user_id}`, { role, status });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function DeactivateModal({ user, error, loading, onConfirm, onCancel }) {
  const hasBookings = user.active_booking_count > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          Deactivate User
        </h3>

        {/* USER INFO */}
        <div className="mb-4">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {user.full_name}
          </p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <p className="text-xs text-slate-400">Role: {user.role}</p>
          <p className="text-xs text-slate-400">
            Active bookings: {user.active_booking_count}
          </p>
        </div>

        {/* WARNING */}
        {hasBookings ? (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">
            This user cannot be deactivated while they have active bookings.
          </div>
        ) : (
          <div className="bg-yellow-100 text-yellow-700 p-3 rounded-lg text-sm mb-4">
            This will deactivate the account.
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-200 rounded-lg">
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading || hasBookings}
            className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:bg-red-300"
          >
            {loading ? 'Processing...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit User</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.full_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="Customer">Customer</option>
              <option value="TravelAgent">TravelAgent</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TH = 'text-left py-3 px-4 text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wide';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.append('role', roleFilter);
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/admin/users?${params.toString()}`)
      .then(res => setUsers(res.data.data || []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/users/${deleteTarget.user_id}`);
      setDeleteTarget(null);
      showToast('User deactivated successfully');
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || '';
      setDeleteError(
        msg.toLowerCase().includes('active booking')
          ? 'This user has active bookings and cannot be deactivated.'
          : 'Could not deactivate user. Please try again.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-black dark:text-white">Manage Users</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2">View and manage all platform accounts</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
              <option value="">All Roles</option>
              <option value="Customer">Customer</option>
              <option value="TravelAgent">Travel Agent</option>
              <option value="Administrator">Administrator</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Deleted">Deleted</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/40">
                    <th className={TH}>Name</th>
                    <th className={TH}>Email</th>
                    <th className={TH}>Role</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Bookings</th>
                    <th className={TH}>Joined</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map(u => (
                    <tr key={u.user_id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{u.full_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">@{u.username}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[u.role] || 'bg-slate-100 text-slate-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[u.status] || 'bg-slate-100 text-slate-700'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.active_booking_count}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setEditTarget(u)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Edit
                          </button>
                          {u.status !== 'Deleted' && (
                            <button
                              onClick={() => { setDeleteTarget(u); setDeleteError(''); }}
                              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <EditModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); showToast('User updated successfully'); fetchUsers(); }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Deactivate User"
          message={`Deactivate ${deleteTarget.full_name}? This cannot be undone.`}
          error={deleteError}
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
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
