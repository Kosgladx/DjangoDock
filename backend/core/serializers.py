from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Teacher, TeacherAvailability, Shift, TimeSlot, Subject,
    SchoolClass, CurriculumRequirement, ConstraintConfig,
    TimetableSchedule, TimetableSlotAssignment, UserProfile,
    InstitutionSetting
)


class TeacherAvailabilitySerializer(serializers.ModelSerializer):
    slot_name = serializers.ReadOnlyField(source='time_slot.name')
    slot_order = serializers.ReadOnlyField(source='time_slot.order')

    class Meta:
        model = TeacherAvailability
        fields = '__all__'


class TeacherSerializer(serializers.ModelSerializer):
    availabilities = TeacherAvailabilitySerializer(many=True, read_only=True)
    allocated_hours = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = '__all__'

    def get_allocated_hours(self, obj):
        return sum(req.weekly_lessons for req in obj.curriculum_assignments.all())


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = '__all__'


class ShiftSerializer(serializers.ModelSerializer):
    slots = TimeSlotSerializer(many=True, read_only=True)

    class Meta:
        model = Shift
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'


class CurriculumRequirementSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')
    subject_code = serializers.ReadOnlyField(source='subject.code')
    subject_color = serializers.ReadOnlyField(source='subject.color')
    teacher_name = serializers.ReadOnlyField(source='teacher.name')
    class_name = serializers.ReadOnlyField(source='school_class.name')

    class Meta:
        model = CurriculumRequirement
        fields = '__all__'


class SchoolClassSerializer(serializers.ModelSerializer):
    curriculum = CurriculumRequirementSerializer(many=True, read_only=True)
    shift_name = serializers.ReadOnlyField(source='shift.name')
    total_weekly_lessons = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = '__all__'

    def get_total_weekly_lessons(self, obj):
        return sum(req.weekly_lessons for req in obj.curriculum.all())


class ConstraintConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConstraintConfig
        fields = '__all__'


class TimetableSlotAssignmentSerializer(serializers.ModelSerializer):
    class_name = serializers.ReadOnlyField(source='school_class.name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    subject_code = serializers.ReadOnlyField(source='subject.code')
    subject_color = serializers.ReadOnlyField(source='subject.color')
    teacher_name = serializers.ReadOnlyField(source='teacher.name')
    slot_name = serializers.ReadOnlyField(source='time_slot.name')
    slot_order = serializers.ReadOnlyField(source='time_slot.order')
    slot_start = serializers.ReadOnlyField(source='time_slot.start_time')
    slot_end = serializers.ReadOnlyField(source='time_slot.end_time')

    class Meta:
        model = TimetableSlotAssignment
        fields = '__all__'


class TimetableScheduleSerializer(serializers.ModelSerializer):
    assignments = TimetableSlotAssignmentSerializer(many=True, read_only=True)
    total_assignments_count = serializers.SerializerMethodField()

    class Meta:
        model = TimetableSchedule
        fields = '__all__'

    def get_total_assignments_count(self, obj):
        return obj.assignments.count()


class InstitutionSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionSetting
        fields = '__all__'


class UserAccountSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', default='coordinator')
    role_label = serializers.SerializerMethodField()
    avatar_initials = serializers.SerializerMethodField()
    department = serializers.CharField(source='profile.department', default='Coordenação Pedagógica')
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_label', 'avatar_initials',
            'department', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login'
        )

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_role_label(self, obj):
        profile = getattr(obj, 'profile', None)
        role = profile.role if profile else ('admin' if obj.is_superuser else 'coordinator')
        labels = {
            'admin': 'Administrador Geral',
            'coordinator': 'Coordenador Pedagógico',
            'teacher': 'Professor / Docente',
        }
        return labels.get(role, 'Usuário')

    def get_avatar_initials(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.avatar_initials:
            return profile.avatar_initials
        name = self.get_full_name(obj)
        parts = [p for p in name.split() if p]
        if not parts:
            return 'US'
        if len(parts) == 1:
            return parts[0][:2].upper()
        return f"{parts[0][0]}{parts[-1][0]}".upper()