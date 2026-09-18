import React from 'react';
import { Calendar, Zap, AlertTriangle, Layers, Users, Clock, RefreshCw, LogOut } from 'lucide-react';
import type { UserSession } from '../pages/LoginPage';

interface NavbarProps {
  activeTab: 'grid' | 'teachers' | 'slots';
  setActiveTab: (tab: 'grid' | 'teachers' | 'slots') => void;
  onRunSolver: () => void;
  isSolving: boolean;
  viabilityScore?: number;
  hasConflicts?: boolean;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRunSolver,
  isSolving,
  hasConflicts = true,
  currentUser,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-100">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900">EduSchedule AI</h1>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
              Timetabling Solver v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500">Ano Letivo 2026 • 1º Semestre • Ensino Médio & Fundamental</p>
        </div>
      </div>

      <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'grid'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Matriz de Horários (Page 1)</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'teachers'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Professores & Disponibilidade (Page 2)</span>
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'slots'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Slots & Grade Horária (Page 3)</span>
        </button>
      </nav>

      <div className="flex items-center space-x-3">
        {hasConflicts && (
          <div className="hidden sm:flex items-center bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-800 font-medium space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>1 Conflito Leve Pendente</span>
          </div>
        )}

        <button
          onClick={onRunSolver}
          disabled={isSolving}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          {isSolving ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          <span>{isSolving ? 'Otimizando...' : 'Executar Solver IA'}</span>
        </button>

        {currentUser && (
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs">
              {currentUser.avatarInitials}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{currentUser.roleLabel}</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Sair / Trocar Usuário"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};