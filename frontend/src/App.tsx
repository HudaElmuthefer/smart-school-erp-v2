import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginScreen from './pages/LoginScreen';
import DashboardShell from './pages/DashboardShell';
import SettingsPage from './pages/SettingsPage';
import SchoolsPage from './pages/SchoolsPage';
import AcademicStructurePage from './pages/AcademicStructurePage';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import AttendancePage from './pages/AttendancePage';
import GradesPage from './pages/GradesPage';
import AssignmentsPage from './pages/AssignmentsPage';
import LmsPage from './pages/LmsPage';
import StaffPage from './pages/StaffPage';
import FinancePage from './pages/FinancePage';
import InstallmentsPage from './pages/InstallmentsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginScreen /></PublicOnlyRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardShell /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/schools" element={<ProtectedRoute><SchoolsPage /></ProtectedRoute>} />
      <Route path="/academic-structure" element={<ProtectedRoute><AcademicStructurePage /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><TeachersPage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
      <Route path="/lms" element={<ProtectedRoute><LmsPage /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
      <Route path="/installments" element={<ProtectedRoute><InstallmentsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
