import React, { useState } from 'react';
import type { Teacher, TimeSlot } from '../types';
import { api } from '../services/api';
import { Search, Plus, Save, CheckCircle2, Download, Users } from 'lucide-react';
import { NewTeacherModal } from '../components/NewTeacherModal';
import { ImportTeachersCSVModal } from '../components/ImportTeachersCSVModal';

interface TeachersPageProps {
  teachers: Teacher[];
  slots: TimeSlot[];
  onRefresh: () => void;
}

const dayNames: Record<number, string> = {
  0: 'Seg',
  1: 'Ter',
  2: 'Qua',
  3: 'Qui',
  4: 'Sex',
};

const shiftLabels: Record<string, string> = {
  ANY: 'Qualquer',
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noite',
};

export const TeachersPage: React.FC<TeachersPageProps> = ({
  teachers,
  slots,
  onRefresh
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(teachers[0]?.id || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'medio' | 'blocked'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  const handleTeacherCreated = (newTeacher: Teacher) => {
    setSelectedTeacherId(newTeacher.id);
    onRefresh();
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  // Local availability state map: key `${day_of_week}_${slot_id}` -> status
  const [availMap, setAvailMap] = useState<Record<string, 'FREE' | 'PREFERENTIAL' | 'BLOCKED'>>(() => {
    const map: Record<string, 'FREE' | 'PREFERENTIAL' | 'BLOCKED'> = {};
    selectedTeacher?.availabilities?.forEach(a => {
      map[`${a.day_of_week}_${a.time_slot}`] = a.status;
    });
    return map;
  });

  React.useEffect(() => {
    if (selectedTeacher) {
      const map: Record<string, 'FREE' | 'PREFERENTIAL' | 'BLOCKED'> = {};
      selectedTeacher.availabilities?.forEach(a => {
        map[`${a.day_of_week}_${a.time_slot}`] = a.status;
      });
      setAvailMap(map);
    }
  }, [selectedTeacherId, selectedTeacher]);

  const days = [
    { id: 0, name: 'Seg' },
    { id: 1, name: 'Ter' },
    { id: 2, name: 'Qua' },
    { id: 3, name: 'Qui' },
    { id: 4, name: 'Sex' },
  ];

  const regularSlots = slots.filter(s => !s.is_break);

  const toggleSlotStatus = (day: number, slotId: number) => {
    const key = `${day}_${slotId}`;
    const current = availMap[key] || 'FREE';
    let next: 'FREE' | 'PREFERENTIAL' | 'BLOCKED' = 'PREFERENTIAL';
    if (current === 'FREE') next = 'PREFERENTIAL';
    else if (current === 'PREFERENTIAL') next = 'BLOCKED';
    else next = 'FREE';

    setAvailMap(prev => ({ ...prev, [key]: next }));
  };

  const handleSaveAvailability = async () => {
    if (!selectedTeacher) return;
    setIsSaving(true);
    try {
      const payload: Array<{ day_of_week: number; time_slot_id: number; status: string }> = [];
      days.forEach(d => {
        regularSlots.forEach(s => {
          const key = `${d.id}_${s.id}`;
          payload.push({
            day_of_week: d.id,
            time_slot_id: s.id,
            status: availMap[key] || 'FREE'
          });
        });
      });
      await api.updateTeacherAvailability(selectedTeacher.id, payload);
      alert('Disponibilidade do professor salva com sucesso!');
      onRefresh();
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to dynamically calculate teacher status and badge
  const getTeacherStatus = (teacher: Teacher) => {
    const isSelected = teacher.id === selectedTeacherId;
    const blockedDaysSet = new Set<number>();
    const prefDaysSet = new Set<number>();
    let totalBlocked = 0;

    if (isSelected && availMap) {
      Object.entries(availMap).forEach(([key, status]) => {
        const [dayStr] = key.split('_');
        const day = parseInt(dayStr, 10);
        if (status === 'BLOCKED') {
          blockedDaysSet.add(day);
          totalBlocked++;
        } else if (status === 'PREFERENTIAL') {
          prefDaysSet.add(day);
        }
      });
    } else if (teacher.availabilities && teacher.availabilities.length > 0) {
      teacher.availabilities.forEach((a) => {
        if (a.status === 'BLOCKED') {
          blockedDaysSet.add(a.day_of_week);
          totalBlocked++;
        } else if (a.status === 'PREFERENTIAL') {
          prefDaysSet.add(a.day_of_week);
        }
      });
    }

    if (blockedDaysSet.size > 0) {
      const sortedDays = Array.from(blockedDaysSet).sort().map(d => dayNames[d] || `Dia ${d}`);
      const label = sortedDays.length <= 2 
        ? `Bloqueio ${sortedDays.join(' e ')}.`
        : `${totalBlocked} Bloqueios (${sortedDays.slice(0, 2).join(', ')}...)`;
      return {
        label,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }

    if (prefDaysSet.size > 0) {
      const sortedDays = Array.from(prefDaysSet).sort().map(d => dayNames[d] || `Dia ${d}`);
      const label = sortedDays.length <= 2
        ? `Pref. ${sortedDays.join(' e ')}.`
        : `Pref. (${sortedDays.length} dias)`;
      return {
        label,
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }

    return {
      label: '100% Disponível',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterCategory === 'blocked') {
      const status = getTeacherStatus(t);
      return status.label.startsWith('Bloqueio') || status.label.includes('Bloqueios');
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Bar */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar docente por nome, disciplina ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                filterCategory === 'all' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Todos ({teachers.length})
            </button>
            <button
              onClick={() => setFilterCategory('medio')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                filterCategory === 'medio' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Ensino Médio
            </button>
            <button
              onClick={() => setFilterCategory('blocked')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                filterCategory === 'blocked' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Com Bloqueios
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800 font-semibold space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Carga Curricular Coberta (280h/sem)</span>
          </div>

          <button 
            onClick={() => setIsCSVModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Importar CSV</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Professor</span>
          </button>
        </div>
      </section>

      {/* 2. Main Content Split: Left Table & Right Availability Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Teachers Data Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Lista de Professores Cadastrados ({teachers.length})</h3>
            <p className="text-xs text-slate-500">Selecione um docente para visualizar e parametrizar a matriz de disponibilidade ao lado.</p>
          </div>

          <div className="overflow-x-auto divide-y divide-slate-100">
            {filteredTeachers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <div>
                  <p className="text-xs font-semibold text-slate-600">Nenhum professor encontrado</p>
                  <p className="text-[11px] text-slate-400">Tente ajustar a busca ou cadastre um novo professor.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Professor</span>
                </button>
              </div>
            ) : (
              filteredTeachers.map((t) => {
              const isSelected = t.id === selectedTeacherId;
              const statusInfo = getTeacherStatus(t);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {t.photo ? (
                      <img
                        src={t.photo}
                        alt={t.name}
                        className="w-9 h-9 rounded-full object-cover shadow-xs border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
                        style={{ backgroundColor: `${t.color}20`, color: t.color }}
                      >
                        {t.avatar_initials}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                      <p className="text-[11px] text-slate-500">{t.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800">
                      {t.max_weekly_hours} aulas / sem
                    </div>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right: Teacher Availability Matrix (5 cols) */}
        {selectedTeacher && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            {/* Teacher Quick Card */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center space-x-3.5">
              {selectedTeacher.photo ? (
                <img
                  src={selectedTeacher.photo}
                  alt={selectedTeacher.name}
                  className="w-12 h-12 rounded-full object-cover shadow-xs border-2 border-indigo-200 shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-xs shrink-0"
                  style={{ backgroundColor: `${selectedTeacher.color}25`, color: selectedTeacher.color }}
                >
                  {selectedTeacher.avatar_initials}
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-indigo-950">{selectedTeacher.name}</h4>
                <p className="text-xs text-indigo-700">
                  Carga: {selectedTeacher.max_weekly_hours} tempos/semana • Turno: {shiftLabels[selectedTeacher.shift_preference] || selectedTeacher.shift_preference || 'Qualquer'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-slate-900">Matriz Semanal de Disponibilidade</h4>
                <span className="text-[10px] text-slate-400">Clique para alternar status</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">Define os bloqueios rígidos e preferências de horários para o algoritmo.</p>

              {/* Legend */}
              <div className="flex items-center space-x-3 text-[10px] mb-3 font-semibold">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  <span className="text-slate-600">Livre</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                  <span className="text-slate-600">Preferencial</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  <span className="text-slate-600">Bloqueado (Hard)</span>
                </span>
              </div>

              {/* Availability Interactive Grid */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-200 p-2 font-bold text-slate-500 text-center text-[10px]">
                  <div>Slot</div>
                  {days.map(d => (
                    <div key={d.id}>{d.name}</div>
                  ))}
                </div>

                <div className="divide-y divide-slate-100">
                  {regularSlots.map(slot => (
                    <div key={slot.id} className="grid grid-cols-6 p-1.5 items-center text-center">
                      <span className="text-[10px] font-bold text-slate-500">{slot.name.replace(' Período', 'º')}</span>
                      {days.map(d => {
                        const key = `${d.id}_${slot.id}`;
                        const status = availMap[key] || 'FREE';

                        let bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
                        let label = 'Livre';
                        if (status === 'PREFERENTIAL') {
                          bgClass = 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
                          label = 'Pref.';
                        } else if (status === 'BLOCKED') {
                          bgClass = 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100';
                          label = 'Bloq.';
                        }

                        return (
                          <button
                            key={d.id}
                            onClick={() => toggleSlotStatus(d.id, slot.id)}
                            className={`m-0.5 py-1.5 px-1 rounded-md text-[10px] font-bold border transition ${bgClass}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Specific Rules Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-slate-800">Regras Específicas do Docente</h5>
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Máximo de 4 aulas por dia (evitar sobrecarga)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Agrupar aulas em blocos contínuos (sem janelas)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span>Permitir geminação de aulas para Exatas</span>
              </label>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={handleSaveAvailability}
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-xs font-bold shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Disponibilidade Semanal'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* New Teacher Modal */}
      <NewTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeacherCreated={handleTeacherCreated}
      />

      {/* Import Teachers CSV Modal */}
      <ImportTeachersCSVModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImportSuccess={() => onRefresh()}
      />
    </div>
  );
};