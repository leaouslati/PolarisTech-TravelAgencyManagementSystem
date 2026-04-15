
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';

// Auth pages

import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import OTP from '../pages/auth/OTP';
import ResetPassword from '../pages/auth/ResetPassword';

// Customer pages
import CustomerDashboard from '../pages/customer/Dashboard';
import Browse from '../pages/customer/Browse';
import PackageDetail from '../pages/customer/PackageDetail';
import Wishlist from '../pages/customer/Wishlist';
import Profile from '../pages/customer/Profile';
import Booking from '../pages/customer/Booking';
import Payment from '../pages/customer/Payment';
import MyBookings from '../pages/customer/MyBookings';
import BookingDetail from '../pages/customer/BookingDetail';

// Agent pages
import AgentDashboard from '../pages/agent/Dashboard';
import ManagePackages from '../pages/agent/ManagePackages';
import BookingRequests from '../pages/agent/BookingRequests';
import Cancellations from '../pages/agent/Cancellations';
import Messages from '../pages/agent/Messages';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import Monitoring from '../pages/admin/Monitoring';
import Reports from '../pages/admin/Reports';
import PackageUpdates from '../pages/admin/PackageUpdates';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Customer */}
          <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={['Customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/browse" element={<ProtectedRoute allowedRoles={['Customer']}><Browse /></ProtectedRoute>} />
          <Route path="/customer/packages/:id" element={<ProtectedRoute allowedRoles={['Customer']}><PackageDetail /></ProtectedRoute>} />
          <Route path="/customer/wishlist" element={<ProtectedRoute allowedRoles={['Customer']}><Wishlist /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['Customer']}><Profile /></ProtectedRoute>} />
          <Route path="/customer/book/:id" element={<ProtectedRoute allowedRoles={['Customer']}><Booking /></ProtectedRoute>} />
          <Route path="/customer/payment/:bookingId" element={<ProtectedRoute allowedRoles={['Customer']}><Payment /></ProtectedRoute>} />
          <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['Customer']}><MyBookings /></ProtectedRoute>} />
          <Route path="/customer/bookings/:id" element={<ProtectedRoute allowedRoles={['Customer']}><BookingDetail /></ProtectedRoute>} />

          {/* Agent */}
          <Route path="/agent/dashboard" element={<ProtectedRoute allowedRoles={['TravelAgent']}><AgentDashboard /></ProtectedRoute>} />
          <Route path="/agent/packages" element={<ProtectedRoute allowedRoles={['TravelAgent']}><ManagePackages /></ProtectedRoute>} />
          <Route path="/agent/bookings" element={<ProtectedRoute allowedRoles={['TravelAgent']}><BookingRequests /></ProtectedRoute>} />
          <Route path="/agent/cancellations" element={<ProtectedRoute allowedRoles={['TravelAgent']}><Cancellations /></ProtectedRoute>} />
          <Route path="/agent/messages/:bookingId" element={<ProtectedRoute allowedRoles={['TravelAgent']}><Messages /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Administrator']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Administrator']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={['Administrator']}><Monitoring /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['Administrator']}><Reports /></ProtectedRoute>} />
          <Route path="/admin/package-updates" element={<ProtectedRoute allowedRoles={['Administrator']}><PackageUpdates /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;