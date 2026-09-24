from rest_framework import serializers
from .models import (
    Teacher, TeacherAvailability, Shift, TimeSlot, Subject,
    SchoolClass, CurriculumRequirement, ConstraintConfig,
    TimetableSchedule, TimetableSlotAssignment
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


    class Meta:
        model = CurriculumRequirement
        fields = '__all__'


class SchoolClassSerializer(serializers.ModelSerializer):
    curriculum = CurriculumRequirementSerializer(many=True, read_only=True)
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