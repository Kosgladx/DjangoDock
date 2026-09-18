import React, { useState, useEffect, useRef } from 'react';
import {
  X, UserPlus, Sparkles, Check, AlertCircle, Loader2,
  Camera, Upload, Trash2, Image as ImageIcon
} from 'lucide-react';
import type { Teacher } from '../types';
import { api } from '../services/api';

interface NewTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherCreated: (teacher: Teacher) => void;
}

const COLOR_PALETTE = [
  '#1D4ED8', // Blue
  '#4F46E5', // Indigo
  '#6D28D9', // Purple
  '#7C3AED', // Violet
  '#BE123C', // Rose
  '#DB2777', // Pink
  '#15803D', // Emerald
  '#0F766E', // Teal
  '#0891B2', // Cyan
  '#B45309', // Amber
  '#EA580C', // Orange
  '#475569', // Slate
];

/**
 * Derives avatar initials from the teacher's First Name (Nome) and Last Name (Sobrenome).
 * Ignores academic titles/honorifics (Prof., Profª., Dr., etc.).
 */
export const getInitialsFromName = (fullName: string): string => {
  if (!fullName) return 'DOC';
  const cleanName = fullName
    .replace(/^(prof\.?|profª\.?|professor|professora|dr\.?|dra\.?|doutor|doutora|msc\.?|me\.?|ma\.?)\s+/i, '')
    .trim();
  if (!cleanName) return 'DOC';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DOC';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  // Initials of First Name (Nome) and Last Name (Sobrenome)
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return (firstName[0] + lastName[0]).toUpperCase();
};

export const NewTeacherModal: React.FC<NewTeacherModalProps> = ({
  isOpen,
  onClose,
  onTeacherCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarInitials, setAvatarInitials] = useState('');
  const [hasManualInitials, setHasManualInitials] = useState(false);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<number>(20);
  const [maxDailyHours, setMaxDailyHours] = useState<number>(4);
  const [shiftPreference, setShiftPreference] = useState<'ANY' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ANY');
  const [allowDoubleLessons, setAllowDoubleLessons] = useState(true);

  // Photo upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasManualInitials) {
      setAvatarInitials(getInitialsFromName(name));
    }
  }, [name, hasManualInitials]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setAvatarInitials('DOC');
      setHasManualInitials(false);
      setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
      setMaxWeeklyHours(20);
      setMaxDailyHours(4);
      setShiftPreference('ANY');
      setAllowDoubleLessons(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    setErrorMessage(null);
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do professor.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Por favor, informe o e-mail institucional do professor.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const computedInitials = avatarInitials.trim() || getInitialsFromName(name);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('avatar_initials', computedInitials);
      formData.append('color', color || '#1D4ED8');
      formData.append('max_weekly_hours', String(Number(maxWeeklyHours) || 20));
      formData.append('max_daily_hours', String(Number(maxDailyHours) || 4));
      formData.append('shift_preference', shiftPreference);
      formData.append('allow_double_lessons', String(allowDoubleLessons));

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const newTeacher = await api.createTeacher(formData);
      onTeacherCreated(newTeacher);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar professor');
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
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Professor</h2>
              <p className="text-xs text-slate-500">Cadastre um docente para alocação e grade de horários.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Preview Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center space-x-3.5">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Pré-visualização"
                className="w-14 h-14 rounded-full object-cover shadow-xs border-2 border-indigo-500 shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-xs shrink-0 transition-colors border-2 border-white"
                style={{ backgroundColor: `${color}25`, color: color }}
              >
                {avatarInitials || 'DOC'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {name.trim() || 'Nome do Professor'}
                </span>
                {photoPreview ? (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                    Foto anexada
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                    Iniciais: {avatarInitials || 'DOC'}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {email.trim() || 'email.docente@escola.edu.br'}
              </div>
              <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                Carga: {maxWeeklyHours} aulas/sem • Máx {maxDailyHours}/dia • Turno: {shiftPreference === 'ANY' ? 'Qualquer' : shiftPreference}
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>Foto de Perfil & Avatar</span>
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {photoPreview ? 'Foto selecionada' : 'Adicionar foto do professor (Opcional)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {photoPreview
                      ? `${photoFile?.name} (${((photoFile?.size || 0) / 1024).toFixed(1)} KB)`
                      : 'Sem foto, o avatar exibirá as iniciais do Nome e Sobrenome.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {photoPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
                    >
                      Trocar Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold border border-rose-200 transition cursor-pointer"
                      title="Remover foto (usar iniciais)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 hover:border-indigo-300 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info Fields */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Dados Cadastrais</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Prof. Roberto Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                As iniciais do Nome e Sobrenome (ex: <b>{getInitialsFromName(name)}</b>) serão usadas caso não haja foto.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Institucional <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Ex: roberto.silva@escola.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Avatar and Color customization */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personalização Visual</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Iniciais do Avatar (Nome + Sobrenome)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={avatarInitials}
                  onChange={(e) => {
                    setAvatarInitials(e.target.value.toUpperCase());
                    setHasManualInitials(true);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-bold text-center"
                  placeholder="RS"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cor da Tag / Avatar
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        color === c ? 'scale-110 ring-2 ring-indigo-600 ring-offset-1' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Workload and Shift rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Carga Horária & Turno
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Carga Máx. Semanal
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={maxWeeklyHours}
                  onChange={(e) => setMaxWeeklyHours(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <span className="text-[10px] text-slate-400">aulas / semana</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Máx. Aulas/Dia
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxDailyHours}
                  onChange={(e) => setMaxDailyHours(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <span className="text-[10px] text-slate-400">limite diário</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferência Turno
                </label>
                <select
                  value={shiftPreference}
                  onChange={(e) => setShiftPreference(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ANY">Qualquer Turno</option>
                  <option value="MORNING">Manhã</option>
                  <option value="AFTERNOON">Tarde</option>
                  <option value="NIGHT">Noite</option>
                </select>
                <span className="text-[10px] text-slate-400">prioridade solver</span>
              </div>
            </div>
          </div>

          {/* Double Lesson Checkbox */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allowDoubleLessons}
                onChange={(e) => setAllowDoubleLessons(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Permitir aulas geminadas (duas aulas seguidas da mesma disciplina)</span>
            </label>
          </div>

          {/* Footer Buttons */}
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
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Professor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
