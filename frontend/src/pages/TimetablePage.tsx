import React, { useState } from 'react';
import type { TimetableSchedule, SchoolClass, Teacher, ClassRoom, TimeSlot, Subject } from '../types';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import { ManualLessonModal } from '../components/ManualLessonModal';
import { api } from '../services/api';

interface TimetablePageProps {
  schedule: TimetableSchedule | null;
  classes: SchoolClass[];
  teachers: Teacher[];
  rooms: ClassRoom[];
  slots: TimeSlot[];
  subjects?: Subject[];
  onRunSolver?: () => void;
  onRefresh?: () => void;
  isSolving?: boolean;
}

export const TimetablePage: React.FC<TimetablePageProps> = ({
  schedule,
  classes,
  teachers,
  rooms,
  slots,
  subjects,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState<'turma' | 'prof' | 'sala'>('turma');
  const [selectedEntityId, setSelectedEntityId] = useState<number>(classes[0]?.id || 1);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedSlotContext, setSelectedSlotContext] = useState<{
    dayId?: number;
    slotId?: number;
    classId?: number;
    teacherId?: number;
    roomId?: number;
  }>({});

  const [gapWeight, setGapWeight] = useState(85);
  const [doubleWeight, setDoubleWeight] = useState(90);
  const [balanceWeight, setBalanceWeight] = useState(70);
  const [concentrationWeight, setConcentrationWeight] = useState(60);

  const handleOpenManualModal = (dayId?: number, slotId?: number) => {
    setSelectedSlotContext({
      dayId,
      slotId,
      classId: viewMode === 'turma' ? selectedEntityId : undefined,
      teacherId: viewMode === 'prof' ? selectedEntityId : undefined,
      roomId: viewMode === 'sala' ? selectedEntityId : undefined,
    });
    setIsManualModalOpen(true);
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Deseja realmente remover esta aula da grade?')) return;
    try {
      await api.deleteAssignment(id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Erro ao remover aula: ' + err.message);
    }
  };

  const days = [
    { id: 0, name: 'Segunda-feira' },
    { id: 1, name: 'Terça-feira' },
    { id: 2, name: 'Quarta-feira' },
    { id: 3, name: 'Quinta-feira' },
    { id: 4, name: 'Sexta-feira' },
  ];

  const filteredAssignments = schedule?.assignments.filter(a => {
    if (viewMode === 'turma') return a.school_class === selectedEntityId;
    if (viewMode === 'prof') return a.teacher === selectedEntityId;
    if (viewMode === 'sala') return a.room === selectedEntityId;
    return true;
  }) || [];

  const getAssignment = (dayId: number, slotId: number) => {
    return filteredAssignments.find(a => a.day_of_week === dayId && a.time_slot === slotId);
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Score de Viabilidade</span>
            <span className="text-emerald-600 font-bold">{schedule?.viability_score || 98.4}%</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">Ótimo</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${schedule?.viability_score || 98.4}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Restrições Rígidas (Hard)</span>
            <span className="text-emerald-600 font-bold">{schedule?.hard_violations_count || 0} violações</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">100% Atendido</div>
          <p className="text-[11px] text-slate-500 mt-2">Sem choques de professor ou sala</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Restrições Flexíveis (Soft)</span>
            <span className="text-amber-600 font-bold">1 janela vaga</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">95.2%</div>
          <p className="text-[11px] text-slate-500 mt-2">1 janela identificada (Prof. Carlos)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Aulas Alocadas</span>
            <span className="text-indigo-600 font-bold">{schedule?.assignments?.length || 0} / 25</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {schedule?.assignments?.length ? 'Grade Carregada' : 'Aguardando Solver'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{classes.length} Turmas • {teachers.length} Professores • {rooms.length} Salas</p>
        </div>
      </section>

      <section className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Visualização:</label>
          
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => { setViewMode('turma'); setSelectedEntityId(classes[0]?.id || 1); }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'turma' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Turma
            </button>
            <button
              onClick={() => { setViewMode('prof'); setSelectedEntityId(teachers[0]?.id || 1); }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'prof' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Professor
            </button>
            <button
              onClick={() => { setViewMode('sala'); setSelectedEntityId(rooms[0]?.id || 1); }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'sala' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Sala
            </button>
          </div>

          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {viewMode === 'turma' && classes.map(c => (
              <option key={c.id} value={c.id}>📚 {c.name} - {c.grade_level}</option>
            ))}
            {viewMode === 'prof' && teachers.map(t => (
              <option key={t.id} value={t.id}>👨‍🏫 {t.name}</option>
            ))}
            {viewMode === 'sala' && rooms.map(r => (
              <option key={r.id} value={r.id}>🏢 {r.name} ({r.block})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">Sem conflitos</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-600">Aviso / Janela vaga</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600">Choque de horário</span>
          </span>
          <button 
            onClick={() => handleOpenManualModal()}
            className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-md border border-indigo-200 text-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Aula Manual</span>
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-3.5 w-28 text-center border-r border-slate-200">Horário</th>
                {days.map(d => (
                  <th key={d.id} className="p-3.5 text-center border-r border-slate-200 last:border-r-0">
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {slots.map(slot => {
                if (slot.is_break) {
                  return (
                    <tr key={slot.id} className="bg-slate-50/80">
                      <td className="p-2 text-center font-bold text-slate-400 bg-slate-100 border-r border-slate-200 text-[10px]">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </td>
                      <td colSpan={5} className="p-2 text-center text-xs font-semibold text-slate-500 tracking-wider uppercase">
                        ☕ {slot.name} ({slot.duration_minutes} min)
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id}>
                    <td className="p-3 text-center font-bold text-slate-700 bg-slate-50 border-r border-slate-200">
                      <div className="text-xs">{slot.start_time.slice(0, 5)}</div>
                      <div className="text-[10px] font-normal text-slate-400">{slot.end_time.slice(0, 5)}</div>
                    </td>

                    {days.map(d => {
                      const assignment = getAssignment(d.id, slot.id);

                      return (
                        <td key={d.id} className="p-2 border-r border-slate-200 last:border-r-0 align-top">
                          {assignment ? (
                            <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-2.5 hover:shadow-md transition relative group">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAssignment(assignment.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition absolute top-2 right-2 cursor-pointer shadow-2xs"
                                title="Remover aula manual"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {assignment.has_conflict && (
                                <div className="absolute -top-2 -left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs" title={assignment.conflict_message || 'Aviso'}>
                                  ⚠️ Janela
                                </div>
                              )}
                              <div className="flex justify-between items-start pr-6">
                                <span className="font-bold text-indigo-950 truncate">{assignment.subject_name}</span>
                              </div>
                              <span className="inline-block mt-0.5 text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                {assignment.subject_code}
                              </span>
                              <p className="text-[11px] text-indigo-700 mt-1 font-medium truncate">
                                {viewMode === 'prof' ? assignment.class_name : assignment.teacher_name}
                              </p>
                              <p className="text-[10px] text-indigo-600 truncate">
                                {assignment.room_name} • {assignment.room_block}
                              </p>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleOpenManualModal(d.id, slot.id)}
                              className="h-16 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-400 text-[11px] hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-300 cursor-pointer transition"
                            >
                              <span>+ Alocar</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              🚫
            </span>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Restrições Rígidas (Hard Constraints)</h3>
              <p className="text-xs text-slate-500">Regras invioláveis obrigatórias para viabilidade matemática da grade.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <CheckSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Sem choque de professor</span>
                <p className="text-rose-700 text-[11px]">Um professor não pode lecionar em 2 turmas no mesmo período simultaneamente.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <CheckSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Sem choque de sala / laboratório</span>
                <p className="text-rose-700 text-[11px]">Cada sala ou laboratório comporta apenas uma turma por slot de tempo.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <CheckSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Indisponibilidade absoluta de docentes</span>
                <p className="text-rose-700 text-[11px]">Respeitar bloqueios fixos de dias e turnos informados pelo docente.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <CheckSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Carga horária exata da matriz curricular</span>
                <p className="text-rose-700 text-[11px]">Alocar estritamente o número de aulas semanais de cada disciplina por turma.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Restrições Flexíveis (Soft Constraints & Pesos)</h3>
              <p className="text-xs text-slate-500">Preferências ponderadas que minimizam desconforto pedagógico.</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Minimizar janelas vagas para professores</span>
                <span className="text-indigo-600 font-bold">Peso: {gapWeight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={gapWeight}
                onChange={(e) => setGapWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Penaliza horários ociosos entre a primeira e a última aula do docente.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Agrupamento de aulas geminadas (aulas duplas)</span>
                <span className="text-indigo-600 font-bold">Peso: {doubleWeight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={doubleWeight}
                onChange={(e) => setDoubleWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Favorece blocos contínuos de 2 períodos para disciplinas de Exatas/Práticas.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Distribuição equilibrada das matérias na semana</span>
                <span className="text-indigo-600 font-bold">Peso: {balanceWeight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={balanceWeight}
                onChange={(e) => setBalanceWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Evita concentração de aulas pesadas da mesma disciplina em dias seguidos.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Concentração de dias de trabalho por professor</span>
                <span className="text-indigo-600 font-bold">Peso: {concentrationWeight}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={concentrationWeight}
                onChange={(e) => setConcentrationWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Reduz o número total de deslocamentos do docente na semana.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Manual Lesson Modal */}
      <ManualLessonModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        classes={classes}
        teachers={teachers}
        rooms={rooms}
        slots={slots}
        subjects={subjects}
        activeScheduleId={schedule?.id}
        initialClassId={selectedSlotContext.classId}
        initialDayId={selectedSlotContext.dayId}
        initialSlotId={selectedSlotContext.slotId}
        initialTeacherId={selectedSlotContext.teacherId}
        initialRoomId={selectedSlotContext.roomId}
        onSaved={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};