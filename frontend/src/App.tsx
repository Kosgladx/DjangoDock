import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TimetablePage } from './pages/TimetablePage';
import { TeachersPage } from './pages/TeachersPage';
import { TimeSlotsPage } from './pages/TimeSlotsPage';
import { LoginPage, type UserSession } from './pages/LoginPage';
import { api } from './services/api';
import type {
  TimetableSchedule, SchoolClass, Teacher, ClassRoom, TimeSlot, Shift
} from './types';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('eduschedule_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'grid' | 'teachers' | 'slots'>('grid');
  const [loading, setLoading] = useState(true);
  const [isSolving, setIsSolving] = useState(false);

  const [schedule, setSchedule] = useState<TimetableSchedule | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<ClassRoom[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes, roomsRes, slotsRes, shiftsRes] = await Promise.all([
        api.getClasses(),
        api.getTeachers(),
        api.getRooms(),
        api.getSlots(),
        api.getShifts(),
      ]);

      setClasses(classesRes);
      setTeachers(teachersRes);
      setRooms(roomsRes);
      setSlots(slotsRes);
      setShifts(shiftsRes);

      try {
        const scheduleRes = await api.getActiveTimetable();
        setSchedule(scheduleRes);
      } catch {
        const seedRes = await api.seedData();
        if (seedRes.solver_result) {
          const newSchedule = await api.getActiveTimetable();
          setSchedule(newSchedule);
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleRunSolver = async () => {
    try {
      setIsSolving(true);
      const res = await api.runSolver('Grade Oficial 2026.1 (IA Timetabling)', '1º Semestre 2026');
      const updatedSchedule = await api.getActiveTimetable();
      setSchedule(updatedSchedule);
      alert(`🎉 Otimização concluída com sucesso!\nScore de Viabilidade: ${res.viability_score}%\nViolações Rígidas: ${res.hard_violations}\nTempo de Execução: ${res.execution_time}s`);
    } catch (err: any) {
      alert('Erro ao executar solver: ' + err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eduschedule_user');
    setCurrentUser(null);
  };

  // If user is not authenticated, show modern LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={setCurrentUser} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600">Carregando Sistema EduSchedule AI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunSolver={handleRunSolver}
        isSolving={isSolving}
        viabilityScore={schedule?.viability_score}
        hasConflicts={schedule ? schedule.soft_penalties_score > 0 : true}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'grid' && (
          <TimetablePage
            schedule={schedule}
            classes={classes}
            teachers={teachers}
            rooms={rooms}
            slots={slots}
            onRunSolver={handleRunSolver}
            onRefresh={loadAllData}
            isSolving={isSolving}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersPage
            teachers={teachers}
            slots={slots}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'slots' && (
          <TimeSlotsPage
            shifts={shifts}
            slots={slots}
            onRefresh={loadAllData}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        EduSchedule AI • Sistema de Resolução de Horários Escolares (Timetabling Problem) • Django & React & MySQL
      </footer>
    </div>
  );
}

export default App;