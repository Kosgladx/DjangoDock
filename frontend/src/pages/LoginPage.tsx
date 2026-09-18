import React, { useState } from 'react';
import {
  Calendar, Lock, Mail, Eye, EyeOff, LogIn, Sparkles, ArrowRight
} from 'lucide-react';

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
      const matchingAccount = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase().trim());
      const user: UserSession = matchingAccount || {
        name: email.split('@')[0].replace('.', ' ').replace(/^./, c => c.toUpperCase()),
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

  const handleQuickLogin = (account: UserSession) => {
    setEmail(account.email);
    setPassword('123456');
    setLoading(true);
    setTimeout(() => {
      if (rememberMe) {
        localStorage.setItem('eduschedule_user', JSON.stringify(account));
      }
      setLoading(false);
      onLoginSuccess(account);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-4 border border-indigo-400/30">
          <Calendar className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          EduSchedule AI
        </h1>
        <p className="mt-1 text-xs text-indigo-200 font-medium">
          Sistema Inteligente de Resolução de Horários Escolares (Timetabling)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl border border-white/20 sm:px-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">Acesse sua Conta</h2>
            <p className="text-xs text-slate-500">Entre com suas credenciais institucionais para gerenciar as grades.</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: coordenacao@escola.edu.br"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>Lembrar meu acesso</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Para redefinir sua senha, solicite suporte à administração escolar.')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition cursor-pointer"
              >
                Esqueci a senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Acesso Rápido de Demonstração</span>
              </span>
              <span className="text-[10px] text-slate-400">1-clique</span>
            </div>

            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickLogin(account)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                      {account.avatarInitials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {account.name}
                      </p>
                      <p className="text-[10px] text-slate-500">{account.roleLabel}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-indigo-200/60 mt-6">
          EduSchedule AI • Engenharia de Software & Timetabling Problem • 2026
        </p>
      </div>
    </div>
  );
};
