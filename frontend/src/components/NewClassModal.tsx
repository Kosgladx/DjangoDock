import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Pencil, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { SchoolClass, Shift } from '../types';
import { api } from '../services/api';

interface NewClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  classToEdit?: SchoolClass | null;
  shifts: Shift[];
}

export const NewClassModal: React.FC<NewClassModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  classToEdit,
  shifts,
}) => {
  const isEditing = Boolean(classToEdit);

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('3º Ano Ensino Médio');
  const [shiftId, setShiftId] = useState<number>(shifts[0]?.id || 1);
  const [studentCount, setStudentCount] = useState(35);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (classToEdit) {
        setName(classToEdit.name || '');
        setGradeLevel(classToEdit.grade_level || '3º Ano Ensino Médio');
        setShiftId(classToEdit.shift || shifts[0]?.id || 1);
        setStudentCount(classToEdit.student_count || 35);
      } else {
        setName('');
        setGradeLevel('3º Ano Ensino Médio');
        setShiftId(shifts[0]?.id || 1);
        setStudentCount(35);
      }
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, classToEdit, shifts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('O nome da turma é obrigatório.');
      return;
    }
    if (!shiftId) {
      setErrorMessage('Selecione um turno para a turma.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload = {
        name: name.trim(),
        grade_level: gradeLevel.trim(),
        shift: Number(shiftId),
        student_count: Number(studentCount) || 35,
      };

      if (isEditing && classToEdit) {
        await api.updateClass(classToEdit.id, payload);
      } else {
        await api.createClass(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar dados da turma.');
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
              {isEditing ? <Pencil className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Editar Turma' : 'Nova Turma'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Atualize as informações da turma escolar.' : 'Cadastre uma nova turma para alocação na grade.'}
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
              Nome da Turma <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 3º Ano A, Turma 101, 1º Ano B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Série / Grau Escolar
            </label>
            <input
              type="text"
              placeholder="Ex: 3º Ano Ensino Médio, 9º Ano Fundamental"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Turno de Aulas <span className="text-rose-500">*</span>
              </label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qtd. Alunos
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={studentCount}
                onChange={(e) => setStudentCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Turma'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
