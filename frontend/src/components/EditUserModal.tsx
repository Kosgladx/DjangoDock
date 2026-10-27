import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, GraduationCap, School, Eye, EyeOff, Loader2, AlertCircle, Check, Key } from 'lucide-react';
import type { SystemUserAccount } from '../types';
import { api } from '../services/api';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SystemUserAccount | null;
  onUserUpdated: (updatedUser: SystemUserAccount) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'coordinator' | 'teacher'>('coordinator');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setEmail(user.email || user.username || '');
      setRole((user.role as any) || 'coordinator');
      setDepartment(user.department || '');
      setIsActive(user.is_active);
      setPassword('');
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome completo.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Por favor, informe o e-mail institucional.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload: {
        name: string;
        email: string;
        role: string;
        department: string;
        is_active: boolean;
        password?: string;
      } = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim() || 'Geral',
        is_active: isActive,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const updatedUser = await api.updateUser(user.id, payload);
      onUserUpdated(updatedUser);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md font-bold text-white text-sm">
              {user.avatar_initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Editar Usuário</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                  ID #{user.id}
                </span>
              </div>
              <p className="text-xs text-indigo-200">Atualize os dados, perfil de permissão e status da conta.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 animate-in fade-in">
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
              placeholder="Ex: Dra. Helena Ramos ou Prof. Carlos Mendes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              E-mail Institucional / Identificador *
            </label>
            <input
              type="email"
              required
              placeholder="Ex: helena.ramos@ugb.br"
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
              {/* Admin */}
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'admin'
                    ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-200 text-purple-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Shield className="w-4 h-4 text-purple-600" />
                  {role === 'admin' && <Check className="w-3.5 h-3.5 text-purple-600 font-bold" />}
                </div>
                <div className="text-xs font-bold">Administrador</div>
                <div className="text-[10px] text-slate-400">Acesso global irrestrito</div>
              </button>

              {/* Coordinator */}
              <button
                type="button"
                onClick={() => setRole('coordinator')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'coordinator'
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-200 text-blue-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <School className="w-4 h-4 text-blue-600" />
                  {role === 'coordinator' && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
                </div>
                <div className="text-xs font-bold">Coordenador</div>
                <div className="text-[10px] text-slate-400">Gestão de horários/turmas</div>
              </button>

              {/* Teacher */}
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-200 text-emerald-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  {role === 'teacher' && <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
                </div>
                <div className="text-xs font-bold">Professor</div>
                <div className="text-[10px] text-slate-400">Disponibilidade e horários</div>
              </button>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Departamento / Lotação
            </label>
            <input
              type="text"
              placeholder="Ex: Direção Geral, Coordenação de Engenharia, etc."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Account Status Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Status de Ativação da Conta</span>
              <p className="text-[11px] text-slate-500">
                {isActive ? 'O usuário pode efetuar login e utilizar o sistema normalmente.' : 'Conta bloqueada temporariamente para acesso.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-rose-100 text-rose-700 border border-rose-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isActive ? 'Ativa' : 'Bloqueada'}</span>
            </button>
          </div>

          {/* Optional New Password */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Nova Senha (deixe em branco para não alterar)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite para redefinir a senha do usuário"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
