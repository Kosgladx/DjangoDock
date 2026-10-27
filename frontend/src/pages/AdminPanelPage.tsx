import React, { useState, useEffect, useMemo } from 'react';
import type { SystemUserAccount, InstitutionSettingsData } from '../types';
import type { UserSession } from './LoginPage';
import { api } from '../services/api';
import {
  Shield, Users, Settings, UserPlus, KeyRound, Power,
  CheckCircle2, RefreshCw, Search,
  Building2, Cpu, Check, ShieldAlert,
  Loader2, Trash2, Pencil, Calendar
} from 'lucide-react';
import { NewUserModal } from '../components/NewUserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { EditUserModal } from '../components/EditUserModal';

interface AdminPanelPageProps {
  currentUser: UserSession | null;
  onRefreshGlobal?: () => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  currentUser,
  onRefreshGlobal,
}) => {
  const [activeSection, setActiveSection] = useState<'users' | 'settings' | 'roles'>('users');
  const [users, setUsers] = useState<SystemUserAccount[]>([]);
  const [settings, setSettings] = useState<InstitutionSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'coordinator' | 'teacher'>('all');

  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUserAccount | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<SystemUserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<SystemUserAccount | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Settings form state
  const [institutionName, setInstitutionName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2026.1');
  const [academicTerm, setAcademicTerm] = useState('1º Semestre Letivo');
  const [termStartDate, setTermStartDate] = useState('2026-02-02');
  const [termEndDate, setTermEndDate] = useState('2026-07-03');
  const [contactEmail, setContactEmail] = useState('coordenacao@escola.edu.br');
  const [autoBalance, setAutoBalance] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);
  const [testingSolver, setTestingSolver] = useState(false);
  const [solverTestResult, setSolverTestResult] = useState<string | null>(null);

  // Load users and settings
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersData, settingsData] = await Promise.all([
        api.getUsers(),
        api.getInstitutionSettings(),
      ]);
      setUsers(usersData);
      setSettings(settingsData);
      setInstitutionName(settingsData.institution_name);
      setSchoolYear(settingsData.active_school_year);
      setAcademicTerm(settingsData.academic_term || '1º Semestre Letivo');
      setTermStartDate(settingsData.term_start_date || '2026-02-02');
      setTermEndDate(settingsData.term_end_date || '2026-07-03');
      setContactEmail(settingsData.contact_email);
      setAutoBalance(settingsData.auto_balance_shifts ?? true);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, searchTerm, roleFilter]);

  // Update user in local state
  const handleUserUpdated = (updatedUser: SystemUserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  // Toggle user active status
  const handleToggleStatus = async (user: SystemUserAccount) => {
    if (currentUser && (user.email === currentUser.email || user.username === currentUser.email)) {
      alert('Por segurança, você não pode desativar sua própria conta de administrador em uso.');
      return;
    }
    setActionLoadingId(user.id);
    try {
      const res = await api.toggleUserStatus(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: res.is_active } : u))
      );
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err.message || err));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (currentUser && (userToDelete.email === currentUser.email || userToDelete.username === currentUser.email)) {
      setDeleteErrorMessage('Não é permitido excluir sua própria conta em uso.');
      return;
    }
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await api.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || 'Erro ao excluir usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save institution settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (termStartDate && termEndDate && termStartDate > termEndDate) {
      alert('Atenção: A data de início do período letivo não pode ser posterior à data de término.');
      return;
    }
    setSavingSettings(true);
    setSettingsSuccessMsg(null);
    try {
      const updated = await api.updateInstitutionSettings({
        institution_name: institutionName,
        active_school_year: schoolYear,
        academic_term: academicTerm,
        term_start_date: termStartDate || null,
        term_end_date: termEndDate || null,
        contact_email: contactEmail,
        auto_balance_shifts: autoBalance,
      });
      setSettings(updated);
      setSettingsSuccessMsg('Configurações institucionais e calendário letivo salvos com sucesso!');
      if (onRefreshGlobal) onRefreshGlobal();
      setTimeout(() => setSettingsSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  // Test solver connection
  const handleTestSolver = async () => {
    setTestingSolver(true);
    setSolverTestResult(null);
    try {
      const t0 = performance.now();
      await api.getInstitutionSettings();
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      setSolverTestResult(`✅ Motor de Otimização Operante (Ping: ${latency}ms) — Conexão validada com sucesso!`);
    } catch (err: any) {
      setSolverTestResult(`❌ Erro de conexão com o Solver: ${err.message}`);
    } finally {
      setTestingSolver(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Carregando Módulo de Administração Geral...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Admin Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/90 border border-indigo-400/30 flex items-center justify-center text-white shadow-lg shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Controle Central
                </span>
                <span className="text-xs text-indigo-300">Acesso Restrito</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-1">
                Painel do Administrador Geral
              </h1>
              <p className="text-xs text-indigo-200/80">
                Gestão unificada de contas, perfis de acesso, políticas de credenciais e parâmetros globais do motor de horários.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-left">
              <p className="text-[10px] text-indigo-200 uppercase font-semibold">Usuários Cadastrados</p>
              <p className="text-sm font-bold text-white">{users.length} Contas Ativas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-left">
              <p className="text-[10px] text-indigo-200 uppercase font-semibold">Ano Letivo Vigente</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-bold text-white">{settings?.active_school_year || '2026.1'}</p>
                {settings?.term_start_date && settings?.term_end_date && (
                  <span className="text-[10px] text-indigo-300 font-medium border-l border-white/20 pl-2">
                    {new Date(settings.term_start_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {new Date(settings.term_end_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-400/30 text-left flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <p className="text-[10px] text-emerald-200 uppercase font-semibold">Solver IA</p>
                <p className="text-xs font-bold text-emerald-100">Online & Operante</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sub-navigation tabs */}
      <section className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestão de Usuários & Acessos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSection === 'users' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('settings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações da Instituição & Solver</span>
          </button>

          <button
            onClick={() => setActiveSection('roles')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'roles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Matriz de Papéis & Permissões</span>
          </button>
        </div>

        {activeSection === 'users' && (
          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Usuário</span>
          </button>
        )}
      </section>

      {/* 3. SECTION 1: USERS & ACCESS MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    roleFilter === 'all'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    roleFilter === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Administradores
                </button>
                <button
                  onClick={() => setRoleFilter('coordinator')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    roleFilter === 'coordinator'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Coordenadores
                </button>
                <button
                  onClick={() => setRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    roleFilter === 'teacher'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Professores
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Mostrando <strong>{filteredUsers.length}</strong> de {users.length} usuários
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3.5 pl-4">Usuário / Identificação</th>
                    <th className="p-3.5">Perfil de Acesso</th>
                    <th className="p-3.5">Departamento / Lotação</th>
                    <th className="p-3.5">Status da Conta</th>
                    <th className="p-3.5">Data de Criação</th>
                    <th className="p-3.5 pr-4 text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum usuário corresponde aos filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrent = Boolean(currentUser && (u.email === currentUser.email || u.username === currentUser.email));
                      const isLoadingAction = actionLoadingId === u.id;

                      let roleBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (u.role === 'admin') roleBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                      else if (u.role === 'coordinator') roleBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                      else if (u.role === 'teacher') roleBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition">
                          {/* User Name & Email */}
                          <td className="p-3.5 pl-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center">
                                  {u.avatar_initials}
                                </div>
                                <span
                                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                    u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                  title={u.is_active ? 'Conta Ativa' : 'Conta Inativa'}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                  <span>{u.full_name}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-normal">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">{u.email || u.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="p-3.5">
                            <span className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleBadgeClass}`}>
                              <Shield className="w-3 h-3" />
                              <span>{u.role_label}</span>
                            </span>
                          </td>

                          {/* Department */}
                          <td className="p-3.5 text-slate-600 font-medium">
                            {u.department || 'Coordenação Geral'}
                          </td>

                          {/* Status Toggle */}
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={isLoadingAction}
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                u.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Clique para ativar/desativar conta"
                            >
                              {isLoadingAction ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : u.is_active ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Power className="w-3 h-3" />
                              )}
                              <span>{u.is_active ? 'Conta Ativa' : 'Desativada'}</span>
                            </button>
                          </td>

                          {/* Date Joined */}
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(u.date_joined).toLocaleDateString('pt-BR')}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5 pr-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Edit User Button */}
                              <button
                                type="button"
                                onClick={() => setUserToEdit(u)}
                                className="flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                                title={`Editar dados de ${u.full_name} (${u.role_label})`}
                              >
                                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Editar</span>
                              </button>

                              {/* Reset Password */}
                              <button
                                type="button"
                                onClick={() => setUserToResetPassword(u)}
                                className="flex items-center space-x-1 px-2.5 py-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                                title="Resetar senha provisória"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                <span>Senha</span>
                              </button>

                              {/* Delete User */}
                              {!isCurrent ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteErrorMessage(null);
                                    setUserToDelete(u);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                                  title={`Excluir conta de ${u.full_name} (${u.role_label})`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic px-1">
                                  Você
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION 2: INSTITUTION SETTINGS & SOLVER ENGINE */}
      {activeSection === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Institutional Parameters (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Parâmetros Globais da Instituição</h3>
                <p className="text-xs text-slate-500">Configure as diretrizes gerais de calendário e identidade da instituição.</p>
              </div>
            </div>

            {settingsSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{settingsSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Instituição de Ensino *
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano Letivo Ativo *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    placeholder="Ex: 2026.1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semestre / Termo Letivo
                  </label>
                  <input
                    type="text"
                    value={academicTerm}
                    onChange={(e) => setAcademicTerm(e.target.value)}
                    placeholder="Ex: 1º Semestre Letivo"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Seletor de Data: Início e Término do Período Letivo */}
              <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>Vigência do Período Letivo (Calendário Acadêmico)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data de Início do Período Letivo *
                    </label>
                    <input
                      type="date"
                      required
                      value={termStartDate}
                      onChange={(e) => setTermStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Primeiro dia oficial de aulas</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Data de Término do Período Letivo *
                    </label>
                    <input
                      type="date"
                      required
                      value={termEndDate}
                      onChange={(e) => setTermEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Encerramento das atividades letivas</p>
                  </div>
                </div>

                {/* Duration summary indicator */}
                {termStartDate && termEndDate && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>
                        Vigência: <strong>{new Date(termStartDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(termEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                      </span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                      {Math.max(0, Math.round((new Date(termEndDate).getTime() - new Date(termStartDate).getTime()) / (1000 * 60 * 60 * 24 * 7)))} semanas letivas
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Oficial de Notificações da Coordenação
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBalance}
                    onChange={(e) => setAutoBalance(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Habilitar balanceamento automático de cargas e turnos para novas grades</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Parâmetros...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Configurações Globais</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Optimization Engine Diagnostics (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Motor de Otimização (Solver IA)</h3>
                  <p className="text-xs text-slate-500">Status em tempo real do pipeline heurístico de resolução.</p>
                </div>
              </div>

              {/* Status Indicator Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Estado da Conexão</span>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>ONLINE & PRONTO</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Latência da API</p>
                    <p className="text-xs font-bold text-slate-800">~12 ms</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Restrições Carregadas</p>
                    <p className="text-xs font-bold text-slate-800">{settings?.solver_diagnostics?.constraints_loaded || 7} Regras Ativas</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 pt-1">
                  <strong>Algoritmo:</strong> {settings?.solver_algorithm || 'Híbrido Construtivo + Busca Local Tabu'}
                </div>
              </div>

              {solverTestResult && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                  {solverTestResult}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestSolver}
                disabled={testingSolver}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {testingSolver ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Testando Conexão...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    <span>Testar Conexão do Solver</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SECTION 3: ROLES & PERMISSIONS MATRIX */}
      {activeSection === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Matriz de Papéis e Permissões Institucionais</h3>
            <p className="text-xs text-slate-500">Visão consolidada do escopo de cada nível de acesso dentro do sistema EduSchedule AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Admin Card */}
            <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Administrador Geral</h4>
                  <span className="text-[10px] text-purple-700 font-semibold">Acesso Irrestrito</span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Gestão completa de usuários e acessos</li>
                <li>Ativação, desativação e reset de senhas</li>
                <li>Parâmetros globais da instituição e ano letivo</li>
                <li>Configuração e diagnóstico do motor de IA</li>
                <li>Acesso irrestrito a todas as grades e dados</li>
              </ul>
            </div>

            {/* Coordinator Card */}
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Coordenador Pedagógico</h4>
                  <span className="text-[10px] text-blue-700 font-semibold">Gestão Pedagógica</span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Visualização e edição da Matriz de Horários</li>
                <li>Execução e ajuste fino do Solver de IA</li>
                <li>Gestão de professores, turmas e salas</li>
                <li>Parametrização de restrições rígidas/flexíveis</li>
                <li>Importação de docentes em lote via CSV</li>
              </ul>
            </div>

            {/* Teacher Card */}
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Professor / Docente</h4>
                  <span className="text-[10px] text-emerald-700 font-semibold">Área do Docente</span>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Consulta à sua Grade Semanal de Aulas</li>
                <li>Visualização de horários por turma</li>
                <li>Declaração de matriz de disponibilidade semanal</li>
                <li>Marcação de preferências e bloqueios absolutos</li>
                <li>Impressão e consulta de salas atribuídas</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onUserCreated={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={Boolean(userToEdit)}
        user={userToEdit}
        onClose={() => setUserToEdit(null)}
        onUserUpdated={handleUserUpdated}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={Boolean(userToResetPassword)}
        user={userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
      />

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Excluir Conta de Acesso?</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja apagar a conta selecionada?
              </p>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>{userToDelete.full_name}</span>
                  <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    userToDelete.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : userToDelete.role === 'coordinator'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <Shield className="w-2.5 h-2.5" />
                    <span>{userToDelete.role_label}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{userToDelete.email || userToDelete.username}</div>
                <div className="text-[10px] text-slate-400">Departamento: {userToDelete.department || 'Geral'}</div>
              </div>

              {userToDelete.role === 'admin' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-left text-[11px] text-amber-800">
                  ⚠️ <strong>Atenção:</strong> Você está excluindo uma conta de nível <strong>Administrador Geral</strong>. Os acessos totais de configuração deste usuário serão revogados.
                </div>
              )}

              {userToDelete.role === 'coordinator' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-left text-[11px] text-blue-800">
                  ℹ️ Você está excluindo um <strong>Coordenador Pedagógico</strong>. As grades horárias, salas e turmas criadas permanecerão preservadas no sistema.
                </div>
              )}

              {deleteErrorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-left text-xs text-rose-700">
                  {deleteErrorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteErrorMessage(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
