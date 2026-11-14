import React, { useState } from 'react';
import {
  Calendar, Zap, AlertTriangle, Layers, Users, Clock,
  RefreshCw, LogOut, GraduationCap, Shield, Menu, X
} from 'lucide-react';
import type { UserSession } from '../pages/LoginPage';

interface NavbarProps {
  activeTab: 'grid' | 'teachers' | 'slots' | 'teacher-portal' | 'admin-panel';
  setActiveTab: (tab: 'grid' | 'teachers' | 'slots' | 'teacher-portal' | 'admin-panel') => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectTab = (tab: NavbarProps['activeTab']) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-ink truncate">EduSchedule AI</h1>
              <span className="hidden sm:inline-flex text-[11px] ds-badge-primary px-2 py-0.5 rounded-full shrink-0">
                Timetabling Solver v2.4
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Ano Letivo 2026 • 1º Semestre • Ensino Médio & Fundamental
            </p>
          </div>
        </div>

        <nav className="hidden xl:flex items-center space-x-1 bg-canvas p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleSelectTab('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'grid'
                ? 'bg-white text-primary shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matriz de Horários</span>
          </button>

          <button
            onClick={() => handleSelectTab('teachers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-white text-primary shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-ink'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Professores (Admin)</span>
          </button>

          <button
            onClick={() => handleSelectTab('slots')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'slots'
                ? 'bg-white text-primary shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-ink'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Slots & Grade</span>
          </button>

          <button
            onClick={() => handleSelectTab('teacher-portal')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'teacher-portal'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-indigo-50 text-secondary border-tertiary hover:bg-tertiary/70'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Área do Professor</span>
          </button>

          <button
            onClick={() => handleSelectTab('admin-panel')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              activeTab === 'admin-panel'
                ? 'bg-secondary text-white border-secondary shadow-xs'
                : 'bg-indigo-50 text-secondary border-tertiary hover:bg-tertiary/70'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administração</span>
          </button>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {hasConflicts && (
            <div className="hidden 2xl:flex items-center bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-800 font-medium space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>1 Conflito Leve Pendente</span>
            </div>
          )}

          <button
            onClick={onRunSolver}
            disabled={isSolving}
            className="hidden sm:flex items-center space-x-1.5 ds-btn-primary disabled:opacity-75 px-3.5 py-2 text-xs cursor-pointer"
          >
            {isSolving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>{isSolving ? 'Otimizando...' : 'Executar Solver IA'}</span>
          </button>

          {currentUser && (
            <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-tertiary text-secondary border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.avatarInitials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-ink leading-tight">{currentUser.name}</p>
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="xl:hidden p-2 rounded-xl border border-slate-200 bg-canvas text-ink hover:bg-tertiary/50 transition"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectTab('grid')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'grid'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-canvas text-slate-700 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Matriz de Horários</span>
            </button>

            <button
              onClick={() => handleSelectTab('teachers')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'teachers'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-canvas text-slate-700 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Professores (Admin)</span>
            </button>

            <button
              onClick={() => handleSelectTab('slots')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'slots'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-canvas text-slate-700 border border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Slots & Grade</span>
            </button>

            <button
              onClick={() => handleSelectTab('teacher-portal')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'teacher-portal'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-indigo-50 text-secondary border border-tertiary'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Área do Professor</span>
            </button>

            <button
              onClick={() => handleSelectTab('admin-panel')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition sm:col-span-2 ${
                activeTab === 'admin-panel'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-indigo-50 text-secondary border border-tertiary'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Administração</span>
            </button>
          </div>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onRunSolver();
            }}
            disabled={isSolving}
            className="sm:hidden w-full flex items-center justify-center space-x-1.5 ds-btn-primary disabled:opacity-75 px-4 py-2.5 text-xs"
          >
            {isSolving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isSolving ? 'Otimizando...' : 'Executar Solver IA'}</span>
          </button>
        </div>
      )}
    </header>
  );
};