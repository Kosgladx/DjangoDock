import React, { useState, useEffect } from 'react';
import { X, Layers, Pencil, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { CurriculumRequirement, SchoolClass, Subject, Teacher } from '../types';
import { api } from '../services/api';

interface NewCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  curriculumToEdit?: CurriculumRequirement | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  preselectedClassId?: number;
}

export const NewCurriculumModal: React.FC<NewCurriculumModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  curriculumToEdit,
  classes,
  subjects,
  teachers,
  preselectedClassId,
}) => {
  const isEditing = Boolean(curriculumToEdit);

  const [classId, setClassId] = useState<number>(preselectedClassId || classes[0]?.id || 1);
  const [subjectId, setSubjectId] = useState<number>(subjects[0]?.id || 1);
  const [teacherId, setTeacherId] = useState<number>(teachers[0]?.id || 1);
  const [weeklyLessons, setWeeklyLessons] = useState<number>(4);
  const [doubleLessonsAllowed, setDoubleLessonsAllowed] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (curriculumToEdit) {
        setClassId(curriculumToEdit.school_class);
        setSubjectId(curriculumToEdit.subject);
        setTeacherId(curriculumToEdit.teacher);
        setWeeklyLessons(curriculumToEdit.weekly_lessons || 4);
        setDoubleLessonsAllowed(curriculumToEdit.double_lessons_allowed ?? true);
      } else {
        setClassId(preselectedClassId || classes[0]?.id || 1);
        setSubjectId(subjects[0]?.id || 1);
        setTeacherId(teachers[0]?.id || 1);
        setWeeklyLessons(4);
        setDoubleLessonsAllowed(true);
      }
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, curriculumToEdit, preselectedClassId, classes, subjects, teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      setErrorMessage('Selecione uma turma.');
      return;
    }
    if (!subjectId) {
      setErrorMessage('Selecione uma disciplina.');
      return;
    }
    if (!teacherId) {
      setErrorMessage('Selecione o professor titular.');
      return;
    }
    if (weeklyLessons < 1 || weeklyLessons > 15) {
      setErrorMessage('A quantidade de aulas semanais deve ser entre 1 e 15.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload = {
        school_class: Number(classId),
        subject: Number(subjectId),
        teacher: Number(teacherId),
        weekly_lessons: Number(weeklyLessons),
        double_lessons_allowed: Boolean(doubleLessonsAllowed),
      };

      if (isEditing && curriculumToEdit) {
        await api.updateCurriculumRequirement(curriculumToEdit.id, payload);
      } else {
        await api.createCurriculumRequirement(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar vínculo na matriz curricular.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              {isEditing ? <Pencil className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Editar Item da Matriz' : 'Vincular Disciplina na Matriz'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Ajuste a carga horária ou professor da turma.'
                  : 'Defina quantas aulas a matéria terá e quem será o docente titular.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Turma Escolar <span className="text-rose-500">*</span>
            </label>
            <select
              value={classId}
              disabled={isEditing}
              onChange={(e) => setClassId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  📚 {c.name} ({c.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Disciplina Curricular <span className="text-rose-500">*</span>
            </label>
            <select
              value={subjectId}
              disabled={isEditing}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  📖 {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Professor Titular <span className="text-rose-500">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  👨‍🏫 {t.name} (Max {t.max_weekly_hours}h/sem)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aulas Semanais <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={weeklyLessons}
                onChange={(e) => setWeeklyLessons(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Tempos/períodos por semana</span>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doubleLessonsAllowed}
                  onChange={(e) => setDoubleLessonsAllowed(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Aulas Geminadas Permitidas</span>
              </label>
              <span className="text-[10px] text-slate-400 block mt-0.5 ml-6">Permite 2 aulas seguidas</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isEditing ? 'Salvar Alterações' : 'Adicionar à Matriz'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
