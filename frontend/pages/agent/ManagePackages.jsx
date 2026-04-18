import { useState, useEffect, useRef } from "react";

// ─── Mock API ──────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const mockDB = {
  packages: [
    { id: 1, name: "Paris Adventure", destination: "Paris, France", duration: "7 days", price: 1500, status: "active" },
    { id: 2, name: "Tokyo Explorer", destination: "Tokyo, Japan", duration: "10 days", price: 2800, status: "pending_approval" },
    { id: 3, name: "Maldives Escape", destination: "Maldives", duration: "5 days", price: 3200, status: "active" },
  ],
  bookings: [
    { id: "BK-2026-001", customer: "Sarah Johnson", package: "Paris Adventure", date: "2026-05-15", passengers: 2, total: 3000, status: "pending" },
    { id: "BK-2026-002", customer: "Mike Chen", package: "Tokyo Explorer", date: "2026-06-01", passengers: 1, total: 2800, status: "confirmed" },
    { id: "BK-2026-003", customer: "Layla Hassan", package: "Maldives Escape", date: "2026-07-10", passengers: 3, total: 9600, status: "pending" },
  ],
  cancellations: [
    { id: "CN-001", bookingId: "BK-2026-004", customer: "Omar Khalil", package: "Alps Trek", reason: "Medical emergency", requestedAt: "2026-04-10", status: "pending" },
    { id: "CN-002", bookingId: "BK-2026-005", customer: "Nina Petrov", package: "Santorini Sun", reason: "Schedule conflict", requestedAt: "2026-04-12", status: "pending" },
  ],
  messages: {
    "BK-2026-001": [
      { id: 1, sender: "customer", name: "Sarah Johnson", content: "Hi, can I upgrade to business class?", time: "10:30 AM" },
      { id: 2, sender: "agent", name: "You", content: "Hello Sarah! I'll check availability for you.", time: "10:35 AM" },
      { id: 3, sender: "customer", name: "Sarah Johnson", content: "Thank you! Also, is airport transfer included?", time: "10:40 AM" },
    ],
    "BK-2026-002": [
      { id: 1, sender: "customer", name: "Mike Chen", content: "What's the hotel check-in time?", time: "2:15 PM" },
    ],
    "BK-2026-003": [
      { id: 1, sender: "customer", name: "Layla Hassan", content: "We need a crib for our baby.", time: "9:00 AM" },
      { id: 2, sender: "agent", name: "You", content: "Absolutely, I've noted that for your booking.", time: "9:05 AM" },
    ],
  },
  notifications: [
    { id: 1, type: "booking", message: "New booking request from Sarah Johnson", time: "5 min ago", read: false, bookingId: "BK-2026-001" },
    { id: 2, type: "cancellation", message: "Cancellation request from Omar Khalil", time: "1 hr ago", read: false },
    { id: 3, type: "message", message: "New message from Mike Chen", time: "2 hr ago", read: true },
    { id: 4, type: "booking", message: "Booking confirmed: BK-2026-002", time: "3 hr ago", read: true },
  ],
};

const api = {
  getPackages: async () => { await delay(600); return [...mockDB.packages]; },
  createPackage: async (data) => { await delay(500); const pkg = { ...data, id: Date.now(), status: "pending_approval" }; mockDB.packages.push(pkg); return pkg; },
  updatePackage: async (id, data) => { await delay(500); const i = mockDB.packages.findIndex(p => p.id === id); if (i > -1) mockDB.packages[i] = { ...mockDB.packages[i], ...data, status: "pending_approval" }; return mockDB.packages[i]; },
  deletePackage: async (id) => { await delay(400); mockDB.packages = mockDB.packages.filter(p => p.id !== id); return true; },
  getBookings: async () => { await delay(600); return [...mockDB.bookings]; },
  approveBooking: async (id) => { await delay(400); const b = mockDB.bookings.find(b => b.id === id); if (b) b.status = "confirmed"; return true; },
  declineBooking: async (id) => { await delay(400); const b = mockDB.bookings.find(b => b.id === id); if (b) b.status = "cancelled"; return true; },
  getCancellations: async () => { await delay(600); return [...mockDB.cancellations]; },
  approveCancellation: async (id) => { await delay(400); const c = mockDB.cancellations.find(c => c.id === id); if (c) c.status = "approved"; return true; },
  rejectCancellation: async (id) => { await delay(400); const c = mockDB.cancellations.find(c => c.id === id); if (c) c.status = "rejected"; return true; },
  getMessages: async (bookingId) => { await delay(400); return mockDB.messages[bookingId] || []; },
  sendMessage: async (bookingId, content) => { await delay(300); const msg = { id: Date.now(), sender: "agent", name: "You", content, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }; if (!mockDB.messages[bookingId]) mockDB.messages[bookingId] = []; mockDB.messages[bookingId].push(msg); return msg; },
  getNotifications: async () => { await delay(300); return [...mockDB.notifications]; },
  markNotificationRead: async (id) => { await delay(200); const n = mockDB.notifications.find(n => n.id === id); if (n) n.read = true; return true; },
};

// ─── Shared Components ────────────────────────────────────────────────────────

function Badge({ status }) {
  const map = {
    pending: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    active: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pending_approval: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    approved: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };
  const label = status?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return <span className={map[status] || map.active}>{label}</span>;
}

function Spinner({ size = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${size} text-white`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Confirm Action</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-200">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2">
            {loading && <Spinner />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef();

  useEffect(() => {
    api.getNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const handleClick = async (n) => {
    if (!n.read) {
      await api.markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
  };

  const iconMap = { booking: "📋", cancellation: "🚫", message: "💬" };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No notifications</p>
            ) : notifications.map(n => (
              <button key={n.id} onClick={() => handleClick(n)} className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                <span className="text-base mt-0.5">{iconMap[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{n.time}</p>
                </div>
                {!n.read && <span className="h-2 w-2 bg-blue-500 rounded-full mt-1 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manage Packages ──────────────────────────────────────────────────────────

function ManagePackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPkg, setEditingPkg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ name: "", destination: "", duration: "", price: "" });
  const [formMode, setFormMode] = useState("create");

  useEffect(() => { api.getPackages().then(p => { setPackages(p); setLoading(false); }); }, []);

  const resetForm = () => { setForm({ name: "", destination: "", duration: "", price: "" }); setFormMode("create"); setEditingPkg(null); };

  const handleEdit = (pkg) => {
    setForm({ name: pkg.name, destination: pkg.destination, duration: pkg.duration, price: pkg.price });
    setFormMode("edit");
    setEditingPkg(pkg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (formMode === "create") {
      const newPkg = await api.createPackage(form);
      setPackages(prev => [...prev, newPkg]);
    } else {
      await api.updatePackage(editingPkg.id, form);
      setPackages(prev => prev.map(p => p.id === editingPkg.id ? { ...p, ...form, status: "pending_approval" } : p));
      setSuccessMsg("Update submitted for admin approval");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    setSaving(false);
    resetForm();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    await api.deletePackage(confirmDelete);
    setPackages(prev => prev.filter(p => p.id !== confirmDelete));
    setDeleteLoading(false);
    setConfirmDelete(null);
  };

  const inputCls = "w-full px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Packages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage your travel packages</p>
      </div>

      {successMsg && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Create / Edit Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-5">
          {formMode === "edit" ? `Edit: ${editingPkg?.name}` : "Create New Package"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Package Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Paris Adventure" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination</label>
            <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required placeholder="e.g. Paris, France" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
            <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} required placeholder="e.g. 7 days" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (USD)</label>
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required type="number" placeholder="e.g. 1500" className={inputCls} />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2">
              {saving && <Spinner />}
              {formMode === "edit" ? "Submit Update" : "Create Package"}
            </button>
            {formMode === "edit" && (
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-200">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {["Package", "Destination", "Duration", "Price", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)) :
                packages.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">No packages found</td></tr>
                ) : packages.map(pkg => (
                  <tr key={pkg.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{pkg.name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pkg.destination}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pkg.duration}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">${Number(pkg.price).toLocaleString()}</td>
                    <td className="py-3 px-4"><Badge status={pkg.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(pkg)} className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-medium rounded-lg transition-colors duration-200">Edit</button>
                        <button onClick={() => setConfirmDelete(pkg.id)} className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium rounded-lg transition-colors duration-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this package? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

// ─── Booking Requests ─────────────────────────────────────────────────────────

function BookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => { api.getBookings().then(b => { setBookings(b); setLoading(false); }); }, []);

  const handleAction = async (id, action) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    if (action === "approve") await api.approveBooking(id);
    else await api.declineBooking(id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: action === "approve" ? "confirmed" : "cancelled" } : b));
    setActionLoading(prev => ({ ...prev, [id]: null }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Booking Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and manage incoming booking requests</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {["Booking ID", "Customer", "Package", "Date", "Passengers", "Total", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={8} />) :
                bookings.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">No booking requests</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{b.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{b.customer}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.package}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.date}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{b.passengers}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">${b.total.toLocaleString()}</td>
                    <td className="py-3 px-4"><Badge status={b.status} /></td>
                    <td className="py-3 px-4">
                      {b.status === "pending" ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(b.id, "approve")} disabled={!!actionLoading[b.id]} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-1">
                            {actionLoading[b.id] === "approve" && <Spinner size="h-3 w-3" />} Approve
                          </button>
                          <button onClick={() => handleAction(b.id, "decline")} disabled={!!actionLoading[b.id]} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-1">
                            {actionLoading[b.id] === "decline" && <Spinner size="h-3 w-3" />} Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Cancellations ────────────────────────────────────────────────────────────

function Cancellations() {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => { api.getCancellations().then(c => { setCancellations(c); setLoading(false); }); }, []);

  const handleAction = async (id, action) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    if (action === "approve") await api.approveCancellation(id);
    else await api.rejectCancellation(id);
    setCancellations(prev => prev.map(c => c.id === id ? { ...c, status: action === "approve" ? "approved" : "rejected" } : c));
    setActionLoading(prev => ({ ...prev, [id]: null }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cancellation Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and process customer cancellation requests</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {["ID", "Booking", "Customer", "Package", "Reason", "Requested", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 2 }).map((_, i) => <SkeletonRow key={i} cols={8} />) :
                cancellations.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">No cancellation requests</td></tr>
                ) : cancellations.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{c.id}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{c.bookingId}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{c.customer}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.package}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">{c.reason}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.requestedAt}</td>
                    <td className="py-3 px-4"><Badge status={c.status} /></td>
                    <td className="py-3 px-4">
                      {c.status === "pending" ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(c.id, "approve")} disabled={!!actionLoading[c.id]} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-1">
                            {actionLoading[c.id] === "approve" && <Spinner size="h-3 w-3" />} Approve
                          </button>
                          <button onClick={() => handleAction(c.id, "reject")} disabled={!!actionLoading[c.id]} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-1">
                            {actionLoading[c.id] === "reject" && <Spinner size="h-3 w-3" />} Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Messaging ────────────────────────────────────────────────────────────────

function Messaging() {
  const [selectedBooking, setSelectedBooking] = useState("BK-2026-001");
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  const bookingList = [
    { id: "BK-2026-001", customer: "Sarah Johnson", last: "Also, is airport transfer included?" },
    { id: "BK-2026-002", customer: "Mike Chen", last: "What's the hotel check-in time?" },
    { id: "BK-2026-003", customer: "Layla Hassan", last: "I've noted that for your booking." },
  ];

  useEffect(() => {
    setLoadingMsgs(true);
    api.getMessages(selectedBooking).then(m => { setMessages(m); setLoadingMsgs(false); });
  }, [selectedBooking]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    const msg = await api.sendMessage(selectedBooking, input.trim());
    setMessages(prev => [...prev, msg]);
    setInput("");
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Messages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Chat with customers about their bookings</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col md:flex-row" style={{ height: "520px" }}>
        {/* Thread list */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversations</p>
          </div>
          {bookingList.map(b => (
            <button key={b.id} onClick={() => setSelectedBooking(b.id)} className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 border-b border-slate-50 dark:border-slate-700/50 transition-colors ${selectedBooking === b.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"}`}>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{b.customer}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{b.id}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{b.last}</p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{bookingList.find(b => b.id === selectedBooking)?.customer}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{selectedBooking}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === "agent" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.sender === "agent" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm"}`}>
                  <p className="text-sm leading-snug">{m.content}</p>
                  <p className={`text-[11px] mt-1 ${m.sender === "agent" ? "text-blue-200" : "text-slate-400 dark:text-slate-500"}`}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input — sticky on mobile */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky bottom-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
              <button onClick={handleSend} disabled={sending || !input.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 shrink-0">
                {sending ? <Spinner /> : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layout / Nav ─────────────────────────────────────────────────────────────

const NAV = [
  { id: "packages", label: "Packages", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { id: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: "cancellations", label: "Cancellations", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
  { id: "messaging", label: "Messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
];

export default function AgentDashboard() {
  const [page, setPage] = useState("packages");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const pages = { packages: <ManagePackages />, bookings: <BookingRequests />, cancellations: <Cancellations />, messaging: <Messaging /> };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 font-sans`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top navbar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">PolarisTech</span>
              <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-600 pl-3 ml-1">Agent Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => setDark(!dark)} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Toggle dark mode">
              {dark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <div className="h-7 w-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-400">A</div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "flex" : "hidden"} md:flex flex-col w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-56px)] shrink-0 fixed md:sticky top-14 z-30`}>
          <nav className="flex-1 p-3 space-y-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => { setPage(n.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${page === n.id ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
                </svg>
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {pages[page]}
        </main>
      </div>
    </div>
  );
}