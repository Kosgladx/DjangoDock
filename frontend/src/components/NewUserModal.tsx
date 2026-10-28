import React, { useState } from 'react';
import { X, UserPlus, Shield, Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react';
import type { SystemUserAccount } from '../types';
import { api } from '../services/api';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: SystemUserAccount) => void;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'coordinator' | 'teacher'>('coordinator');
  const [department, setDepartment] = useState('Coordenação Pedagógica');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome completo do usuário.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Por favor, informe o e-mail institucional.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const newUser = await api.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim() || 'Geral',
        password: password || '123456',
      });
      onUserCreated(newUser);
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setRole('coordinator');
      setPassword('123456');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Novo Usuário do Sistema</h3>
              <p className="text-xs text-indigo-200">Cadastre um usuário e defina seu perfil de permissão.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Prof. Marcos Andrade ou Dra. Patrícia Gomes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              E-mail Institucional *
            </label>
            <input
              type="email"
              required
              placeholder="Ex: marcos.andrade@escola.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Perfil de Acesso / Nível de Permissão *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'admin'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  {role === 'admin' && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                </div>
                <div className="text-xs font-bold">Administrador</div>
                <div className="text-[10px] text-slate-400">Acesso global</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('coordinator')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'coordinator'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  {role === 'coordinator' && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                </div>
                <div className="text-xs font-bold">Coordenador</div>
                <div className="text-[10px] text-slate-400">Gestão de horários</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  {role === 'teacher' && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                </div>
                <div className="text-xs font-bold">Professor</div>
                <div className="text-[10px] text-slate-400">Quadro e disponib.</div>
              </button>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Departamento / Setor
            </label>
            <input
              type="text"
              placeholder="Ex: Coordenação de Ensino Médio ou Dep. de Matemática"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Senha Provisória
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-9 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">O usuário poderá alterar sua senha após o primeiro acesso.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Usuário</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
