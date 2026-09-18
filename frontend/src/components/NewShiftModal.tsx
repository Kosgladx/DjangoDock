import React, { useState } from 'react';
import { X, Sun, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { Shift } from '../types';
import { api } from '../services/api';

interface NewShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftCreated: (shift: Shift) => void;
}

export const NewShiftModal: React.FC<NewShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftCreated,
}) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('18:00');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do turno.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload: Partial<Shift> = {
        name: name.trim(),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      };

      const newShift = await api.createShift(payload);
      onShiftCreated(newShift);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Turno</h2>
              <p className="text-xs text-slate-500">Cadastre um período letivo para o calendário escolar.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Turno <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Vespertino, Noturno, Integral"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário de Início <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário de Término <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

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
              className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Turno</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
