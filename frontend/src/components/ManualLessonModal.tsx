import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Loader2, Plus } from 'lucide-react';
import type { SchoolClass, Teacher, ClassRoom, TimeSlot, Subject } from '../types';
import { api } from '../services/api';

interface ManualLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  rooms: ClassRoom[];
  slots: TimeSlot[];
  subjects?: Subject[];
  activeScheduleId?: number;
  initialClassId?: number;
  initialDayId?: number;
  initialSlotId?: number;
  initialTeacherId?: number;
  initialRoomId?: number;
  onSaved: () => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Segunda-feira' },
  { id: 1, name: 'Terça-feira' },
  { id: 2, name: 'Quarta-feira' },
  { id: 3, name: 'Quinta-feira' },
  { id: 4, name: 'Sexta-feira' },
];

export const ManualLessonModal: React.FC<ManualLessonModalProps> = ({
  isOpen,
  onClose,
  classes,
  teachers,
  rooms,
  slots,
  subjects: propSubjects,
  activeScheduleId,
  initialClassId,
  initialDayId,
  initialSlotId,
  initialTeacherId,
  initialRoomId,
  onSaved,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>(propSubjects || []);
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId || classes[0]?.id || 1);
  const [selectedDay, setSelectedDay] = useState<number>(initialDayId ?? 0);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(initialSlotId || slots.find(s => !s.is_break)?.id || 1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(initialTeacherId || teachers[0]?.id || 1);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(initialRoomId || rooms[0]?.id || 1);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const regularSlots = slots.filter(s => !s.is_break);

  useEffect(() => {
    if (isOpen) {
      if (initialClassId) setSelectedClassId(initialClassId);
      if (initialDayId !== undefined) setSelectedDay(initialDayId);
      if (initialSlotId) setSelectedSlotId(initialSlotId);
      if (initialTeacherId) setSelectedTeacherId(initialTeacherId);
      if (initialRoomId) setSelectedRoomId(initialRoomId);

      // Load subjects if not provided
      if (!propSubjects || propSubjects.length === 0) {
        api.getSubjects().then(setSubjects).catch(console.error);
      } else {
        setSubjects(propSubjects);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialClassId, initialDayId, initialSlotId, initialTeacherId, initialRoomId, propSubjects]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  if (!isOpen) return null;

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Check teacher availability warning for this day and slot
  const teacherAvailability = selectedTeacher?.availabilities?.find(
    a => a.day_of_week === selectedDay && a.time_slot === selectedSlotId
  );
  const isTeacherBlocked = teacherAvailability?.status === 'BLOCKED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSlotId || !selectedSubjectId || !selectedTeacherId || !selectedRoomId) {
      setErrorMessage('Por favor, preencha todos os campos da alocação.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await api.createOrUpdateAssignment({
        timetable_schedule: activeScheduleId,
        school_class: selectedClassId,
        day_of_week: selectedDay,
        time_slot: selectedSlotId,
        subject: selectedSubjectId,
        teacher: selectedTeacherId,
        room: selectedRoomId,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao alocar aula');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Adicionar Aula Manual</h2>
              <p className="text-xs text-slate-500">Alocação direta de período com validação de disponibilidade.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Teacher Block Warning */}
          {isTeacherBlocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <b>Aviso de Bloqueio:</b> O professor <b>{selectedTeacher?.name}</b> marcou este horário como indisponível. A alocação manual sobreporá a restrição.
              </span>
            </div>
          )}

          {/* Card Preview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
                style={{ backgroundColor: selectedSubject?.color || '#4F46E5' }}
              >
                {selectedSubject?.code || 'DISC'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {selectedSubject?.name || 'Selecione a Disciplina'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Turma: {selectedClass?.name || 'Selecione'} • {selectedRoom?.name || 'Sala'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                Manual Override
              </span>
            </div>
          </div>

          {/* Grid of Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Turma */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Turma / Série</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>📚 {c.name} ({c.grade_level})</option>
                ))}
              </select>
            </div>

            {/* Disciplina */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disciplina</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>📖 {s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            {/* Dia da Semana */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dia da Semana</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.id} value={d.id}>🗓️ {d.name}</option>
                ))}
              </select>
            </div>

            {/* Slot / Período */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horário / Período</label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {regularSlots.map(s => (
                  <option key={s.id} value={s.id}>
                    ⏰ {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                  </option>
                ))}
              </select>
            </div>

            {/* Professor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Professor Responsável</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>👨‍🏫 {t.name}</option>
                ))}
              </select>
            </div>

            {/* Sala de Aula */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sala / Ambiente</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    🏢 {r.name} ({r.block}) {r.is_lab ? '🧪 Lab' : `Cap: ${r.capacity}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
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
                  <span>Alocando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Salvar Alocação Manual</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
