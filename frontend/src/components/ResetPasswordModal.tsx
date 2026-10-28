import React, { useState } from 'react';
import { X, KeyRound, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { SystemUserAccount } from '../types';
import { api } from '../services/api';

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: SystemUserAccount | null;
  onClose: () => void;
  onPasswordReset?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
  onPasswordReset,
}) => {
  const [newPassword, setNewPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setErrorMessage('Por favor, informe uma senha válida.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.resetUserPassword(user.id, newPassword.trim());
      setSuccessMessage(res.message || `A senha de ${user.full_name} foi resetada.`);
      if (onPasswordReset) onPasswordReset();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Resetar Senha de Acesso</h3>
              <p className="text-xs text-slate-500">Defina uma nova senha temporária para o usuário.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User info box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user.avatar_initials}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email} • {user.role_label}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Nova Senha Provisória</label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Gerar Aleatória</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Informe esta senha ao usuário para que ele realize o login e troque suas credenciais.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
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
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Confirmar Nova Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
