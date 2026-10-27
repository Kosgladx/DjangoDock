import React, { useState, useEffect, useMemo } from 'react';
import type { Teacher, TimeSlot, SchoolClass, ClassRoom, TimetableSchedule } from '../types';
import type { UserSession } from './LoginPage';
import { api } from '../services/api';
import {
  Calendar, Clock, CheckCircle2, Save,
  BookOpen, Users, MapPin, X,
  GraduationCap, Printer
} from 'lucide-react';

interface TeacherPortalPageProps {
  currentUser: UserSession | null;
  teachers: Teacher[];
  slots: TimeSlot[];
  classes: SchoolClass[];
  rooms?: ClassRoom[];
  schedule: TimetableSchedule | null;
  onRefresh: () => void;
}

const shortDays = [
  { id: 0, name: 'Seg', fullName: 'Segunda-feira' },
  { id: 1, name: 'Ter', fullName: 'Terça-feira' },
  { id: 2, name: 'Qua', fullName: 'Quarta-feira' },
  { id: 3, name: 'Qui', fullName: 'Quinta-feira' },
  { id: 4, name: 'Sex', fullName: 'Sexta-feira' },
];

export const TeacherPortalPage: React.FC<TeacherPortalPageProps> = ({
  currentUser,
  teachers,
  slots,
  classes,
  rooms: _rooms,
  schedule,
  onRefresh,
}) => {
  // Try to match logged-in user with a teacher in the database
  const defaultTeacherId = useMemo(() => {
    if (currentUser?.email) {
      const match = teachers.find(
        (t) => t.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (match) return match.id;
    }
    return teachers[0]?.id || 1;
  }, [currentUser, teachers]);

  const [activePortalTab, setActivePortalTab] = useState<'schedule' | 'availability' | 'subjects'>('schedule');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(defaultTeacherId);
  const [scheduleViewScope, setScheduleViewScope] = useState<'my-lessons' | 'class-view'>('my-lessons');
  const [selectedClassId, setSelectedClassId] = useState<number>(classes[0]?.id || 1);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // When default teacher changes or teachers list updates
  useEffect(() => {
    if (!teachers.some((t) => t.id === selectedTeacherId)) {
      setSelectedTeacherId(defaultTeacherId);
    }
  }, [defaultTeacherId, teachers, selectedTeacherId]);

  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  // Local availability state map: key `${day_of_week}_${slot_id}` -> status
  const [availMap, setAvailMap] = useState<Record<string, 'FREE' | 'PREFERENTIAL' | 'BLOCKED'>>({});
  const [teacherNotes, setTeacherNotes] = useState('');

  // Synchronize availabilities when selected teacher changes
  useEffect(() => {
    if (currentTeacher) {
      const map: Record<string, 'FREE' | 'PREFERENTIAL' | 'BLOCKED'> = {};
      currentTeacher.availabilities?.forEach((a) => {
        map[`${a.day_of_week}_${a.time_slot}`] = a.status;
      });
      setAvailMap(map);
      setSaveSuccessMessage(null);
    }
  }, [currentTeacher]);

  const regularSlots = useMemo(() => slots.filter((s) => !s.is_break), [slots]);

  // Teacher's assignments in current timetable
  const teacherAssignments = useMemo(() => {
    if (!schedule?.assignments || !currentTeacher) return [];
    return schedule.assignments.filter((a) => a.teacher === currentTeacher.id);
  }, [schedule, currentTeacher]);

  // Class assignments if viewing in class scope
  const classAssignments = useMemo(() => {
    if (!schedule?.assignments) return [];
    return schedule.assignments.filter((a) => a.school_class === selectedClassId);
  }, [schedule, selectedClassId]);

  // Count availability states
  const availabilityStats = useMemo(() => {
    let free = 0;
    let pref = 0;
    let blocked = 0;

    shortDays.forEach((d) => {
      regularSlots.forEach((s) => {
        const status = availMap[`${d.id}_${s.id}`] || 'FREE';
        if (status === 'FREE') free++;
        else if (status === 'PREFERENTIAL') pref++;
        else if (status === 'BLOCKED') blocked++;
      });
    });

    return { free, pref, blocked, total: shortDays.length * regularSlots.length };
  }, [availMap, regularSlots]);

  // Toggle single slot status
  const toggleSlotStatus = (day: number, slotId: number) => {
    const key = `${day}_${slotId}`;
    const current = availMap[key] || 'FREE';
    let next: 'FREE' | 'PREFERENTIAL' | 'BLOCKED' = 'PREFERENTIAL';
    if (current === 'FREE') next = 'PREFERENTIAL';
    else if (current === 'PREFERENTIAL') next = 'BLOCKED';
    else next = 'FREE';

    setAvailMap((prev) => ({ ...prev, [key]: next }));
    setSaveSuccessMessage(null);
  };

  // Quick preset: Set an entire day
  const setDayStatus = (dayId: number, status: 'FREE' | 'PREFERENTIAL' | 'BLOCKED') => {
    setAvailMap((prev) => {
      const next = { ...prev };
      regularSlots.forEach((s) => {
        next[`${dayId}_${s.id}`] = status;
      });
      return next;
    });
    setSaveSuccessMessage(null);
  };

  // Save teacher availability
  const handleSaveAvailability = async () => {
    if (!currentTeacher) return;
    setIsSavingAvailability(true);
    setSaveSuccessMessage(null);
    try {
      const payload: Array<{ day_of_week: number; time_slot_id: number; status: string }> = [];
      shortDays.forEach((d) => {
        regularSlots.forEach((s) => {
          const key = `${d.id}_${s.id}`;
          payload.push({
            day_of_week: d.id,
            time_slot_id: s.id,
            status: availMap[key] || 'FREE',
          });
        });
      });

      await api.updateTeacherAvailability(currentTeacher.id, payload);
      setSaveSuccessMessage('Disponibilidade salva com sucesso! Os parâmetros serão respeitados pelo otimizador de horários.');
      onRefresh();
    } catch (err: any) {
      alert('Erro ao salvar disponibilidade: ' + (err.message || err));
    } finally {
      setIsSavingAvailability(false);
    }
  };

  if (!currentTeacher) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <Users className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Nenhum professor cadastrado</h3>
        <p className="text-xs text-slate-500">Cadastre docentes na aba "Professores & Disponibilidade" para acessar este portal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Portal Welcome Banner & Teacher Selector */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {currentTeacher.photo ? (
              <img
                src={currentTeacher.photo}
                alt={currentTeacher.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-lg shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shrink-0 border-2 border-indigo-400/50"
                style={{ backgroundColor: `${currentTeacher.color}35`, color: '#FFFFFF' }}
              >
                {currentTeacher.avatar_initials}
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Portal do Docente
                </span>
                <span className="text-xs text-indigo-300">Ano Letivo 2026.1</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-1">
                {currentTeacher.name}
              </h1>
              <p className="text-xs text-indigo-200/80">
                {currentTeacher.email} • Carga Contratada: <strong>{currentTeacher.max_weekly_hours}h/sem</strong> • Alocados na grade: <strong>{teacherAssignments.length} tempos</strong>
              </p>
            </div>
          </div>

          {/* Teacher Selector dropdown (allowing quick switch for testing or multi-teacher lab) */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/15">
            <GraduationCap className="w-5 h-5 text-indigo-300 shrink-0" />
            <div className="text-left">
              <label htmlFor="teacher-select" className="block text-[10px] text-indigo-200 font-medium">
                Visualizar como docente:
              </label>
              <select
                id="teacher-select"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="bg-transparent text-white font-semibold text-xs border-none focus:outline-none focus:ring-0 cursor-pointer pr-6"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900 bg-white">
                    {t.name} ({t.max_weekly_hours}h)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Portal Sub-navigation Tabs */}
      <section className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 text-xs font-semibold">
          <button
            onClick={() => setActivePortalTab('schedule')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition cursor-pointer ${
              activePortalTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Meu Quadro de Horários</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activePortalTab === 'schedule' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {teacherAssignments.length}
            </span>
          </button>

          <button
            onClick={() => setActivePortalTab('availability')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition cursor-pointer ${
              activePortalTab === 'availability'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Declarar Minha Disponibilidade</span>
            {availabilityStats.blocked > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activePortalTab === 'availability' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                {availabilityStats.blocked} bloq
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePortalTab('subjects')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition cursor-pointer ${
              activePortalTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Minhas Turmas & Disciplinas</span>
          </button>
        </div>

        {activePortalTab === 'schedule' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Grade</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. TAB 1: MEU QUADRO DE HORÁRIOS */}
      {activePortalTab === 'schedule' && (
        <div className="space-y-5">
          {/* View Scope Switcher */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setScheduleViewScope('my-lessons')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    scheduleViewScope === 'my-lessons'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Minha Grade Semanal
                </button>
                <button
                  onClick={() => setScheduleViewScope('class-view')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    scheduleViewScope === 'class-view'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Visualizar Grade de Turma
                </button>
              </div>

              {scheduleViewScope === 'class-view' && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="class-select" className="text-xs font-semibold text-slate-600">Turma:</label>
                  <select
                    id="class-select"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium py-1.5 px-3 focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade_level})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg font-medium">
                Total de Aulas: <strong>{scheduleViewScope === 'my-lessons' ? teacherAssignments.length : classAssignments.length} tempos</strong>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg font-medium">
                Grade: <strong>{schedule?.name || '1º Semestre 2026'}</strong>
              </div>
            </div>
          </div>

          {/* Timetable Grid View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {scheduleViewScope === 'my-lessons'
                    ? `Horários de Aulas — ${currentTeacher.name}`
                    : `Grade Horária da Turma — ${classes.find(c => c.id === selectedClassId)?.name || 'Turma'}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {scheduleViewScope === 'my-lessons'
                    ? 'Quadro semanal com suas turmas, disciplinas alocadas e salas de aula atribuídas.'
                    : 'Visão integral dos horários desta turma para consulta e alinhamento pedagógico.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <th className="p-3 text-left w-36 border-r border-slate-200">Horário / Período</th>
                    {shortDays.map((d) => (
                      <th key={d.id} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                        <div>{d.fullName}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {slots.map((slot) => {
                    if (slot.is_break) {
                      return (
                        <tr key={slot.id} className="bg-slate-100/70 text-slate-500 text-center font-semibold text-[11px]">
                          <td className="p-2 border-r border-slate-200 font-bold">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </td>
                          <td colSpan={5} className="p-2 tracking-wide text-slate-500 uppercase">
                            ☕ {slot.name} ({slot.duration_minutes} min)
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/40 transition">
                        {/* Time slot header */}
                        <td className="p-3 border-r border-slate-200 bg-slate-50/40">
                          <div className="font-bold text-slate-900">{slot.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </div>
                        </td>

                        {/* Columns for Seg - Sex */}
                        {shortDays.map((d) => {
                          const assignment = (scheduleViewScope === 'my-lessons'
                            ? teacherAssignments
                            : classAssignments
                          ).find((a) => a.day_of_week === d.id && a.time_slot === slot.id);

                          const isCurrentTeacherInClass =
                            scheduleViewScope === 'class-view' &&
                            assignment?.teacher === currentTeacher.id;

                          return (
                            <td
                              key={d.id}
                              className={`p-2.5 border-r border-slate-200 last:border-r-0 align-top h-24 ${
                                isCurrentTeacherInClass ? 'bg-indigo-50/50 ring-1 ring-inset ring-indigo-300' : ''
                              }`}
                            >
                              {assignment ? (
                                <div
                                  className="h-full p-2.5 rounded-xl border shadow-xs transition hover:shadow-md flex flex-col justify-between"
                                  style={{
                                    backgroundColor: `${assignment.subject_color}12`,
                                    borderColor: `${assignment.subject_color}40`,
                                  }}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span
                                        className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md text-white"
                                        style={{ backgroundColor: assignment.subject_color }}
                                      >
                                        {assignment.subject_code}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500">
                                        {scheduleViewScope === 'my-lessons' ? assignment.class_name : assignment.teacher_name}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                      {assignment.subject_name}
                                    </h4>
                                  </div>

                                  <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                                    <span className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>{assignment.room_name} ({assignment.room_block})</span>
                                    </span>
                                    {isCurrentTeacherInClass && (
                                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1 py-0.2 rounded">
                                        Sua Aula
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full rounded-xl border border-dashed border-slate-200 p-2 flex flex-col items-center justify-center text-slate-300">
                                  <span className="text-[10px] font-medium text-slate-400">Horário Livre</span>
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
          </div>
        </div>
      )}

      {/* 4. TAB 2: DECLARAR DISPONIBILIDADE */}
      {activePortalTab === 'availability' && (
        <div className="space-y-5">
          {/* Success Banner */}
          {saveSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 font-semibold">{saveSuccessMessage}</div>
              <button
                onClick={() => setSaveSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Availability Header and Stats */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Declaração de Disponibilidade Semanal
                </h3>
                <p className="text-xs text-slate-500">
                  Clique nos períodos abaixo para alternar seu status de disponibilidade. Suas preferências serão utilizadas pelo motor de inteligência artificial na geração da grade oficial.
                </p>
              </div>

              {/* Status Badges Summary */}
              <div className="flex items-center space-x-2 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>{availabilityStats.free} Livres</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>{availabilityStats.pref} Preferenciais</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>{availabilityStats.blocked} Bloqueios</span>
                </div>
              </div>
            </div>

            {/* Legend & Instructions */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-700">Legenda de Status:</span>
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span><strong>Livre:</strong> Disponível normalmente para lecionar</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
                  <span><strong>Preferencial:</strong> Horário prioritário desejado</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span>
                  <span><strong>Bloqueado (Hard):</strong> Impossibilidade de estar na instituição</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * Toque ou clique no slot para ciclar: Livre → Preferencial → Bloqueado
              </div>
            </div>
          </div>

          {/* Interactive Weekly Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 text-left w-36 border-r border-slate-200">Período / Slot</th>
                    {shortDays.map((d) => (
                      <th key={d.id} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                        <div className="flex items-center justify-center space-x-1.5">
                          <span>{d.fullName}</span>
                        </div>
                        {/* Quick Day Presets */}
                        <div className="flex items-center justify-center space-x-1 mt-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setDayStatus(d.id, 'FREE')}
                            className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold"
                            title={`Marcar ${d.name} inteiro como Livre`}
                          >
                            Tudo Livre
                          </button>
                          <button
                            type="button"
                            onClick={() => setDayStatus(d.id, 'BLOCKED')}
                            className="px-1.5 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold"
                            title={`Bloquear todo ${d.name}`}
                          >
                            Bloquear
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regularSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 border-r border-slate-200 bg-slate-50/40 font-medium">
                        <div className="font-bold text-slate-900">{slot.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </div>
                      </td>

                      {shortDays.map((d) => {
                        const key = `${d.id}_${slot.id}`;
                        const status = availMap[key] || 'FREE';

                        let cardClass = 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100';
                        let badgeText = 'Livre';
                        let subText = 'Disponível';

                        if (status === 'PREFERENTIAL') {
                          cardClass = 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 font-semibold';
                          badgeText = 'Preferencial';
                          subText = 'Prioridade alta';
                        } else if (status === 'BLOCKED') {
                          cardClass = 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100 font-semibold';
                          badgeText = 'Bloqueado';
                          subText = 'Não leciona';
                        }

                        return (
                          <td
                            key={d.id}
                            onClick={() => toggleSlotStatus(d.id, slot.id)}
                            className="p-2 border-r border-slate-200 last:border-r-0 cursor-pointer select-none"
                          >
                            <div
                              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 shadow-2xs ${cardClass}`}
                            >
                              <span className="text-xs font-bold">{badgeText}</span>
                              <span className="text-[10px] opacity-75">{subText}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Teacher Notes & Save Action Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <label htmlFor="teacher-notes" className="block text-xs font-bold text-slate-900 mb-1">
                Observações / Justificativas de Horários (Opcional)
              </label>
              <textarea
                id="teacher-notes"
                rows={2}
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="Exemplo: Curso de pós-graduação às terças à noite. Preferência por dar aulas concentradas nas manhãs de segunda e quarta."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Lembre-se de clicar em <strong>Salvar Minha Disponibilidade</strong> para registrar as alterações no sistema.
              </div>

              <button
                type="button"
                onClick={handleSaveAvailability}
                disabled={isSavingAvailability}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingAvailability ? 'Salvando...' : 'Salvar Minha Disponibilidade'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: MINHAS TURMAS & DISCIPLINAS */}
      {activePortalTab === 'subjects' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Disciplinas & Turmas Atribuídas</h3>
            <p className="text-xs text-slate-500">
              Relação de turmas e componentes curriculares onde você está alocado para o período letivo 2026.1.
            </p>
          </div>

          {teacherAssignments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Nenhuma aula alocada ainda na grade</h4>
              <p className="text-xs text-slate-500">
                A coordenação ainda não gerou ou publicou a alocação de turmas para este docente. Declare sua disponibilidade para otimizar seus horários!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Group unique subject + class pairs */}
              {Array.from(
                new Set(teacherAssignments.map((a) => `${a.school_class}_${a.subject}`))
              ).map((pairKey) => {
                const sample = teacherAssignments.find(
                  (a) => `${a.school_class}_${a.subject}` === pairKey
                )!;
                const lessonsCount = teacherAssignments.filter(
                  (a) => `${a.school_class}_${a.subject}` === pairKey
                ).length;
                const schoolClass = classes.find((c) => c.id === sample.school_class);

                return (
                  <div
                    key={pairKey}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: sample.subject_color }}
                        />
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          {sample.subject_code}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {lessonsCount} tempos/semana
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sample.subject_name}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">{sample.class_name}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{schoolClass?.student_count || 35} alunos</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sample.room_name}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
