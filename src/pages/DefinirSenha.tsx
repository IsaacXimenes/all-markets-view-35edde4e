import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const DefinirSenha = () => {
  const navigate = useNavigate();
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const ok = await updatePassword(data.password);
    if (ok) {
      toast.success('Senha definida com sucesso!');
      navigate('/', { replace: true });
    } else {
      toast.error('Erro ao definir senha. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className={cn("w-full", isMobile ? "px-6 max-w-[85vw]" : "max-w-md")}>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-8 w-8 text-[#F7BB05]" />
          <h1 className={cn("font-black text-[#F7BB05] tracking-tighter uppercase", isMobile ? "text-2xl" : "text-3xl")}>
            Definir Senha
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>
          Este é seu primeiro acesso. Defina uma senha segura para continuar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nova Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Nova Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className={cn(
                  'w-full rounded-xl pl-11 pr-12 text-white text-sm py-3.5',
                  'border border-white/10 outline-none transition-all duration-300',
                  'focus:border-[#F7BB05] focus:shadow-[0_0_0_3px_rgba(247,187,5,0.15)]',
                  errors.password && 'border-red-500/50'
                )}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs pl-1">{errors.password.message}</p>}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Confirmar Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                className={cn(
                  'w-full rounded-xl pl-11 pr-4 text-white text-sm py-3.5',
                  'border border-white/10 outline-none transition-all duration-300',
                  'focus:border-[#F7BB05] focus:shadow-[0_0_0_3px_rgba(247,187,5,0.15)]',
                  errors.confirmPassword && 'border-red-500/50'
                )}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.07)' }}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs pl-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full rounded-xl font-bold text-base tracking-wide py-4 transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:shadow-[0_0_25px_rgba(247,187,5,0.45)] hover:brightness-110',
                'active:scale-[0.98]'
              )}
              style={{ backgroundColor: '#F7BB05', color: '#111111' }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DefinirSenha;
