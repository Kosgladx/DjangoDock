import type {
  Teacher, Shift, TimeSlot, Subject, ClassRoom, SchoolClass,
  ConstraintConfig, TimetableSchedule
} from '../types';

const API_BASE = '/api';

export const api = {
  async getTeachers(): Promise<Teacher[]> {
    const res = await fetch(`${API_BASE}/teachers/`);
    if (!res.ok) throw new Error('Falha ao carregar professores');
    return res.json();
  },

  async updateTeacherAvailability(teacherId: number, availabilities: Array<{ day_of_week: number; time_slot_id: number; status: string }>) {
    const res = await fetch(`${API_BASE}/teachers/${teacherId}/set_availability/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availabilities })
    });
    if (!res.ok) throw new Error('Falha ao atualizar disponibilidade');
    return res.json();
  },

  async createTeacher(teacher: Partial<Teacher> | FormData): Promise<Teacher> {
    const isFormData = teacher instanceof FormData;
    const res = await fetch(`${API_BASE}/teachers/`, {
      method: 'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body: isFormData ? teacher : JSON.stringify(teacher)
    });
    if (!res.ok) {
      let errorMsg = 'Falha ao cadastrar professor';
      try {
        const data = await res.json();
        if (typeof data === 'object' && data !== null) {
          const fieldErrors = Object.entries(data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          if (fieldErrors) errorMsg = fieldErrors;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }
    return res.json();
  },

  async batchCreateTeachers(teachers: Array<Record<string, any>>): Promise<{ created: Teacher[]; created_count: number; errors: string[] }> {
    const res = await fetch(`${API_BASE}/teachers/batch_create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teachers })
    });
    if (!res.ok) throw new Error('Falha ao importar professores em lote');
    return res.json();
  },

  async getShifts(): Promise<Shift[]> {
    const res = await fetch(`${API_BASE}/shifts/`);
    if (!res.ok) throw new Error('Falha ao carregar turnos');
    return res.json();
  },

  async createShift(shift: Partial<Shift>): Promise<Shift> {
    const res = await fetch(`${API_BASE}/shifts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.name?.[0] || 'Falha ao criar turno');
    }
    return res.json();
  },

  async deleteShift(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/shifts/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir turno');
  },

  async getSlots(): Promise<TimeSlot[]> {
    const res = await fetch(`${API_BASE}/slots/`);
    if (!res.ok) throw new Error('Falha ao carregar slots de aula');
    return res.json();
  },

  async createSlot(slot: Partial<TimeSlot>): Promise<TimeSlot> {
    const res = await fetch(`${API_BASE}/slots/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Object.values(err).flat().join(', ') || 'Falha ao criar slot de aula';
      throw new Error(msg);
    }
    return res.json();
  },

  async deleteSlot(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/slots/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir slot de aula');
  },

  async getClasses(): Promise<SchoolClass[]> {
    const res = await fetch(`${API_BASE}/classes/`);
    if (!res.ok) throw new Error('Falha ao carregar turmas');
    return res.json();
  },

  async getSubjects(): Promise<Subject[]> {
    const res = await fetch(`${API_BASE}/subjects/`);
    if (!res.ok) throw new Error('Falha ao carregar disciplinas');
    return res.json();
  },

  async getRooms(): Promise<ClassRoom[]> {
    const res = await fetch(`${API_BASE}/rooms/`);
    if (!res.ok) throw new Error('Falha ao carregar salas');
    return res.json();
  },

  async getConstraints(): Promise<ConstraintConfig[]> {
    const res = await fetch(`${API_BASE}/constraints/`);
    if (!res.ok) throw new Error('Falha ao carregar restrições');
    return res.json();
  },

  async updateConstraint(id: number, data: Partial<ConstraintConfig>): Promise<ConstraintConfig> {
    const res = await fetch(`${API_BASE}/constraints/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao atualizar restrição');
    return res.json();
  },

  async getActiveTimetable(): Promise<TimetableSchedule> {
    const res = await fetch(`${API_BASE}/timetables/active/`);
    if (!res.ok) throw new Error('Nenhuma grade ativa');
    return res.json();
  },

  async createOrUpdateAssignment(assignment: {
    timetable_schedule?: number;
    school_class: number;
    day_of_week: number;
    time_slot: number;
    subject: number;
    teacher: number;
    room: number;
    is_manual_override?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/assignments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...assignment, is_manual_override: true })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Object.values(err).flat().join(', ') || 'Falha ao alocar aula manual';
      throw new Error(msg);
    }
    return res.json();
  },

  async deleteAssignment(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/assignments/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao remover aula');
  },

  async runSolver(name?: string, semester?: string) {
    const res = await fetch(`${API_BASE}/solver/run/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, semester })
    });
    if (!res.ok) throw new Error('Erro na execução do solver');
    return res.json();
  },

  async seedData() {
    const res = await fetch(`${API_BASE}/seed/`, { method: 'POST' });
    if (!res.ok) throw new Error('Erro ao inicializar dados');
    return res.json();
  }
};