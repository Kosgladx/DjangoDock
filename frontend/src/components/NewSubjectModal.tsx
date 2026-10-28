import React, { useState, useEffect } from 'react';
import { X, BookOpen, Pencil, Plus, Loader2, AlertCircle } from 'lucide-react';
import type { Subject } from '../types';
import { api } from '../services/api';

interface NewSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  subjectToEdit?: Subject | null;
}

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#D97706', // Warm Amber
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#A855F7', // Violet
  '#059669', // Deep Emerald
  '#2563EB', // Royal Blue
  '#DC2626', // Red
];

export const NewSubjectModal: React.FC<NewSubjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  subjectToEdit,
}) => {
  const isEditing = Boolean(subjectToEdit);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [requiresLab, setRequiresLab] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setName(subjectToEdit.name || '');
        setCode(subjectToEdit.code || '');
        setColor(subjectToEdit.color || COLOR_PALETTE[0]);
        setRequiresLab(subjectToEdit.requires_lab ?? false);
      } else {
        setName('');
        setCode('');
        setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
        setRequiresLab(false);
      }
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, subjectToEdit]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !code) {
      // Suggest 3-letter code from name
      const clean = val.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '').slice(0, 3).toUpperCase();
      if (clean) setCode(clean);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('O nome da disciplina é obrigatório.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('A sigla/código da disciplina é obrigatória.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase().slice(0, 10),
        color,
        requires_lab: Boolean(requiresLab),
      };

      if (isEditing && subjectToEdit) {
        await api.updateSubject(subjectToEdit.id, payload);
      } else {
        await api.createSubject(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar disciplina.');
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
              {isEditing ? <Pencil className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Atualize dados cadastrais e cor visual.' : 'Cadastre uma matéria para compor a matriz curricular.'}
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome da Matéria <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Matemática II, Física Geral"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código / Sigla <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="Ex: MAT"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              />
            </div>
          </div>

          {/* Color Palette Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Cor Temática na Grade</span>
              <span className="text-[10px] font-mono text-slate-400">{color}</span>
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition transform hover:scale-110 cursor-pointer shadow-xs border-2 ${
                    color === c ? 'border-indigo-600 scale-110 ring-2 ring-indigo-300' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Badge Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Prévia do Card na Grade:</span>
            <div
              className="px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center space-x-2"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color: color,
              }}
            >
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-white text-slate-900 shadow-2xs">
                {code || 'MAT'}
              </span>
              <span>{name || 'Nome da Disciplina'}</span>
            </div>
          </div>

          {/* Requires Lab Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="chk-requires-lab"
              checked={requiresLab}
              onChange={(e) => setRequiresLab(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="chk-requires-lab" className="text-xs font-medium text-slate-700 cursor-pointer">
              <span className="font-bold text-slate-900 block">Exige Espaço / Laboratório Especial</span>
              <span className="text-slate-500 text-[11px]">Disciplinas práticas como Química, Física ou Informática.</span>
            </label>
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
                  <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Disciplina'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
