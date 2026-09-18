export interface Teacher {
  id: number;
  name: string;
  email: string;
  avatar_initials: string;
  color: string;
  photo?: string | null;
  max_weekly_hours: number;
  max_daily_hours: number;
  shift_preference: string;
  allow_double_lessons: boolean;
  allocated_hours: number;
  availabilities?: TeacherAvailability[];
}

export interface TeacherAvailability {
  id?: number;
  teacher: number;
  day_of_week: number; // 0 to 4
  time_slot: number;
  slot_name?: string;
  slot_order?: number;
  status: 'FREE' | 'PREFERENTIAL' | 'BLOCKED';
  notes?: string;
}

export interface TimeSlot {
  id: number;
  shift: number;
  order: number;
  name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_break: boolean;
  allow_double_lesson: boolean;
  requires_lab: boolean;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  slots?: TimeSlot[];
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  color: string;
  requires_lab: boolean;
}

export interface ClassRoom {
  id: number;
  name: string;
  block: string;
  capacity: number;
  is_lab: boolean;
  lab_type?: string;
}

export interface SchoolClass {
  id: number;
  name: string;
  grade_level: string;
  shift: number;
  student_count: number;
  default_room?: number;
  total_weekly_lessons: number;
}

export interface ConstraintConfig {
  id: number;
  name: string;
  key: string;
  is_hard: boolean;
  weight: number;
  description: string;
  is_enabled: boolean;
}

export interface TimetableSlotAssignment {
  id: number;
  school_class: number;
  class_name: string;
  day_of_week: number;
  time_slot: number;
  slot_name: string;
  slot_order: number;
  slot_start: string;
  slot_end: string;
  subject: number;
  subject_name: string;
  subject_code: string;
  subject_color: string;
  teacher: number;
  teacher_name: string;
  room: number;
  room_name: string;
  room_block: string;
  is_manual_override: boolean;
  has_conflict: boolean;
  conflict_type?: string;
  conflict_message?: string;
}

export interface TimetableSchedule {
  id: number;
  name: string;
  semester: string;
  is_active: boolean;
  viability_score: number;
  hard_violations_count: number;
  soft_penalties_score: number;
  execution_time_seconds: number;
  algorithm_used: string;
  assignments: TimetableSlotAssignment[];
  total_assignments_count: number;
}