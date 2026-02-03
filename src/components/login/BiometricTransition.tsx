import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Phone3D } from './Phone3D';
import { cn } from '@/lib/utils';

type AnimationPhase = 'idle' | 'fadeOut' | 'centering' | 'scanning' | 'expanding' | 'complete';

interface BiometricTransitionProps {
  isActive: boolean;
  onComplete: () => void;
}

export const BiometricTransition = ({ isActive, onComplete }: BiometricTransitionProps) => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const navigate = useNavigate();
  const setAnimating = useAuthStore((state) => state.setAnimating);

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    // Sequência de animação
    const timeline = async () => {
      // Fase 1: Fade out do formulário (mais suave)
      setPhase('fadeOut');
      await delay(400);

      // Fase 2: Celular centraliza e aumenta (mais lento)
      setPhase('centering');
      await delay(800);

      // Fase 3: Animação Face ID (mais tempo para ver)
      setPhase('scanning');
      await delay(1600);

      // Fase 4: Expansão da tela (mais dramático)
      setPhase('expanding');
      await delay(1000);

      // Fase 5: Completo
      setPhase('complete');
      setAnimating(false);
      
      // Navegar para o dashboard
      navigate('/', { replace: true });
      onComplete();
    };

    timeline();
  }, [isActive, navigate, onComplete, setAnimating]);

  if (!isActive && phase === 'idle') return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white',
        'transition-all duration-700 ease-out',
        phase === 'complete' && 'opacity-0 pointer-events-none'
      )}
    >
      {/* Phone Animation Container */}
      <div
        className={cn(
          'transition-all ease-out',
          phase === 'fadeOut' && 'opacity-100 duration-400',
          phase === 'centering' && 'scale-110 duration-700',
          phase === 'scanning' && 'scale-125 duration-500',
          phase === 'expanding' && 'scale-[30] opacity-0 duration-1000'
        )}
      >
        <Phone3D
          animationPhase={
            phase === 'centering' ? 'centering' :
            phase === 'scanning' ? 'scanning' :
            phase === 'expanding' ? 'expanding' :
            'idle'
          }
          isAnimating={isActive}
        />
      </div>


      {/* Success Indicator */}
      {phase === 'expanding' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-scale-in">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
