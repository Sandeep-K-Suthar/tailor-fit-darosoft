import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>; // Or a proper spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminDashboard />;
}
