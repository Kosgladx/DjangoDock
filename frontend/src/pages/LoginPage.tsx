import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { MeshGradient } from '@paper-design/shaders-react';
import logoIpsumUrl from '../assets/logoIpsum.svg';

export interface UserSession {
  name: string;
  email: string;
  role: 'coordinator' | 'admin' | 'teacher';
  roleLabel: string;
  avatarInitials: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
}

const DEMO_ACCOUNTS: UserSession[] = [
  {
    name: 'Prof. Carlos Eduardo',
    email: 'coordenacao@escola.edu.br',
    role: 'coordinator',
    roleLabel: 'Coordenador Pedagógico',
    avatarInitials: 'CE',
  },
  {
    name: 'Dra. Helena Ramos',
    email: 'admin@escola.edu.br',
    role: 'admin',
    roleLabel: 'Administrador do Sistema',
    avatarInitials: 'HR',
  },
  {
    name: 'Profª. Mariana Costa',
    email: 'mariana.costa@escola.edu.br',
    role: 'teacher',
    roleLabel: 'Docente Titular',
    avatarInitials: 'MC',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('coordenacao@escola.edu.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail institucional.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Simulate fast authenticated login
    setTimeout(() => {
      const matchingAccount = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.toLowerCase().trim()
      );
      const user: UserSession = matchingAccount || {
        name: email
          .split('@')[0]
          .replace('.', ' ')
          .replace(/^./, (c) => c.toUpperCase()),
        email: email.trim(),
        role: 'coordinator',
        roleLabel: 'Coordenador Pedagógico',
        avatarInitials: email.slice(0, 2).toUpperCase(),
      };

      if (rememberMe) {
        localStorage.setItem('eduschedule_user', JSON.stringify(user));
      }

      setLoading(false);
      onLoginSuccess(user);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row p-4 sm:p-5 lg:p-6 gap-6 lg:gap-8">
      {/* Left Hero Panel */}
      <section className="relative lg:w-[54%] min-h-[340px] sm:min-h-[420px] lg:min-h-0 rounded-2xl overflow-hidden bg-secondary flex flex-col justify-between p-7 sm:p-10 lg:p-12 shadow-xl">
        {/* Paper Shaders MeshGradient Background */}
        <MeshGradient
          colors={['#f7f8fd', '#241d9a', '#5c83fa', '#9f50d3']}
          distortion={0.8}
          swirl={0.1}
          grainMixer={0}
          grainOverlay={0}
          speed={1}
          scale={1}
          rotation={0}
          offsetX={0}
          offsetY={0}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Subtle readability gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/40 via-secondary/10 to-secondary/50"
        />

        {/* Top Headline */}
        <div className="relative z-10 max-w-xl">
          <p className="text-sm sm:text-base font-normal text-white/85 mb-3">
            Você pode
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-medium text-white leading-[1.18] tracking-tight">
            Resolver demandas de gestão de horários e salas escolares com a praticidade de um único clique.
          </h1>
        </div>

        {/* Bottom Institutions Strip */}
        <div className="relative z-10 pt-10 space-y-5">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-white/35" />
            <p className="text-xs sm:text-sm font-normal text-white/80 text-center whitespace-nowrap">
              Instituições que escolheram praticidade
            </p>
            <span className="h-px flex-1 bg-white/35" />
          </div>

          <div className="ds-logo-marquee w-full pb-1">
            <div className="ds-logo-track items-center">
              {[0, 1].map((groupIndex) => (
                <div
                  key={groupIndex}
                  aria-hidden={groupIndex === 1}
                  className="flex items-center shrink-0 gap-6 sm:gap-9 lg:gap-11 pr-6 sm:pr-9 lg:pr-11"
                >
                  <img
                    src={logoIpsumUrl}
                    alt={groupIndex === 0 ? 'Logoipsum' : ''}
                    className="h-4 sm:h-5 lg:h-6 w-auto shrink-0 opacity-95"
                  />
                  <img
                    src={logoIpsumUrl}
                    alt={groupIndex === 0 ? 'Logoipsum' : ''}
                    className="h-4 sm:h-5 lg:h-6 w-auto shrink-0 opacity-95"
                  />
                  <img
                    src={logoIpsumUrl}
                    alt={groupIndex === 0 ? 'Logoipsum' : ''}
                    className="h-4 sm:h-5 lg:h-6 w-auto shrink-0 opacity-95"
                  />
                  <img
                    src={logoIpsumUrl}
                    alt={groupIndex === 0 ? 'Logoipsum' : ''}
                    className="h-4 sm:h-5 lg:h-6 w-auto shrink-0 opacity-95"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Right Login Form Panel */}
      <section className="flex-1 flex items-center justify-center py-6 sm:py-10 px-2 sm:px-6">
        <div className="w-full max-w-[400px] space-y-7">
          <div>
            <h2 className="text-2xl sm:text-[32px] font-medium text-ink tracking-tight leading-tight">
              Bem vindo de volta!
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 font-normal">
              Acesse sua conta para continuar
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-ink mb-2"
              >
                E-mail Institucional
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail institucional..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-ink placeholder:text-slate-400 placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-ink"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'Para redefinir sua senha, solicite suporte à administração escolar.'
                    )
                  }
                  className="text-xs font-medium text-primary hover:text-primary-hover transition cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha de acesso..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-ink placeholder:text-slate-400 placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
              />
              <span>Lembrar do meu acesso</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 bg-primary hover:bg-primary-hover disabled:opacity-75 text-white rounded-lg text-sm font-medium shadow-sm transition cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Acessar minha conta</span>
              )}
            </button>

            <p className="text-center text-xs sm:text-sm text-slate-500 pt-1">
              Não tem uma conta ?{' '}
              <button
                type="button"
                onClick={() =>
                  alert(
                    'Para solicitar um novo cadastro, entre em contato com a administração escolar.'
                  )
                }
                className="text-primary hover:text-primary-hover font-medium transition cursor-pointer"
              >
                Cadastre-se
              </button>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};
