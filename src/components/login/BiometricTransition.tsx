import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

interface BiometricTransitionProps {
  isActive: boolean;
  onComplete: () => void;
}

export const BiometricTransition = ({ isActive, onComplete }: BiometricTransitionProps) => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const setAnimating = useAuthStore((state) => state.setAnimating);

  useEffect(() => {
    if (!isActive) return;
    setVisible(true);

    const timer = setTimeout(() => {
      setAnimating(false);
      navigate('/', { replace: true });
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [isActive, navigate, onComplete, setAnimating]);

  return (
    <AnimatePresence>
      {visible && isActive && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
        />
      )}
    </AnimatePresence>
  );
};
