import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isFirstLogin = useAuthStore((state) => state.isFirstLogin);
  const initialize = useAuthStore((state) => state.initialize);
  const { canAccessRoute } = useUserPermissions();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F7BB05]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isFirstLogin) {
    return <Navigate to="/definir-senha" replace />;
  }

  // Block unauthorized routes — redirect to Dashboard
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
