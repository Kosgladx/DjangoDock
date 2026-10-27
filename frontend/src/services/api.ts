import type {
  Teacher, Shift, TimeSlot, Subject, SchoolClass,
  ConstraintConfig, TimetableSchedule, TimetableSlotAssignment,
  SystemUserAccount, InstitutionSettingsData
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

export async function getTeachers(): Promise<Teacher[]> {
  const res = await fetch(`${API_BASE}/teachers/`);
  if (!res.ok) throw new Error('Falha ao carregar professores');
  return res.json();
}

export async function updateTeacherAvailability(
  teacherId: number,
  availabilities: Array<{ day_of_week: number; time_slot_id: number; status: string; notes?: string }>
): Promise<any> {
  const res = await fetch(`${API_BASE}/teachers/${teacherId}/set_availability/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availabilities })
  });
  if (!res.ok) throw new Error('Falha ao salvar disponibilidades');
  return res.json();
}

export async function createTeacher(teacher: Partial<Teacher> | FormData): Promise<Teacher> {
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
}

export async function updateTeacher(id: number, teacher: Partial<Teacher> | FormData): Promise<Teacher> {
  const isFormData = teacher instanceof FormData;
  const res = await fetch(`${API_BASE}/teachers/${id}/`, {
    method: 'PATCH',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? teacher : JSON.stringify(teacher)
  });
  if (!res.ok) {
    let errorMsg = 'Falha ao atualizar dados do professor';
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
}

export async function deleteTeacher(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/teachers/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    let errorMsg = 'Falha ao excluir professor';
    try {
      const data = await res.json();
      if (data?.detail) errorMsg = data.detail;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
}

export async function batchCreateTeachers(
  teachers: Array<Record<string, any>>
): Promise<{ created: Teacher[]; created_count: number; errors: string[] }> {
  const res = await fetch(`${API_BASE}/teachers/batch_create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teachers })
  });
  if (!res.ok) throw new Error('Falha ao importar professores em lote');
  return res.json();
}

export async function getShifts(): Promise<Shift[]> {
  const res = await fetch(`${API_BASE}/shifts/`);
  if (!res.ok) throw new Error('Falha ao carregar turnos');
  return res.json();
}

export async function createShift(shift: Partial<Shift>): Promise<Shift> {
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
}

export async function deleteShift(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/shifts/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir turno');
}

export async function getSlots(): Promise<TimeSlot[]> {
  const res = await fetch(`${API_BASE}/slots/`);
  if (!res.ok) throw new Error('Falha ao carregar slots de aula');
  return res.json();
}

export async function createSlot(slot: Partial<TimeSlot>): Promise<TimeSlot> {
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
}

export async function deleteSlot(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/slots/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir slot de aula');
}

export async function getClasses(): Promise<SchoolClass[]> {
  const res = await fetch(`${API_BASE}/classes/`);
  if (!res.ok) throw new Error('Falha ao carregar turmas');
  return res.json();
}

export async function getSubjects(): Promise<Subject[]> {
  const res = await fetch(`${API_BASE}/subjects/`);
  if (!res.ok) throw new Error('Falha ao carregar disciplinas');
  return res.json();
}

export async function getConstraints(): Promise<ConstraintConfig[]> {
  const res = await fetch(`${API_BASE}/constraints/`);
  if (!res.ok) throw new Error('Falha ao carregar restrições');
  return res.json();
}

export async function updateConstraint(id: number, data: Partial<ConstraintConfig>): Promise<ConstraintConfig> {
  const res = await fetch(`${API_BASE}/constraints/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Falha ao atualizar restrição');
  return res.json();
}

export async function getActiveTimetable(): Promise<TimetableSchedule | null> {
  const res = await fetch(`${API_BASE}/timetables/active/`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Falha ao carregar grade horária ativa');
  return res.json();
}

export async function getScheduleAssignments(scheduleId: number): Promise<TimetableSlotAssignment[]> {
  const res = await fetch(`${API_BASE}/assignments/?timetable_schedule=${scheduleId}`);
  if (!res.ok) throw new Error('Falha ao carregar alocações da grade');
  return res.json();
}

export async function createOrUpdateAssignment(
  data: Partial<TimetableSlotAssignment>
): Promise<TimetableSlotAssignment> {
  const res = await fetch(`${API_BASE}/assignments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Object.values(err).flat().join(', ') || 'Falha ao alocar aula manual';
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteAssignment(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/assignments/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao remover aula');
}

export async function runSolver(name?: string, semester?: string) {
  const res = await fetch(`${API_BASE}/solver/run/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, semester })
  });
  if (!res.ok) throw new Error('Erro na execução do solver');
  return res.json();
}

export async function seedData() {
  const res = await fetch(`${API_BASE}/seed/`, { method: 'POST' });
  if (!res.ok) throw new Error('Erro ao inicializar dados');
  return res.json();
}

export async function getUsers(): Promise<SystemUserAccount[]> {
  const res = await fetch(`${API_BASE}/users/`);
  if (!res.ok) throw new Error('Falha ao carregar lista de usuários');
  return res.json();
}

export async function createUser(user: { name: string; email: string; role: string; password?: string; department?: string }): Promise<SystemUserAccount> {
  const res = await fetch(`${API_BASE}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    let errorMsg = 'Falha ao cadastrar usuário';
    try {
      const data = await res.json();
      if (data?.error) errorMsg = data.error;
      else if (typeof data === 'object') {
        errorMsg = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ');
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function updateUser(userId: number, user: { name?: string; email?: string; role?: string; department?: string; is_active?: boolean; password?: string }): Promise<SystemUserAccount> {
  const res = await fetch(`${API_BASE}/users/${userId}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    let errorMsg = 'Falha ao atualizar usuário';
    try {
      const data = await res.json();
      if (data?.error) errorMsg = data.error;
      else if (typeof data === 'object') {
        errorMsg = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ');
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function toggleUserStatus(userId: number): Promise<{ status: string; is_active: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/users/${userId}/toggle_status/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Falha ao alterar status da conta');
  return res.json();
}

export async function resetUserPassword(userId: number, password?: string): Promise<{ status: string; new_password?: string; message: string }> {
  const res = await fetch(`${API_BASE}/users/${userId}/reset_password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) throw new Error('Falha ao resetar senha do usuário');
  return res.json();
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${userId}/`, {
    method: 'DELETE'
  });
  if (!res.ok && res.status !== 204) {
    let errorMsg = 'Falha ao remover usuário';
    try {
      const data = await res.json();
      if (data?.error) errorMsg = data.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
}

export async function getInstitutionSettings(): Promise<InstitutionSettingsData> {
  const res = await fetch(`${API_BASE}/institution-settings/`);
  if (!res.ok) throw new Error('Falha ao carregar configurações da instituição');
  return res.json();
}

export async function updateInstitutionSettings(settings: Partial<InstitutionSettingsData>): Promise<InstitutionSettingsData> {
  const res = await fetch(`${API_BASE}/institution-settings/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Falha ao atualizar parâmetros globais');
  return res.json();
}

export const api = {
  getTeachers,
  updateTeacherAvailability,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  batchCreateTeachers,
  getShifts,
  createShift,
  deleteShift,
  getSlots,
  createSlot,
  deleteSlot,
  getClasses,
  getSubjects,
  getConstraints,
  updateConstraint,
  getActiveTimetable,
  getScheduleAssignments,
  createOrUpdateAssignment,
  deleteAssignment,
  runSolver,
  seedData,
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getInstitutionSettings,
  updateInstitutionSettings
};

export default api;