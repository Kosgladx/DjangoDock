from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet, ShiftViewSet, TimeSlotViewSet, SubjectViewSet,
    ClassRoomViewSet, SchoolClassViewSet, CurriculumRequirementViewSet,
    ConstraintConfigViewSet, TimetableScheduleViewSet,
    TimetableSlotAssignmentViewSet,
    run_solver, seed_sample_data
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet)
router.register(r'shifts', ShiftViewSet)
router.register(r'slots', TimeSlotViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'rooms', ClassRoomViewSet)
router.register(r'classes', SchoolClassViewSet)
router.register(r'curriculum', CurriculumRequirementViewSet)
router.register(r'constraints', ConstraintConfigViewSet)
router.register(r'timetables', TimetableScheduleViewSet)
router.register(r'assignments', TimetableSlotAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('solver/run/', run_solver, name='run_solver'),
    path('seed/', seed_sample_data, name='seed_sample_data'),
]