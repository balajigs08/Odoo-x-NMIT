import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ActivateAccount from "./pages/auth/ActivateAccount";
import ReviewLeave from "./pages/auth/ReviewLeave";

import EmployeeDashboard from "./pages/employee/Dashboard";
import Profile from "./pages/employee/Profile";
import Attendance from "./pages/employee/Attendance";
import Leave from "./pages/employee/Leave";
import Payroll from "./pages/employee/Payroll";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminEmployeeDetail from "./pages/admin/AdminEmployeeDetail";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminLeave from "./pages/admin/AdminLeave";
import AdminPayroll from "./pages/admin/AdminPayroll";
import AdminReports from "./pages/admin/AdminReports";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* 1. Public Landing Page — When application starts, it MUST open Landing Page first */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<SignIn />} />
      <Route path="/sign-in" element={<Navigate to="/login" replace />} />
      
      <Route path="/signup" element={<SignUp />} />
      <Route path="/sign-up" element={<Navigate to="/signup" replace />} />
      
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/activate-account" element={<ActivateAccount />} />
      <Route path="/review-leave" element={<ReviewLeave />} />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allow={["EMPLOYEE"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={<Navigate to="/employee/dashboard" replace />}
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allow={["EMPLOYEE", "ADMIN"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute allow={["EMPLOYEE"]}>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <ProtectedRoute allow={["EMPLOYEE"]}>
            <Leave />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute allow={["EMPLOYEE"]}>
            <Payroll />
          </ProtectedRoute>
        }
      />

      {/* HR / Admin Routes */}
      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={<Navigate to="/hr/dashboard" replace />}
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminEmployees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees/:id"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminEmployeeDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leave"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminLeave />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payroll"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminPayroll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
