import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Role dashboards
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import RequestForm from './pages/employee/RequestForm';
import EditRequest from './pages/employee/EditRequest';
import HodDashboard from './pages/hod/HodDashboard';
import GmHrDashboard from './pages/gmhr/GmHrDashboard';
import CooDashboard from './pages/coo/CooDashboard';
import GarageDashboard from './pages/garage/GarageDashboard';
import VehicleHistory from './pages/garage/VehicleHistory';
import DriverManagement from './pages/garage/DriverManagement';
import MaintenanceManagement from './pages/garage/MaintenanceManagement';
import FuelManagement from './pages/garage/FuelManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageEmployees from './pages/admin/ManageEmployees';
import AuditLogs from './pages/admin/AuditLogs';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import RequestDetails from './pages/shared/RequestDetails';
import RequestHistory from './pages/shared/RequestHistory';
import ApprovalHistory from './pages/shared/ApprovalHistory';
import Delegations from './pages/shared/Delegations';
import VehicleManagement from './pages/admin/VehicleManagement';
import DestinationManagement from './pages/admin/DestinationManagement';

// Phase 2 Page Imports
import SecurityDashboard from './pages/phase2/SecurityDashboard';
import FleetOperations from './pages/phase2/FleetOperations';
import TravelHistory from './pages/phase2/TravelHistory';
import FleetAnalytics from './pages/phase2/FleetAnalytics';
import BillingManagement from './pages/phase2/BillingManagement';
import PaymentManagement from './pages/phase2/PaymentManagement';

/**
 * Redirect /dashboard to the appropriate role-based page.
 */
function DashboardRedirect() {
  const { user } = useAuth();
  const roleRoutes = {
    Employee: '/employee',
    HOD: '/hod',
    'GM-HR': '/gmhr',
    COO: '/coo',
    Garage: '/garage',
    Admin: '/admin',
    'Security Guard': '/security/gate',
  };
  return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
      } />

      {/* Employee routes */}
      <Route element={<ProtectedRoute allowedRoles={['Employee', 'HOD', 'GM-HR', 'COO', 'Garage', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/requests/:id" element={<RequestDetails />} />
        <Route path="/requests/edit/:id" element={<EditRequest />} />
        <Route path="/requests/history" element={<RequestHistory />} />
        <Route path="/requisitions" element={<Navigate to="/requests/history" replace />} />
        <Route path="/requisitions/new" element={<Navigate to="/employee/new-request" replace />} />
        <Route path="/requisitions/:id" element={<Navigate to="/requests/:id" replace />} />
        <Route path="/approvals" element={<DashboardRedirect />} />
        <Route path="/reports" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />
        <Route path="/notifications" element={<Navigate to="/dashboard" replace />} />
        <Route path="/employee/travel-ledger" element={<TravelHistory />} />
      </Route>

      {/* Restricted Delegations Route */}
      <Route element={<ProtectedRoute allowedRoles={['HOD', 'GM-HR', 'COO', 'Garage', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/delegations" element={<Delegations />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Employee']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/new-request" element={<RequestForm />} />
      </Route>

      {/* HOD routes */}
      <Route element={<ProtectedRoute allowedRoles={['HOD']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/hod" element={<HodDashboard />} />
        <Route path="/hod/approvals" element={<HodDashboard />} />
        <Route path="/hod/history" element={<ApprovalHistory />} />
        <Route path="/hod/new-request" element={<RequestForm />} />
      </Route>

      {/* GM-HR routes */}
      <Route element={<ProtectedRoute allowedRoles={['GM-HR']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/gmhr" element={<GmHrDashboard />} />
        <Route path="/gmhr/approvals" element={<GmHrDashboard />} />
        <Route path="/gmhr/history" element={<ApprovalHistory />} />
        <Route path="/gmhr/new-request" element={<RequestForm />} />
      </Route>

      {/* COO routes */}
      <Route element={<ProtectedRoute allowedRoles={['COO']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/coo" element={<CooDashboard />} />
        <Route path="/coo/approvals" element={<CooDashboard />} />
        <Route path="/coo/history" element={<ApprovalHistory />} />
        <Route path="/coo/new-request" element={<RequestForm />} />
      </Route>

      {/* Garage routes */}
      <Route element={<ProtectedRoute allowedRoles={['Garage', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/garage" element={<GarageDashboard />} />
        <Route path="/garage/history" element={<VehicleHistory />} />
        <Route path="/garage/drivers" element={<DriverManagement />} />
        <Route path="/garage/maintenance" element={<MaintenanceManagement />} />
        <Route path="/garage/fuel" element={<FuelManagement />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<ManageEmployees />} />
        <Route path="/admin/users" element={<Navigate to="/admin/employees" replace />} />
        <Route path="/admin/drivers" element={<DriverManagement />} />
        <Route path="/admin/vehicles" element={<VehicleManagement />} />
        <Route path="/admin/destinations" element={<DestinationManagement />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Security Guard routes */}
      <Route element={<ProtectedRoute allowedRoles={['Security Guard', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/security/gate" element={<SecurityDashboard />} />
      </Route>

      {/* Fleet Operations */}
      <Route element={<ProtectedRoute allowedRoles={['Garage', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/garage/fleet-operations" element={<FleetOperations />} />
      </Route>

      {/* Fleet Analytics */}
      <Route element={<ProtectedRoute allowedRoles={['HOD', 'GM-HR', 'COO', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/fleet-analytics" element={<FleetAnalytics />} />
      </Route>

      {/* Admin Billing and Payments */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin/billing" element={<BillingManagement />} />
        <Route path="/admin/payments" element={<PaymentManagement />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
