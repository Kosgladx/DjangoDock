import React, { useState, useRef } from 'react';
import {
  X, Upload, Download, FileText, CheckCircle2, AlertCircle,
  Loader2, Trash2, Check
} from 'lucide-react';
import { api } from '../services/api';
import { getInitialsFromName } from './NewTeacherModal';

interface ImportTeachersCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

interface ParsedTeacherRow {
  name: string;
  email: string;
  avatar_initials: string;
  color: string;
  max_weekly_hours: number;
  max_daily_hours: number;
  shift_preference: string;
  isValid: boolean;
  error?: string;
}

const DEFAULT_COLORS = [
  '#1D4ED8', '#4F46E5', '#6D28D9', '#BE123C',
  '#15803D', '#B45309', '#0F766E', '#EA580C'
];

export const ImportTeachersCSVModal: React.FC<ImportTeachersCSVModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTeacherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate and download sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent = [
      'nome,email,iniciais,cor,carga_max_semanal,max_aulas_dia,turno',
      'Prof. Bruno Albuquerque,bruno.albuquerque@escola.edu.br,BA,#1D4ED8,20,4,MORNING',
      'Profª. Camila Guimarães,camila.guimaraes@escola.edu.br,CG,#6D28D9,16,4,ANY',
      'Prof. Diego Siqueira,diego.siqueira@escola.edu.br,DS,#BE123C,18,4,AFTERNOON',
      'Profª. Juliana Martins,juliana.martins@escola.edu.br,JM,#15803D,14,4,NIGHT',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_professores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV content
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setErrorMessage('O arquivo CSV deve conter pelo menos o cabeçalho e uma linha de dados.');
      setParsedRows([]);
      return;
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const nameIdx = headers.findIndex(h => h === 'nome' || h === 'name');
    const emailIdx = headers.findIndex(h => h === 'email' || h === 'e-mail');
    const initialsIdx = headers.findIndex(h => h === 'iniciais' || h === 'avatar_initials');
    const colorIdx = headers.findIndex(h => h === 'cor' || h === 'color');
    const weeklyIdx = headers.findIndex(h => h.includes('semanal') || h.includes('weekly'));
    const dailyIdx = headers.findIndex(h => h.includes('dia') || h.includes('daily'));
    const shiftIdx = headers.findIndex(h => h === 'turno' || h === 'shift' || h === 'shift_preference');

    if (nameIdx === -1 || emailIdx === -1) {
      setErrorMessage('O cabeçalho do CSV deve conter pelo menos as colunas "nome" e "email".');
      setParsedRows([]);
      return;
    }

    const rows: ParsedTeacherRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Handle simple CSV splitting
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const name = cols[nameIdx] || '';
      const email = cols[emailIdx] || '';
      const initials = (initialsIdx !== -1 && cols[initialsIdx]) ? cols[initialsIdx] : getInitialsFromName(name);
      const color = (colorIdx !== -1 && cols[colorIdx]) ? cols[colorIdx] : DEFAULT_COLORS[(i - 1) % DEFAULT_COLORS.length];
      const maxWeekly = (weeklyIdx !== -1 && parseInt(cols[weeklyIdx], 10)) ? parseInt(cols[weeklyIdx], 10) : 20;
      const maxDaily = (dailyIdx !== -1 && parseInt(cols[dailyIdx], 10)) ? parseInt(cols[dailyIdx], 10) : 4;
      const shift = (shiftIdx !== -1 && cols[shiftIdx]) ? cols[shiftIdx].toUpperCase() : 'ANY';

      const isValid = Boolean(name.trim() && email.trim() && email.includes('@'));
      const error = !name.trim()
        ? 'Nome ausente'
        : !email.trim()
        ? 'E-mail ausente'
        : !email.includes('@')
        ? 'E-mail inválido'
        : undefined;

      rows.push({
        name,
        email,
        avatar_initials: initials,
        color,
        max_weekly_hours: maxWeekly,
        max_daily_hours: maxDaily,
        shift_preference: shift,
        isValid,
        error,
      });
    }

    setParsedRows(rows);
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMessage('Nenhum docente válido para importar.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await api.batchCreateTeachers(validRows);
      setSuccessMessage(`Sucesso! ${result.created_count} professores foram importados.`);
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao importar professores.');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Importar Professores via CSV</h2>
              <p className="text-xs text-slate-500">Cadastre múltiplos docentes de forma rápida por planilha.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Download template notice */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-indigo-950">Precisa do modelo padrão de planilha?</p>
                <p className="text-indigo-700">Baixe o modelo CSV com as colunas recomendadas.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 shadow-2xs transition cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Modelo CSV</span>
            </button>
          </div>

          {/* Upload Area */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition cursor-pointer space-y-2"
            >
              <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Clique ou arraste seu arquivo CSV aqui</p>
              <p className="text-[11px] text-slate-400">Suporta arquivos .csv delimitados por vírgula</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="text-xs truncate">
                  <p className="font-bold text-slate-900 truncate">{file.name}</p>
                  <p className="text-slate-500">{((file.size || 0) / 1024).toFixed(1)} KB • {parsedRows.length} linhas lidas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setParsedRows([]); }}
                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                title="Remover arquivo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Prévia dos Docentes ({validCount} válidos de {parsedRows.length})
                </span>
                <span className="text-[10px] text-slate-400">Iniciais calculadas automaticamente se vazias</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200 sticky top-0 font-semibold">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Nome</th>
                      <th className="p-2.5">E-mail</th>
                      <th className="p-2.5 text-center">Iniciais</th>
                      <th className="p-2.5 text-right">Carga/Sem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="inline-flex items-center text-emerald-600 text-[11px] font-bold">
                              <Check className="w-3.5 h-3.5 mr-1" /> Válido
                            </span>
                          ) : (
                            <span className="text-rose-600 text-[10px] font-bold">
                              {r.error}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{r.name}</td>
                        <td className="p-2.5 text-slate-600">{r.email}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${r.color}20`, color: r.color }}
                          >
                            {r.avatar_initials}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-medium text-slate-700">{r.max_weekly_hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2.5 p-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || validCount === 0}
            className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importando...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Importar {validCount} Professores</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
