import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoginCard } from '@/components/login/LoginCard';

const Login = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAnimating = useAuthStore((state) => state.isAnimating);
  const isFirstLogin = useAuthStore((state) => state.isFirstLogin);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated && !isAnimating) {
      if (isFirstLogin) {
        navigate('/definir-senha', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAnimating, isFirstLogin, navigate]);

  return <LoginCard />;
};

export default Login;
