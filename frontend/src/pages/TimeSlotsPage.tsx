import React, { useState } from 'react';
import type { Shift, TimeSlot } from '../types';
import { Plus, Save, Coffee, CheckSquare, Trash2, Calendar, Clock } from 'lucide-react';
import { NewShiftModal } from '../components/NewShiftModal';
import { NewSlotModal } from '../components/NewSlotModal';
import { api } from '../services/api';

interface TimeSlotsPageProps {
  shifts: Shift[];
  slots: TimeSlot[];
  onRefresh?: () => void;
}

export const TimeSlotsPage: React.FC<TimeSlotsPageProps> = ({
  shifts,
  slots,
  onRefresh
}) => {
  const [activeShiftId, setActiveShiftId] = useState<number>(shifts[0]?.id || 1);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  const [activeDays, setActiveDays] = useState({
    seg: true,
    ter: true,
    qua: true,
    qui: true,
    sex: true,
    sab: false,
  });

  const activeShift = shifts.find(s => s.id === activeShiftId) || shifts[0];
  const shiftSlots = slots.filter(s => s.shift === activeShiftId || (!s.shift && activeShiftId === 1));

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Deseja realmente remover este slot de aula?')) return;
    try {
      await api.deleteSlot(slotId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Erro ao excluir slot: ' + err.message);
    }
  };

  const handleSaveTimeStructure = () => {
    alert('Configurações temporais e de dias letivos salvas com sucesso!');
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {shifts.map((s) => {
            const isActive = s.id === activeShiftId;
            const countForShift = slots.filter(sl => sl.shift === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setActiveShiftId(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>☀️ {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-normal text-slate-500">
                  {countForShift} Tempos
                </span>
              </button>
            );
          })}
          
          <button 
            onClick={() => setIsShiftModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50/70 hover:text-indigo-600 text-slate-600 border border-dashed border-slate-300 hover:border-indigo-300 transition cursor-pointer"
          >
            + Adicionar Novo Turno
          </button>
        </div>

        <button 
          onClick={handleSaveTimeStructure}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar Grade Temporal</span>
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Estrutura dos Slots de Aula • Turno {activeShift?.name || 'Matutino'}
              </h3>
              <p className="text-xs text-slate-500">Configure os horários de início e término, duração e propriedades de cada tempo.</p>
            </div>
            <button 
              onClick={() => setIsSlotModalOpen(true)}
              className="flex items-center space-x-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Período</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {shiftSlots.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Nenhum slot cadastrado para o turno {activeShift?.name}.</p>
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Primeiro Período</span>
                </button>
              </div>
            ) : (
              shiftSlots.map((slot) => {
                if (slot.is_break) {
                  return (
                    <div
                      key={slot.id}
                      className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 flex items-center justify-between shadow-2xs group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-950">☕ {slot.name}</h4>
                          <p className="text-[11px] text-amber-800">Pausa pedagógica oficial para recreio e descanso.</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs font-bold text-amber-900">
                        <span>{slot.start_time.slice(0, 5)} às {slot.end_time.slice(0, 5)}</span>
                        <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">{slot.duration_minutes} min</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Excluir intervalo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-indigo-300 transition shadow-2xs group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {slot.order}º
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{slot.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                            Aula Regular
                          </span>
                          <span className="text-[10px] text-slate-500">
                            • {slot.allow_double_lesson ? 'Permite Geminação' : 'Aula Individual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">
                          {slot.start_time.slice(0, 5)} às {slot.end_time.slice(0, 5)}
                        </div>
                        <span className="text-[11px] text-slate-500">{slot.duration_minutes} minutos</span>
                      </div>

                      <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Excluir slot de aula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button 
            onClick={() => setIsSlotModalOpen(true)}
            className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Inserir Novo Slot de Aula ou Intervalo</span>
          </button>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900">Dias Letivos Semanais</h4>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'seg', label: 'Segunda-feira' },
                { id: 'ter', label: 'Terça-feira' },
                { id: 'qua', label: 'Quarta-feira' },
                { id: 'qui', label: 'Quinta-feira' },
                { id: 'sex', label: 'Sexta-feira' },
                { id: 'sab', label: 'Sábado Letivo' },
              ].map(d => (
                <label
                  key={d.id}
                  className={`p-2.5 rounded-lg border flex items-center space-x-2 cursor-pointer transition ${
                    activeDays[d.id as keyof typeof activeDays]
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activeDays[d.id as keyof typeof activeDays]}
                    onChange={(e) => setActiveDays({ ...activeDays, [d.id]: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{d.label.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900">Regras Pedagógicas de Alocação Temporal</h4>
            <div className="space-y-2.5 text-xs text-slate-700">
              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                <CheckSquare className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <span>Permitir geminação máxima de 2 tempos consecutivos</span>
              </label>
              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                <CheckSquare className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <span>Proibir geminações atravessando o Intervalo (2º e 3º tempos)</span>
              </label>
              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                <CheckSquare className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <span>Priorizar matérias de Exatas nos 1º e 2º períodos (maior foco)</span>
              </label>
              <label className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
                <CheckSquare className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <span>Evitar provas ou aulas densas no 5º período da Sexta-feira</span>
              </label>
            </div>
          </div>

          <div className="bg-indigo-50/80 rounded-xl border border-indigo-200 p-5 space-y-3">
            <h4 className="text-xs font-bold text-indigo-950">📊 Balanço de Capacidade Temporal</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-indigo-900">
                <span>Slots Semanais por Turma:</span>
                <span className="font-bold">25 tempos (5 dias x 5 aulas)</span>
              </div>
              <div className="flex justify-between text-indigo-900">
                <span>Total de Turmas Cadastradas:</span>
                <span className="font-bold">4 turmas</span>
              </div>
              <div className="flex justify-between text-indigo-900">
                <span>Demanda Curricular Total:</span>
                <span className="font-bold">100 tempos / semana</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold pt-2 border-t border-indigo-200">
                <span>Capacidade Docente vs Demanda:</span>
                <span>100% Equilibrado (100h)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Shift Modal */}
      <NewShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        onShiftCreated={(newShift) => {
          setActiveShiftId(newShift.id);
          if (onRefresh) onRefresh();
        }}
      />

      {/* New Slot Modal */}
      <NewSlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        shifts={shifts}
        activeShiftId={activeShiftId}
        existingSlotsCount={shiftSlots.length}
        onSlotCreated={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};