import React, { useState, useEffect } from 'react';
import { X, Clock, Coffee, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { Shift, TimeSlot } from '../types';
import { api } from '../services/api';

interface NewSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  activeShiftId?: number;
  existingSlotsCount?: number;
  onSlotCreated: (slot: TimeSlot) => void;
}

export const NewSlotModal: React.FC<NewSlotModalProps> = ({
  isOpen,
  onClose,
  shifts,
  activeShiftId,
  existingSlotsCount = 0,
  onSlotCreated,
}) => {
  const [shiftId, setShiftId] = useState<number>(activeShiftId || shifts[0]?.id || 1);
  const [order, setOrder] = useState<number>(existingSlotsCount + 1);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('07:15');
  const [endTime, setEndTime] = useState('08:05');
  const [durationMinutes, setDurationMinutes] = useState<number>(50);
  const [isBreak, setIsBreak] = useState(false);
  const [allowDoubleLesson, setAllowDoubleLesson] = useState(true);
  const [requiresLab, setRequiresLab] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeShiftId) setShiftId(activeShiftId);
      const nextOrder = existingSlotsCount + 1;
      setOrder(nextOrder);
      setName(`${nextOrder}º Período`);
      setIsBreak(false);
      setAllowDoubleLesson(true);
      setRequiresLab(false);
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, activeShiftId, existingSlotsCount]);

  // Recalculate duration when times change
  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
        const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMinutes > 0) {
          setDurationMinutes(totalMinutes);
        }
      }
    }
  }, [startTime, endTime]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do slot/período.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload: Partial<TimeSlot> = {
        shift: Number(shiftId),
        order: Number(order) || 1,
        name: name.trim(),
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        duration_minutes: Number(durationMinutes) || 50,
        is_break: isBreak,
        allow_double_lesson: allowDoubleLesson,
        requires_lab: requiresLab,
      };

      const newSlot = await api.createSlot(payload);
      onSlotCreated(newSlot);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar slot de aula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Período / Slot</h2>
              <p className="text-xs text-slate-500">Configure um tempo de aula ou intervalo no turno escolar.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Turno</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ordem na Grade</label>
              <input
                type="number"
                min={1}
                max={20}
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Slot <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 1º Período, Intervalo / Recreio, 6º Tempo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Início</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Término</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (min)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 50)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Type toggles & options */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <label className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isBreak}
                onChange={(e) => {
                  setIsBreak(e.target.checked);
                  if (e.target.checked) {
                    setName('Intervalo / Recreio');
                    setDurationMinutes(20);
                  }
                }}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="flex items-center space-x-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                <span>É Intervalo / Pausa Pedagógica (Recreio)</span>
              </span>
            </label>

            {!isBreak && (
              <>
                <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDoubleLesson}
                    onChange={(e) => setAllowDoubleLesson(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Permitir geminação com período anterior/seguinte</span>
                </label>

                <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresLab}
                    onChange={(e) => setRequiresLab(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Priorizar ambientes laboratoriais ou especializados</span>
                </label>
              </>
            )}
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
                  <span>Adicionar Slot</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
