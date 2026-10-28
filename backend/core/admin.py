from django.contrib import admin
from .models import (
    Teacher, TeacherAvailability, Shift, TimeSlot, Subject,
    SchoolClass, CurriculumRequirement, ConstraintConfig,
    TimetableSchedule, TimetableSlotAssignment, UserProfile,
    InstitutionSetting
)


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'avatar_initials', 'max_weekly_hours', 'max_daily_hours', 'shift_preference', 'is_active')
    search_fields = ('name', 'email')
    list_filter = ('shift_preference', 'allow_double_lessons', 'is_active')


@admin.register(TeacherAvailability)
class TeacherAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'day_of_week', 'time_slot', 'status')
    list_filter = ('day_of_week', 'status')
    search_fields = ('teacher__name',)


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'is_active')


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('name', 'shift', 'order', 'start_time', 'end_time', 'is_break')
    list_filter = ('shift', 'is_break')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'requires_lab')
    search_fields = ('name', 'code')


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade_level', 'shift', 'student_count')
    list_filter = ('shift', 'grade_level')
    search_fields = ('name',)


@admin.register(CurriculumRequirement)
class CurriculumRequirementAdmin(admin.ModelAdmin):
    list_display = ('school_class', 'subject', 'teacher', 'weekly_lessons', 'double_lessons_allowed')
    list_filter = ('school_class', 'subject')
    search_fields = ('school_class__name', 'subject__name', 'teacher__name')


@admin.register(ConstraintConfig)
class ConstraintConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'is_hard', 'weight', 'is_enabled')
    list_filter = ('is_hard', 'is_enabled')


@admin.register(TimetableSchedule)
class TimetableScheduleAdmin(admin.ModelAdmin):
    list_display = ('name', 'semester', 'viability_score', 'hard_violations_count', 'soft_penalties_score', 'created_at', 'is_active')
    list_filter = ('is_active', 'semester')


@admin.register(TimetableSlotAssignment)
class TimetableSlotAssignmentAdmin(admin.ModelAdmin):
    list_display = ('timetable_schedule', 'school_class', 'day_of_week', 'time_slot', 'subject', 'teacher', 'has_conflict')
    list_filter = ('timetable_schedule', 'day_of_week', 'has_conflict')
    search_fields = ('school_class__name', 'teacher__name', 'subject__name')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department', 'phone')
    list_filter = ('role', 'department')
    search_fields = ('user__username', 'user__email', 'department')


@admin.register(InstitutionSetting)
class InstitutionSettingAdmin(admin.ModelAdmin):
    list_display = ('institution_name', 'active_school_year', 'academic_term', 'term_start_date', 'term_end_date', 'solver_status')
