import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Loader2, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Flame, 
  Clock,
  X
} from 'lucide-react';

export interface ImpactConsequence {
  title: string;
  detail: string;
  severity?: 'critical' | 'high' | 'medium';
}

interface BlastRadiusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  entityName: string;
  entityType: string;
  consequences: ImpactConsequence[];
  isDeleting?: boolean;
  errorMessage?: string | null;
}

export const BlastRadiusModal: React.FC<BlastRadiusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  entityType,
  consequences,
  isDeleting = false,
  errorMessage = null,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  // Reset countdown whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(10);
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLocked = secondsRemaining > 0;
  const progressPercent = ((10 - secondsRemaining) / 10) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500/30 w-full max-w-lg overflow-hidden flex flex-col transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Danger Header Strip */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 px-6 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
              <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-100">
                {title || 'Alerta de Exclusão em Cascata'}
              </span>
              <h2 className="text-sm font-bold text-white leading-tight">
                Raio de Impacto (Blast Radius)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Target Entity Banner */}
          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl flex items-start space-x-3.5">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Alvo Selecionado para Destruição
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {entityName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tipo: <span className="font-semibold text-slate-700 dark:text-slate-300">{entityType}</span>
              </div>
            </div>
          </div>

          {/* Explanatory Message */}
          <div className="space-y-1 text-left">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Danos Colaterais Imediatos:</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A exclusão não se limita a este registro. O banco de dados eliminará em cascata os seguintes vínculos:
            </p>
          </div>

          {/* Consequences List */}
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {consequences.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start space-x-3 text-left transition hover:border-rose-300 dark:hover:border-rose-700/50"
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  item.severity === 'critical' 
                    ? 'bg-rose-600 ring-4 ring-rose-100 dark:ring-rose-950' 
                    : item.severity === 'high' 
                    ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950' 
                    : 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 10-Second Friction Bar */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-amber-400">
                {isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Fricção de Segurança:</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400">Ação Desbloqueada:</span>
                  </>
                )}
              </div>
              <span className={`font-mono font-bold text-xs ${isLocked ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {isLocked ? `Aguarde ${secondsRemaining}s...` : 'Liberado para confirmação'}
              </span>
            </div>

            {/* Countdown Progress Track */}
            <div className="w-full h-2 bg-amber-200/50 dark:bg-amber-900/40 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  isLocked ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              {isLocked 
                ? 'Tempo obrigatório para reflexão e análise do impacto colateral.'
                : 'Atenção: Esta ação é definitiva e não pode ser revertida.'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Cancelar (Manter Dados)
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLocked || isDeleting}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md ${
                isLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/30 cursor-pointer animate-pulse'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Exclusão...</span>
                </>
              ) : isLocked ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Aguarde {secondsRemaining}s</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Exclusão em Cascata</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlastRadiusModal;
