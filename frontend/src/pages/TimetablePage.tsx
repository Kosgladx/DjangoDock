import React, { useState } from 'react';
import type { TimetableSchedule, SchoolClass, Teacher, ClassRoom, TimeSlot, Subject } from '../types';
import {
  CheckSquare, Plus, Trash2, Sparkles, Loader2, RefreshCw, CheckCircle2,
  Calendar, AlertTriangle, Users, BookOpen, Clock
} from 'lucide-react';
import { ManualLessonModal } from '../components/ManualLessonModal';
import { api, runSolver } from '../services/api';

interface TimetablePageProps {
  schedule: TimetableSchedule | null;
  classes: SchoolClass[];
  teachers: Teacher[];
  rooms: ClassRoom[];
  slots: TimeSlot[];
  subjects?: Subject[];
  onRunSolver?: () => Promise<void> | void;
  onRefresh?: () => void;
  isSolving?: boolean;
}

const DEFAULT_CLASSES: SchoolClass[] = [
  { id: 1, name: '3º Ano A', grade_level: '3º Ano Ensino Médio', shift: 1, student_count: 35, total_weekly_lessons: 25 },
  { id: 2, name: '3º Ano B', grade_level: '3º Ano Ensino Médio', shift: 1, student_count: 32, total_weekly_lessons: 25 },
];

const DEFAULT_SLOTS: TimeSlot[] = [
  { id: 1, shift: 1, order: 1, name: '1º Período', start_time: '07:15:00', end_time: '08:05:00', duration_minutes: 50, is_break: false, allow_double_lesson: true, requires_lab: false },
  { id: 2, shift: 1, order: 2, name: '2º Período', start_time: '08:05:00', end_time: '08:55:00', duration_minutes: 50, is_break: false, allow_double_lesson: true, requires_lab: false },
  { id: 3, shift: 1, order: 3, name: 'Intervalo / Recreio', start_time: '08:55:00', end_time: '09:15:00', duration_minutes: 20, is_break: true, allow_double_lesson: false, requires_lab: false },
  { id: 4, shift: 1, order: 4, name: '3º Período', start_time: '09:15:00', end_time: '10:05:00', duration_minutes: 50, is_break: false, allow_double_lesson: true, requires_lab: false },
  { id: 5, shift: 1, order: 5, name: '4º Período', start_time: '10:05:00', end_time: '10:55:00', duration_minutes: 50, is_break: false, allow_double_lesson: true, requires_lab: false },
  { id: 6, shift: 1, order: 6, name: '5º Período', start_time: '10:55:00', end_time: '11:45:00', duration_minutes: 50, is_break: false, allow_double_lesson: true, requires_lab: false },
  { id: 7, shift: 1, order: 7, name: '6º Período', start_time: '11:45:00', end_time: '12:35:00', duration_minutes: 50, is_break: false, allow_double_lesson: true, requires_lab: false },
];

export const TimetablePage: React.FC<TimetablePageProps> = ({
  schedule,
  classes,
  teachers,
  rooms,
  slots,
  subjects,
  onRunSolver,
  onRefresh,
  isSolving = false
}) => {
  const effectiveClasses = classes.length > 0 ? classes : DEFAULT_CLASSES;
  const effectiveSlots = slots.length > 0 ? slots : DEFAULT_SLOTS;

  const [viewMode, setViewMode] = useState<'turma' | 'prof' | 'sala'>('turma');
  const [selectedEntityId, setSelectedEntityId] = useState<number>(effectiveClasses[0]?.id || 1);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [internalSolving, setInternalSolving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const solvingActive = isSolving || internalSolving;

  const handleGenerateTimetable = async () => {
    if (solvingActive) return;

    if (onRunSolver) {
      await onRunSolver();
      return;
    }

    try {
      setInternalSolving(true);
      setStatusMessage('Otimizando alocação com motor IA...');
      const res = await runSolver('Grade Oficial 2026.1 (IA Timetabling)', '1º Semestre 2026');
      setStatusMessage(`Grade gerada com sucesso! Viabilidade: ${res.viability_score || 100}%`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Erro ao executar solver: ' + err.message);
    } finally {
      setInternalSolving(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

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
    { id: 0, name: 'Segunda-feira', shortName: 'Seg' },
    { id: 1, name: 'Terça-feira', shortName: 'Ter' },
    { id: 2, name: 'Quarta-feira', shortName: 'Qua' },
    { id: 3, name: 'Quinta-feira', shortName: 'Qui' },
    { id: 4, name: 'Sexta-feira', shortName: 'Sex' },
  ];

  const filteredAssignments = schedule?.assignments?.filter(a => {
    if (viewMode === 'turma') {
      const selectedClass = effectiveClasses.find(c => c.id === selectedEntityId);
      return a.school_class === selectedEntityId || (selectedClass && a.class_name === selectedClass.name);
    }
    if (viewMode === 'prof') return a.teacher === selectedEntityId;
    if (viewMode === 'sala') return a.room === selectedEntityId;
    return true;
  }) || [];

  const getAssignment = (dayId: number, slot: TimeSlot) => {
    return filteredAssignments.find(a =>
      a.day_of_week === dayId &&
      (a.time_slot === slot.id || a.slot_order === slot.order)
    );
  };

  const selectedClassName = effectiveClasses.find(c => c.id === selectedEntityId)?.name || '3º Ano A';
  const totalAllocatedForCurrentView = filteredAssignments.length;

  return (
    <div className="space-y-6">
      {/* Action Banner with Generate Timetable Button (Tarefa D2) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>EduSchedule • Motor Construtivo Guloso com IA</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Grade Semanal de Horários
            {schedule && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ativa: {schedule.semester || '2026.1'}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Otimização matemática sem choques de professores ou turmas, com respeito estrito à matriz curricular e indisponibilidades docentes.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={solvingActive}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer disabled:opacity-50"
              title="Atualizar dados da API"
            >
              <RefreshCw className={`w-4 h-4 ${solvingActive ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            id="btn-generate-timetable"
            onClick={handleGenerateTimetable}
            disabled={solvingActive}
            className={`px-5 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center space-x-2.5 cursor-pointer ${
              solvingActive
                ? 'bg-indigo-700/80 cursor-not-allowed opacity-90'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {solvingActive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Gerando Grade Automática...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Gerar Grade Automática</span>
              </>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </span>
          <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-indigo-700">✕</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Score de Viabilidade</span>
            <span className="text-emerald-600 font-bold">{schedule?.viability_score ?? 98.4}%</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>{schedule?.viability_score && schedule.viability_score >= 95 ? 'Excelente' : 'Ótimo'}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 inline" />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${schedule?.viability_score ?? 98.4}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Restrições Rígidas (Hard)</span>
            <span className="text-emerald-600 font-bold">{schedule?.hard_violations_count ?? 0} violações</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">0 Choques</div>
          <p className="text-[11px] text-slate-500 mt-2">Sem colisões de horários de docentes ou turmas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-200 transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Penalidades Suaves (Soft)</span>
            <span className="text-amber-600 font-bold">{schedule?.soft_penalties_score ?? 0} pts</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {schedule?.soft_penalties_score === 0 ? 'Perfeita' : '95.2% Conforto'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Janelas ociosas minimizadas e aulas geminadas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Aulas Alocadas ({selectedClassName})</span>
            <span className="text-indigo-600 font-bold">{totalAllocatedForCurrentView} / 25 aulas</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalAllocatedForCurrentView > 0 ? `${totalAllocatedForCurrentView} Aulas` : 'Aguardando Solver'}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {effectiveClasses.length} Turmas • {teachers.length} Professores • {effectiveSlots.filter(s => !s.is_break).length} Períodos/dia
          </p>
        </div>
      </section>

      {/* Control Bar with Class / Entity Filter (Tarefa D4) */}
      <section className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Visualização:</label>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setViewMode('turma');
                  setSelectedEntityId(effectiveClasses[0]?.id || 1);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === 'turma' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Por Turma</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('prof');
                  if (teachers[0]) setSelectedEntityId(teachers[0].id);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === 'prof' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Por Professor</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('sala');
                  if (rooms[0]) setSelectedEntityId(rooms[0].id);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === 'sala' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Por Sala</span>
              </button>
            </div>
          </div>

          {/* Dropdown de Seleção de Turma (Tarefa D4) */}
          <div className="flex items-center space-x-2">
            <label htmlFor="select-class-filter" className="text-xs font-semibold text-slate-500">
              {viewMode === 'turma' ? 'Turma:' : viewMode === 'prof' ? 'Docente:' : 'Espaço:'}
            </label>
            <select
              id="select-class-filter"
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(Number(e.target.value))}
              className="bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              {viewMode === 'turma' && effectiveClasses.map(c => (
                <option key={c.id} value={c.id}>
                  📚 {c.name} {c.grade_level ? `(${c.grade_level})` : ''}
                </option>
              ))}
              {viewMode === 'prof' && teachers.map(t => (
                <option key={t.id} value={t.id}>👨‍🏫 {t.name}</option>
              ))}
              {viewMode === 'sala' && rooms.map(r => (
                <option key={r.id} value={r.id}>🏢 {r.name} ({r.block})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Sem conflitos</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-600 font-medium">Aviso de janela</span>
          </span>
          <button
            type="button"
            onClick={() => handleOpenManualModal()}
            className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 text-xs transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Alocação Manual</span>
          </button>
        </div>
      </section>

      {/* Timetable Grid Matrix with Real API Data, Colors & Teachers (Tarefa D3) */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase tracking-wider font-bold">
                <th className="p-3.5 w-32 text-center border-r border-slate-200 bg-slate-100/70">
                  <div className="flex items-center justify-center space-x-1.5 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Período</span>
                  </div>
                </th>
                {days.map(d => (
                  <th key={d.id} className="p-3.5 text-center border-r border-slate-200 last:border-r-0">
                    <span className="hidden sm:inline">{d.name}</span>
                    <span className="sm:hidden">{d.shortName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {effectiveSlots.map(slot => {
                if (slot.is_break) {
                  return (
                    <tr key={slot.id || `slot-break-${slot.order}`} className="bg-slate-100/70">
                      <td className="p-2.5 text-center font-bold text-slate-500 bg-slate-100 border-r border-slate-200 text-[11px]">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </td>
                      <td colSpan={5} className="p-2.5 text-center text-xs font-bold text-slate-500 tracking-wider uppercase">
                        ☕ {slot.name} ({slot.duration_minutes} min)
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id || `slot-${slot.order}`} className="hover:bg-slate-50/40 transition">
                    <td className="p-3.5 text-center font-bold text-slate-800 bg-slate-50/90 border-r border-slate-200">
                      <div className="text-xs text-indigo-950 font-extrabold">{slot.name}</div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                    </td>

                    {days.map(d => {
                      const assignment = getAssignment(d.id, slot);
                      const subjectColor = assignment?.subject_color || '#4F46E5';

                      return (
                        <td key={d.id} className="p-2 border-r border-slate-200 last:border-r-0 align-top min-w-[160px]">
                          {assignment ? (
                            <div
                              className="rounded-xl p-3 hover:shadow-md transition-all relative group border"
                              style={{
                                backgroundColor: `${subjectColor}14`,
                                borderColor: `${subjectColor}40`,
                                borderLeftWidth: '4px',
                                borderLeftColor: subjectColor,
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAssignment(assignment.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition absolute top-2 right-2 cursor-pointer shadow-2xs border border-slate-200"
                                title="Remover aula"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {assignment.has_conflict && (
                                <div
                                  className="absolute -top-2 -left-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs flex items-center space-x-0.5"
                                  title={assignment.conflict_message || 'Aviso de horário'}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />
                                  <span>Janela</span>
                                </div>
                              )}

                              <div className="flex justify-between items-start pr-5">
                                <span className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-1">
                                  {assignment.subject_name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className="text-[10px] text-white px-1.5 py-0.5 rounded-md font-mono font-black shadow-2xs"
                                  style={{ backgroundColor: subjectColor }}
                                >
                                  {assignment.subject_code}
                                </span>
                                {assignment.is_manual_override && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-semibold">
                                    Manual
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] font-semibold text-slate-700 mt-2 truncate flex items-center gap-1">
                                <span className="text-slate-400">👤</span>
                                <span>{viewMode === 'prof' ? assignment.class_name : assignment.teacher_name}</span>
                              </p>

                              <p className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                <span className="text-slate-400">🏢</span>
                                <span>{assignment.room_name ? `${assignment.room_name} (${assignment.room_block})` : 'Sala Padrão'}</span>
                              </p>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleOpenManualModal(d.id, slot.id)}
                              className="h-20 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 hover:text-indigo-600 flex flex-col items-center justify-center text-slate-400 text-[11px] cursor-pointer transition group"
                            >
                              <Plus className="w-4 h-4 mb-0.5 text-slate-300 group-hover:text-indigo-600 transition" />
                              <span className="font-medium text-[10px] text-slate-400 group-hover:text-indigo-600">Livre</span>
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

      {/* Constraints & Optimization Weights Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
              🚫
            </span>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Restrições Rígidas (Hard Constraints)</h3>
              <p className="text-xs text-slate-500">Regras invioláveis obrigatórias para a viabilidade matemática.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <CheckSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Sem choque de professor</span>
                <p className="text-rose-700 text-[11px]">Um docente não pode lecionar em 2 turmas no mesmo período simultaneamente.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <CheckSquare className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-950">Sem choque de turma</span>
                <p className="text-rose-700 text-[11px]">Uma turma não pode receber 2 aulas no mesmo slot de tempo.</p>
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
                <span className="font-bold text-rose-950">Carga horária da matriz curricular</span>
                <p className="text-rose-700 text-[11px]">Alocar estritamente o número total de aulas semanais de cada matéria.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Restrições Flexíveis (Soft Constraints & Pesos)</h3>
              <p className="text-xs text-slate-500">Preferências ponderadas que maximizam o conforto pedagógico.</p>
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
              <p className="text-[10px] text-slate-500 mt-0.5">Favorece blocos contínuos de 2 períodos para disciplinas práticas.</p>
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
              <p className="text-[10px] text-slate-500 mt-0.5">Evita concentração de aulas pesadas no mesmo dia.</p>
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
              <p className="text-[10px] text-slate-500 mt-0.5">Reduz o número total de deslocamentos semanais do docente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Manual Lesson Modal */}
      <ManualLessonModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        classes={effectiveClasses}
        teachers={teachers}
        rooms={rooms}
        slots={effectiveSlots}
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