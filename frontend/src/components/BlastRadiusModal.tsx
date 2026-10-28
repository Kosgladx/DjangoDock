import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Loader2, 
  Clock, 
  AlertTriangle,
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

  // Reinicia o timer sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(10);
      const timer = setInterval(() => {
        setSecondsRemaining((prev: number) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Minimalista */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {entityType}: <strong className="text-slate-700 dark:text-slate-200">{entityName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensagem de Erro (se houver) */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Danos Colaterais Imediatos em Bullet Points */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Danos Colaterais Imediatos:
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {consequences.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-slate-800 dark:text-slate-200">{item.title}:</strong>{' '}
                  <span>{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Aviso Minimalista Pré-Ação */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Atenção: Esta ação é definitiva e não pode ser revertida.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLocked || isDeleting}
            className={`flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              isLocked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : isLocked ? (
              <>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Aguarde ({secondsRemaining}s)</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlastRadiusModal;
