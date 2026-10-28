import React, { useState, useEffect, useMemo } from 'react';
import type {
  SystemUserAccount, InstitutionSettingsData, SchoolClass, Subject,
  CurriculumRequirement, Shift, Teacher
} from '../types';
import type { UserSession } from './LoginPage';
import { api } from '../services/api';
import {
  Shield, Users, Settings, UserPlus, KeyRound, Power,
  CheckCircle2, RefreshCw, Search,
  Building2, Cpu, Check, ShieldAlert,
  Loader2, Trash2, Pencil,
  GraduationCap, BookOpen, Layers, Plus
} from 'lucide-react';
import { NewUserModal } from '../components/NewUserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { EditUserModal } from '../components/EditUserModal';
import { NewClassModal } from '../components/NewClassModal';
import { NewSubjectModal } from '../components/NewSubjectModal';
import { NewCurriculumModal } from '../components/NewCurriculumModal';
import { BlastRadiusModal } from '../components/BlastRadiusModal';

interface AdminPanelPageProps {
  currentUser: UserSession | null;
  onRefreshGlobal?: () => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  currentUser,
  onRefreshGlobal,
}) => {
  const [activeSection, setActiveSection] = useState<'users' | 'classes-subjects' | 'curriculum' | 'settings' | 'roles'>('users');
  const [loading, setLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<SystemUserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'coordinator' | 'teacher'>('all');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUserAccount | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<SystemUserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<SystemUserAccount | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Classes & Subjects state
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classSubTab, setClassSubTab] = useState<'classes' | 'subjects'>('classes');
  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Class Modals
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<SchoolClass | null>(null);
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  // Subject Modals
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  // Curriculum State & Modals
  const [curriculum, setCurriculum] = useState<CurriculumRequirement[]>([]);
  const [selectedCurriculumClassId, setSelectedCurriculumClassId] = useState<number>(1);
  const [isNewCurriculumModalOpen, setIsNewCurriculumModalOpen] = useState(false);
  const [curriculumToEdit, setCurriculumToEdit] = useState<CurriculumRequirement | null>(null);
  const [curriculumToDelete, setCurriculumToDelete] = useState<CurriculumRequirement | null>(null);
  const [isDeletingCurriculum, setIsDeletingCurriculum] = useState(false);

  // Settings form state
  const [, setSettings] = useState<InstitutionSettingsData | null>(null);
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

  // Load all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersData, settingsData, classesData, subjectsData, shiftsData, teachersData, curriculumData] = await Promise.all([
        api.getUsers(),
        api.getInstitutionSettings(),
        api.getClasses(),
        api.getSubjects(),
        api.getShifts(),
        api.getTeachers(),
        api.getCurriculum(),
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

      setClasses(classesData);
      setSubjects(subjectsData);
      setShifts(shiftsData);
      setTeachers(teachersData);
      setCurriculum(curriculumData);

      if (classesData.length > 0 && !selectedCurriculumClassId) {
        setSelectedCurriculumClassId(classesData[0].id);
      }
    } catch (err) {
      console.error('Falha ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Filtered classes and subjects
  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
        c.grade_level?.toLowerCase().includes(classSearch.toLowerCase())
    );
  }, [classes, classSearch]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  // Curriculum for selected class
  const classCurriculum = useMemo(() => {
    return curriculum.filter((c) => c.school_class === selectedCurriculumClassId);
  }, [curriculum, selectedCurriculumClassId]);

  const totalLessonsInSelectedClass = useMemo(() => {
    return classCurriculum.reduce((acc, curr) => acc + (curr.weekly_lessons || 0), 0);
  }, [classCurriculum]);

  const selectedClassObj = useMemo(() => {
    return classes.find((c) => c.id === selectedCurriculumClassId);
  }, [classes, selectedCurriculumClassId]);

  // User Actions
  const handleToggleStatus = async (user: SystemUserAccount) => {
    if (user.email === currentUser?.email) {
      alert('Você não pode desativar sua própria conta ativa.');
      return;
    }
    try {
      setActionLoadingId(user.id);
      const res = await api.toggleUserStatus(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: res.is_active } : u))
      );
    } catch (err: any) {
      alert('Erro ao alterar status: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteErrorMessage(null);
      await api.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || 'Falha ao remover usuário.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Class Delete Action
  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      setIsDeletingClass(true);
      await api.deleteClass(classToDelete.id);
      setClasses((prev) => prev.filter((c) => c.id !== classToDelete.id));
      setClassToDelete(null);
      if (selectedCurriculumClassId === classToDelete.id) {
        setSelectedCurriculumClassId(classes.find((c) => c.id !== classToDelete.id)?.id || 1);
      }
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert('Erro ao excluir turma: ' + err.message);
    } finally {
      setIsDeletingClass(false);
    }
  };

  // Subject Delete Action
  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    try {
      setIsDeletingSubject(true);
      await api.deleteSubject(subjectToDelete.id);
      setSubjects((prev) => prev.filter((s) => s.id !== subjectToDelete.id));
      setSubjectToDelete(null);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert('Erro ao excluir disciplina: ' + err.message);
    } finally {
      setIsDeletingSubject(false);
    }
  };

  // Curriculum Delete Action
  const handleConfirmDeleteCurriculum = async () => {
    if (!curriculumToDelete) return;
    try {
      setIsDeletingCurriculum(true);
      await api.deleteCurriculumRequirement(curriculumToDelete.id);
      setCurriculum((prev) => prev.filter((c) => c.id !== curriculumToDelete.id));
      setCurriculumToDelete(null);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert('Erro ao remover item da matriz: ' + err.message);
    } finally {
      setIsDeletingCurriculum(false);
    }
  };

  const handleUserCreated = (newUser: SystemUserAccount) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleUserUpdated = (updatedUser: SystemUserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccessMsg(null);
      const updated = await api.updateInstitutionSettings({
        institution_name: institutionName,
        active_school_year: schoolYear,
        academic_term: academicTerm,
        term_start_date: termStartDate,
        term_end_date: termEndDate,
        contact_email: contactEmail,
        auto_balance_shifts: autoBalance,
      });
      setSettings(updated);
      setSettingsSuccessMsg('Configurações institucionais e diretrizes salvas com sucesso!');
      setTimeout(() => setSettingsSuccessMsg(null), 5000);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert('Erro ao atualizar configurações: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSolver = async () => {
    try {
      setTestingSolver(true);
      setSolverTestResult(null);
      const res = await api.runSolver('Teste de Calibração IA (Admin)', schoolYear);
      setSolverTestResult(
        `Diagnóstico Concluído com Sucesso! Viabilidade: ${res.viability_score}% | Violações Rígidas: ${res.hard_violations} | Tempo: ${res.execution_time}s`
      );
    } catch (err: any) {
      setSolverTestResult('Falha no teste do motor: ' + err.message);
    } finally {
      setTestingSolver(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Carregando painel de administração...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Admin Header Banner */}
      <section className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-purple-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>EduSchedule • Centro de Governança & Parâmetros</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Painel de Administração
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
              {currentUser?.role === 'admin' ? 'Acesso Total (Superusuário)' : 'Coordenação Pedagógica'}
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Gestão unificada do ecossistema: contas de usuários, turmas, disciplinas, matrizes curriculares e parâmetros do motor IA.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Solver IA Operante</span>
          </div>
        </div>
      </section>

      {/* 2. Sub-navigation tabs */}
      <section className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'users'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários & Acessos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSection === 'users' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('classes-subjects')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'classes-subjects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Turmas & Disciplinas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSection === 'classes-subjects' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {classes.length + subjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('curriculum')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'curriculum'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matriz Curricular</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSection === 'curriculum' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {curriculum.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('settings')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Parâmetros & Solver</span>
          </button>

          <button
            onClick={() => setActiveSection('roles')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition cursor-pointer ${
              activeSection === 'roles'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Matriz RBAC</span>
          </button>
        </div>

        {/* Action button corresponding to active section */}
        <div>
          {activeSection === 'users' && (
            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          )}

          {activeSection === 'classes-subjects' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setClassToEdit(null);
                  setIsNewClassModalOpen(true);
                }}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Turma</span>
              </button>
              <button
                onClick={() => {
                  setSubjectToEdit(null);
                  setIsNewSubjectModalOpen(true);
                }}
                className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Disciplina</span>
              </button>
            </div>
          )}

          {activeSection === 'curriculum' && (
            <button
              onClick={() => {
                setCurriculumToEdit(null);
                setIsNewCurriculumModalOpen(true);
              }}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular Disciplina</span>
            </button>
          )}
        </div>
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
                {(['all', 'admin', 'coordinator', 'teacher'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      roleFilter === r
                        ? 'bg-indigo-100 text-indigo-700 font-bold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'all' && 'Todos'}
                    {r === 'admin' && 'Administradores'}
                    {r === 'coordinator' && 'Coordenação'}
                    {r === 'teacher' && 'Professores'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Exibindo <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> contas
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="p-3.5 pl-6">Usuário</th>
                    <th className="p-3.5">Papel / Perfil</th>
                    <th className="p-3.5">Departamento</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Último Acesso</th>
                    <th className="p-3.5 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.email === currentUser?.email;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 pl-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {u.avatar_initials || 'US'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                  <span>{u.full_name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500">{u.email || u.username}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                u.role === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : u.role === 'coordinator'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <Shield className="w-3 h-3" />
                              <span>{u.role_label}</span>
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-600 font-medium">
                            {u.department || 'Coordenação Pedagógica'}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                u.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span>{u.is_active ? 'Ativo' : 'Inativo'}</span>
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-500 text-[11px]">
                            {u.last_login
                              ? new Date(u.last_login).toLocaleDateString('pt-BR')
                              : 'Nunca acessou'}
                          </td>

                          <td className="p-3.5 pr-6 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                disabled={actionLoadingId === u.id || isSelf}
                                className={`p-1.5 rounded-lg transition cursor-pointer border ${
                                  u.is_active
                                    ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-200'
                                } disabled:opacity-40`}
                                title={u.is_active ? 'Desativar conta' : 'Ativar conta'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setUserToResetPassword(u)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-200"
                                title="Resetar senha"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setUserToEdit(u)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-200"
                                title="Editar dados"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {!isSelf ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteErrorMessage(null);
                                    setUserToDelete(u);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                                  title={`Excluir conta de ${u.full_name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic px-1">Você</span>
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

      {/* 4. SECTION 2: CLASSES & SUBJECTS DUAL MANAGEMENT */}
      {activeSection === 'classes-subjects' && (
        <div className="space-y-6">
          {/* Sub-tab Switcher */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setClassSubTab('classes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                classSubTab === 'classes'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Turmas Escolares ({classes.length})</span>
            </button>
            <button
              onClick={() => setClassSubTab('subjects')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                classSubTab === 'subjects'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Disciplinas Curriculares ({subjects.length})</span>
            </button>
          </div>

          {/* SUB-VIEW 1: CLASSES */}
          {classSubTab === 'classes' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar turma por nome ou série..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  onClick={() => {
                    setClassToEdit(null);
                    setIsNewClassModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Turma</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                    Nenhuma turma escolar cadastrada.
                  </div>
                ) : (
                  filteredClasses.map((cls) => {
                    const shiftObj = shifts.find((s) => s.id === cls.shift);
                    return (
                      <div
                        key={cls.id}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              📚
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{cls.name}</h4>
                              <p className="text-xs text-slate-500">{cls.grade_level}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setClassToEdit(cls);
                                setIsNewClassModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Editar turma"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setClassToDelete(cls)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Excluir turma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-[10px] text-slate-400 block font-semibold">Turno</span>
                            <span className="font-bold text-slate-700">{cls.shift_name || shiftObj?.name || 'Matutino'}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-[10px] text-slate-400 block font-semibold">Estudantes</span>
                            <span className="font-bold text-slate-700">{cls.student_count} alunos</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">Aulas na Matriz:</span>
                          <span className="font-bold text-indigo-600">{cls.total_weekly_lessons || 25} tempos/sem</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: SUBJECTS */}
          {classSubTab === 'subjects' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar disciplina por nome ou código..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  onClick={() => {
                    setSubjectToEdit(null);
                    setIsNewSubjectModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Disciplina</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                    Nenhuma disciplina cadastrada.
                  </div>
                ) : (
                  filteredSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-200 transition space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.code}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{sub.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-slate-400">{sub.code}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectToEdit(sub);
                              setIsNewSubjectModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Editar disciplina"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubjectToDelete(sub)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir disciplina"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-200 inline-block"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="font-mono text-[11px] text-slate-500">{sub.color}</span>
                        </div>
                        {sub.requires_lab ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            Requer Lab
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sala Comum</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION 3: CURRICULUM REQUIREMENTS MATRIX */}
      {activeSection === 'curriculum' && (
        <div className="space-y-5">
          {/* Class Filter & Summary Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Turma Selecionada:
              </label>
              <select
                value={selectedCurriculumClassId}
                onChange={(e) => setSelectedCurriculumClassId(Number(e.target.value))}
                className="bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-bold rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    📚 {c.name} ({c.grade_level})
                  </option>
                ))}
              </select>
            </div>

            {/* Allocation Meter */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-semibold block">Carga Horária Semanal:</span>
                <span
                  className={`text-sm font-extrabold ${
                    totalLessonsInSelectedClass === 25
                      ? 'text-emerald-600'
                      : totalLessonsInSelectedClass > 25
                      ? 'text-rose-600'
                      : 'text-amber-600'
                  }`}
                >
                  {totalLessonsInSelectedClass} / 25 Tempos
                </span>
              </div>
              <div className="w-28 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    totalLessonsInSelectedClass === 25
                      ? 'bg-emerald-500'
                      : totalLessonsInSelectedClass > 25
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalLessonsInSelectedClass / 25) * 100)}%` }}
                />
              </div>

              <button
                onClick={() => {
                  setCurriculumToEdit(null);
                  setIsNewCurriculumModalOpen(true);
                }}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Disciplina</span>
              </button>
            </div>
          </div>

          {/* Curriculum Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="p-3.5 pl-6">Disciplina</th>
                    <th className="p-3.5">Professor Titular</th>
                    <th className="p-3.5 text-center">Aulas Semanais</th>
                    <th className="p-3.5 text-center">Geminadas?</th>
                    <th className="p-3.5 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {classCurriculum.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Nenhuma disciplina vinculada à matriz da turma {selectedClassObj?.name || ''}. Clique em "Adicionar Disciplina" para iniciar.
                      </td>
                    </tr>
                  ) : (
                    classCurriculum.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 pl-6">
                          <div className="flex items-center space-x-3">
                            <span
                              className="w-7 h-7 rounded-lg text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0"
                              style={{ backgroundColor: item.subject_color || '#3B82F6' }}
                            >
                              {item.subject_code || 'MAT'}
                            </span>
                            <span className="font-bold text-slate-900">{item.subject_name}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-medium text-slate-700">👨‍🏫 {item.teacher_name}</span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                            {item.weekly_lessons} aulas/sem
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          {item.double_lessons_allowed ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              Sim
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Não</span>
                          )}
                        </td>

                        <td className="p-3.5 pr-6 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCurriculumToEdit(item);
                                setIsNewCurriculumModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Editar vínculo"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurriculumToDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remover da matriz"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. SECTION 4: INSTITUTION SETTINGS & SOLVER ENGINE */}
      {activeSection === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Institutional Parameters */}
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
                    placeholder="2026.1"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Período / Semestre
                  </label>
                  <input
                    type="text"
                    value={academicTerm}
                    onChange={(e) => setAcademicTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Início das Aulas
                  </label>
                  <input
                    type="date"
                    value={termStartDate}
                    onChange={(e) => setTermStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Término do Período
                  </label>
                  <input
                    type="date"
                    value={termEndDate}
                    onChange={(e) => setTermEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail de Notificações da Coordenação
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="chk-auto-balance"
                  checked={autoBalance}
                  onChange={(e) => setAutoBalance(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="chk-auto-balance" className="text-xs font-medium text-slate-700 cursor-pointer">
                  <span className="font-bold text-slate-900 block">Equilíbrio Automático de Turnos</span>
                  <span className="text-slate-500 text-[11px]">Distribuir docentes proporcionalmente para mitigar janelas ociosas.</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Parâmetros...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Parâmetros Globais</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Solver Engine Health Diagnostics */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Motor de Otimização Heurística</h3>
                  <p className="text-[11px] text-slate-500">Telemetria operacional do Solver</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Arquitetura de Resolução:</span>
                  <span className="font-bold text-slate-800">Construtivo Guloso + Local Search</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Status Operacional:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Restrições Rígidas (*Hard*):</span>
                  <span className="font-bold text-slate-800">0 Choques (Invioláveis)</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Latência Média de Execução:</span>
                  <span className="font-bold text-indigo-600">&lt; 0.15s</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestSolver}
                  disabled={testingSolver}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {testingSolver ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calibrando Solver...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Executar Diagnóstico do Solver</span>
                    </>
                  )}
                </button>
              </div>

              {solverTestResult && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 animate-in fade-in">
                  {solverTestResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. SECTION 5: ROLES & RBAC MATRIX */}
      {activeSection === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Matriz de Papéis e Níveis de Permissão (RBAC)</h3>
              <p className="text-xs text-slate-500">
                Políticas de autorização e privilégios de acesso aos módulos do sistema.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-purple-900 text-xs">Administrador Geral</h4>
              </div>
              <p className="text-[11px] text-purple-800">
                Acesso irrestrito a configurações globais, banco de dados, reset de senhas, criação de turmas, disciplinas e telemetria do Solver.
              </p>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-700" />
                <h4 className="font-bold text-blue-900 text-xs">Coordenador Pedagógico</h4>
              </div>
              <p className="text-[11px] text-blue-800">
                Executa o Solver, ajusta pesos e restrições, edita matriz curricular, cadastra docentes e realiza alocações manuais na grade.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-emerald-900 text-xs">Professor / Docente</h4>
              </div>
              <p className="text-[11px] text-emerald-800">
                Acesso exclusivo ao Portal do Professor para consulta individualizada de seus horários e declaração de disponibilidade semanal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <EditUserModal
        isOpen={Boolean(userToEdit)}
        user={userToEdit}
        onClose={() => setUserToEdit(null)}
        onUserUpdated={handleUserUpdated}
      />

      <ResetPasswordModal
        isOpen={Boolean(userToResetPassword)}
        user={userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
      />

      <NewClassModal
        isOpen={isNewClassModalOpen}
        onClose={() => {
          setIsNewClassModalOpen(false);
          setClassToEdit(null);
        }}
        onSaved={loadAdminData}
        classToEdit={classToEdit}
        shifts={shifts}
      />

      <NewSubjectModal
        isOpen={isNewSubjectModalOpen}
        onClose={() => {
          setIsNewSubjectModalOpen(false);
          setSubjectToEdit(null);
        }}
        onSaved={loadAdminData}
        subjectToEdit={subjectToEdit}
      />

      <NewCurriculumModal
        isOpen={isNewCurriculumModalOpen}
        onClose={() => {
          setIsNewCurriculumModalOpen(false);
          setCurriculumToEdit(null);
        }}
        onSaved={loadAdminData}
        curriculumToEdit={curriculumToEdit}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        preselectedClassId={selectedCurriculumClassId}
      />

      {/* Blast Radius Delete User Modal */}
      {userToDelete && (
        <BlastRadiusModal
          isOpen={!!userToDelete}
          onClose={() => {
            setUserToDelete(null);
            setDeleteErrorMessage(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          errorMessage={deleteErrorMessage}
          title="Excluir Conta de Usuário"
          entityName={userToDelete.full_name}
          entityType={`Conta de Acesso (${userToDelete.role_label})`}
          consequences={[
            {
              title: 'Revogação Total de Acesso',
              detail: 'O usuário será imediatamente desconectado e impedido de autenticar no sistema.',
              severity: 'critical',
            },
            {
              title: 'Eliminação de Perfil e Histórico',
              detail: 'Metadados de sessão, logs de auditoria e preferências do painel serão purgados.',
              severity: 'high',
            },
            {
              title: 'Vínculos Acadêmicos (Docência)',
              detail: 'Se este usuário estiver associado a um professor, as alocações pedagógicas associadas poderão ser desreguladas.',
              severity: 'medium',
            },
          ]}
        />
      )}

      {/* Blast Radius Delete Class Modal */}
      {classToDelete && (
        <BlastRadiusModal
          isOpen={!!classToDelete}
          onClose={() => setClassToDelete(null)}
          onConfirm={handleConfirmDeleteClass}
          isDeleting={isDeletingClass}
          title="Excluir Turma"
          entityName={classToDelete.name}
          entityType={`Turma Escolar (${classToDelete.grade_level || 'Geral'})`}
          consequences={[
            {
              title: 'Destruição da Matriz Curricular da Turma',
              detail: 'Todos os requisitos de disciplinas e cargas horárias semanais vinculadas a esta turma serão expurgados do banco de dados.',
              severity: 'critical',
            },
            {
              title: 'Remoção de Aulas da Grade Ativa',
              detail: 'Quaisquer aulas já distribuídas na grade do colégio pertencentes a esta turma desaparecerão imediatamente.',
              severity: 'critical',
            },
            {
              title: 'Impacto no Motor de Otimização',
              detail: 'O solver descartará a turma de todas as instâncias em memória e os cálculos de viabilidade serão redefinidos.',
              severity: 'high',
            },
          ]}
        />
      )}

      {/* Blast Radius Delete Subject Modal */}
      {subjectToDelete && (
        <BlastRadiusModal
          isOpen={!!subjectToDelete}
          onClose={() => setSubjectToDelete(null)}
          onConfirm={handleConfirmDeleteSubject}
          isDeleting={isDeletingSubject}
          title="Excluir Disciplina"
          entityName={`${subjectToDelete.name} (${subjectToDelete.code})`}
          entityType="Disciplina / Matéria"
          consequences={[
            {
              title: 'Expurgo Curricular em Cascata',
              detail: 'Esta disciplina será eliminada da matriz de TODAS as turmas da instituição que a possuem.',
              severity: 'critical',
            },
            {
              title: 'Aulas Alocadas na Grade Ativa',
              detail: 'Todas as aulas desta matéria na grade oficial serão excluídas, gerando janelas/vazios nos horários.',
              severity: 'critical',
            },
            {
              title: 'Desvinculação Docente',
              detail: 'Professores que ministravam esta matéria perderão o vínculo pedagógico nas turmas afetadas.',
              severity: 'high',
            },
          ]}
        />
      )}

      {/* Blast Radius Delete Curriculum Requirement Modal */}
      {curriculumToDelete && (
        <BlastRadiusModal
          isOpen={!!curriculumToDelete}
          onClose={() => setCurriculumToDelete(null)}
          onConfirm={handleConfirmDeleteCurriculum}
          isDeleting={isDeletingCurriculum}
          title="Remover Exigência Curricular"
          entityName={`${curriculumToDelete.subject_name} (${curriculumToDelete.weekly_lessons} aulas/sem)`}
          entityType="Requisito Curricular"
          consequences={[
            {
              title: 'Redução da Carga Horária Semanal',
              detail: `A turma perderá ${curriculumToDelete.weekly_lessons} aulas semanais desta disciplina no planejamento.`,
              severity: 'high',
            },
            {
              title: 'Desalocação no Solver',
              detail: 'As aulas desta matéria para a turma serão desfeitas e não farão mais parte da grade.',
              severity: 'high',
            },
            {
              title: 'Desvinculação do Docente',
              detail: `O professor ${curriculumToDelete.teacher_name || 'atribuído'} deixará de lecionar esta carga para a turma.`,
              severity: 'medium',
            },
          ]}
        />
      )}
    </div>
  );
};

export default AdminPanelPage;
