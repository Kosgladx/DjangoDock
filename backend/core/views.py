from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import (
    Teacher, TeacherAvailability, Shift, TimeSlot, Subject,
    SchoolClass, CurriculumRequirement, ConstraintConfig,
    TimetableSchedule, TimetableSlotAssignment
)
from .serializers import (
    TeacherSerializer, TeacherAvailabilitySerializer, ShiftSerializer,
    TimeSlotSerializer, SubjectSerializer,
    SchoolClassSerializer, CurriculumRequirementSerializer,
    ConstraintConfigSerializer, TimetableScheduleSerializer,
    TimetableSlotAssignmentSerializer
)
from solver.engine import TimetablingSolver


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.prefetch_related('availabilities', 'curriculum_assignments').all()
    serializer_class = TeacherSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @action(detail=True, methods=['post'])
    def set_availability(self, request, pk=None):
        teacher = self.get_object()
        availabilities_data = request.data.get('availabilities', [])
        # Array of { day_of_week, time_slot_id, status }
        for item in availabilities_data:
            TeacherAvailability.objects.update_or_create(
                teacher=teacher,
                day_of_week=item['day_of_week'],
                time_slot_id=item['time_slot_id'],
                defaults={'status': item.get('status', 'FREE'), 'notes': item.get('notes', '')}
            )
        return Response({'status': 'Availabilities updated successfully'})

    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        teachers_data = request.data.get('teachers', [])
        created_list = []
        errors = []
        for idx, item in enumerate(teachers_data):
            try:
                email = item.get('email', '').strip().lower()
                name = item.get('name', '').strip()
                if not name or not email:
                    errors.append(f"Linha {idx + 1}: Nome e E-mail são obrigatórios.")
                    continue
                teacher, _ = Teacher.objects.update_or_create(
                    email=email,
                    defaults={
                        'name': name,
                        'avatar_initials': item.get('avatar_initials') or item.get('iniciais') or '',
                        'color': item.get('color') or item.get('cor') or '#1D4ED8',
                        'max_weekly_hours': int(item.get('max_weekly_hours') or item.get('carga_max_semanal') or 20),
                        'max_daily_hours': int(item.get('max_daily_hours') or item.get('max_aulas_dia') or 4),
                        'shift_preference': item.get('shift_preference') or item.get('turno') or 'ANY',
                        'allow_double_lessons': item.get('allow_double_lessons', True),
                    }
                )
                created_list.append(TeacherSerializer(teacher).data)
            except Exception as e:
                errors.append(f"Linha {idx + 1} ({item.get('name', '')}): {str(e)}")
        return Response({'created': created_list, 'created_count': len(created_list), 'errors': errors})


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.prefetch_related('slots').all()
    serializer_class = ShiftSerializer


class TimeSlotViewSet(viewsets.ModelViewSet):
    queryset = TimeSlot.objects.select_related('shift').all()
    serializer_class = TimeSlotSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.prefetch_related('curriculum__subject', 'curriculum__teacher').all()
    serializer_class = SchoolClassSerializer


class CurriculumRequirementViewSet(viewsets.ModelViewSet):
    queryset = CurriculumRequirement.objects.select_related('school_class', 'subject', 'teacher').all()
    serializer_class = CurriculumRequirementSerializer


class ConstraintConfigViewSet(viewsets.ModelViewSet):
    queryset = ConstraintConfig.objects.all()
    serializer_class = ConstraintConfigSerializer


class TimetableSlotAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TimetableSlotAssignment.objects.select_related(
        'timetable_schedule', 'school_class', 'time_slot', 'subject', 'teacher'
    ).order_by('day_of_week', 'time_slot__order')
    serializer_class = TimetableSlotAssignmentSerializer

    def get_queryset(self):
        """
        Permite filtrar a listagem geral de alocações (Tarefa L3).
        Suporta os query params:
          - schedule_id (ou timetable_schedule / active)
          - school_class_id (ou class_id / school_class)
          - teacher_id (ou teacher)
          - day_of_week (ou day)
        """
        qs = super().get_queryset()
        schedule_id = (
            self.request.query_params.get('schedule_id')
            or self.request.query_params.get('timetable_schedule')
            or self.request.query_params.get('timetable_schedule_id')
        )
        if schedule_id:
            if schedule_id == 'active' or str(schedule_id).lower() == 'active':
                qs = qs.filter(timetable_schedule__is_active=True)
            else:
                qs = qs.filter(timetable_schedule_id=schedule_id)

        school_class_id = (
            self.request.query_params.get('school_class_id')
            or self.request.query_params.get('class_id')
            or self.request.query_params.get('school_class')
        )
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)

        teacher_id = (
            self.request.query_params.get('teacher_id')
            or self.request.query_params.get('teacher')
        )
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        day_of_week = self.request.query_params.get('day_of_week') or self.request.query_params.get('day')
        if day_of_week is not None and day_of_week != '':
            qs = qs.filter(day_of_week=day_of_week)

        return qs

    def create(self, request, *args, **kwargs):
        schedule_id = request.data.get('timetable_schedule')
        if not schedule_id:
            active_schedule = TimetableSchedule.objects.filter(is_active=True).first()
            if active_schedule:
                schedule_id = active_schedule.id
                request.data['timetable_schedule'] = schedule_id

        school_class_id = request.data.get('school_class')
        day_of_week = request.data.get('day_of_week')
        time_slot_id = request.data.get('time_slot')

        if schedule_id and school_class_id and day_of_week is not None and time_slot_id:
            existing = TimetableSlotAssignment.objects.filter(
                timetable_schedule_id=schedule_id,
                school_class_id=school_class_id,
                day_of_week=day_of_week,
                time_slot_id=time_slot_id
            ).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save(is_manual_override=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)


class TimetableScheduleViewSet(viewsets.ModelViewSet):
    queryset = TimetableSchedule.objects.prefetch_related(
        'assignments__subject', 'assignments__teacher',
        'assignments__time_slot', 'assignments__school_class'
    ).all()
    serializer_class = TimetableScheduleSerializer

    @action(detail=False, methods=['get'])
    def active(self, request):
        schedule = TimetableSchedule.objects.filter(is_active=True).first()
        if not schedule:
            return Response({'error': 'Nenhuma grade horária ativa encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """
        Retorna a matriz de aulas resolvida para uma grade específica (Tarefa L3).
        Endpoint: GET /api/schedules/<id>/assignments/ ou /api/timetables/<id>/assignments/
        Suporta <id> numérico ou 'active'.
        Filtros aceitos via query params:
          - school_class_id (ou class_id / school_class): ID da turma
          - teacher_id (ou teacher): ID do professor
          - day_of_week (ou day): Dia da semana (0 a 4)
        """
        if pk == 'active' or str(pk).lower() == 'active':
            schedule = TimetableSchedule.objects.filter(is_active=True).first()
            if not schedule:
                return Response(
                    {'error': 'Nenhuma grade horária ativa encontrada.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            schedule = self.get_object()

        qs = schedule.assignments.select_related(
            'timetable_schedule', 'school_class', 'subject', 'teacher', 'time_slot'
        ).order_by('day_of_week', 'time_slot__order')

        school_class_id = (
            request.query_params.get('school_class_id')
            or request.query_params.get('class_id')
            or request.query_params.get('school_class')
        )
        if school_class_id:
            qs = qs.filter(school_class_id=school_class_id)

        teacher_id = (
            request.query_params.get('teacher_id')
            or request.query_params.get('teacher')
        )
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)

        day_of_week = request.query_params.get('day_of_week') or request.query_params.get('day')
        if day_of_week is not None and day_of_week != '':
            qs = qs.filter(day_of_week=day_of_week)

        serializer = TimetableSlotAssignmentSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_timetable(request):
    """
    Retorna a matriz de aulas resolvida da grade ativa (ou por schedule_id) (Tarefa L3).
    Endpoint: GET /api/timetable/
    Query params:
      - schedule_id (opcional, padrão: active)
      - school_class_id (ou class_id): filtrar por turma
      - teacher_id (ou teacher): filtrar por docente
      - day_of_week (ou day): filtrar por dia
    """
    schedule_id = (
        request.query_params.get('schedule_id')
        or request.query_params.get('schedule')
        or request.query_params.get('timetable_id')
    )
    if schedule_id and schedule_id != 'active':
        schedule = TimetableSchedule.objects.filter(id=schedule_id).first()
    else:
        schedule = TimetableSchedule.objects.filter(is_active=True).first()

    if not schedule:
        return Response(
            {'error': 'Nenhuma grade horária ativa encontrada.'},
            status=status.HTTP_404_NOT_FOUND
        )

    qs = schedule.assignments.select_related(
        'timetable_schedule', 'school_class', 'subject', 'teacher', 'time_slot'
    ).order_by('day_of_week', 'time_slot__order')

    school_class_id = (
        request.query_params.get('school_class_id')
        or request.query_params.get('class_id')
        or request.query_params.get('school_class')
    )
    if school_class_id:
        qs = qs.filter(school_class_id=school_class_id)

    teacher_id = (
        request.query_params.get('teacher_id')
        or request.query_params.get('teacher')
    )
    if teacher_id:
        qs = qs.filter(teacher_id=teacher_id)

    day_of_week = request.query_params.get('day_of_week') or request.query_params.get('day')
    if day_of_week is not None and day_of_week != '':
        qs = qs.filter(day_of_week=day_of_week)

    serializer = TimetableSlotAssignmentSerializer(qs, many=True)
    return Response({
        'schedule_id': schedule.id,
        'schedule_name': schedule.name,
        'semester': schedule.semester,
        'viability_score': schedule.viability_score,
        'hard_violations_count': schedule.hard_violations_count,
        'total_assignments': qs.count(),
        'assignments': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def run_solver(request):
    """
    Executa o algoritmo de otimização de grade horária (Timetabling Solver).
    Recebe os parâmetros:
      - schedule_name (str, opcional): Nome descritivo da grade a ser gerada.
      - semester (str, opcional): Semestre letivo de referência.
    Retorna o JSON estruturado e padronizado com as métricas de viabilidade,
    tempo de execução e identificador da grade persistida.
    """
    data = request.data or {}
    schedule_name = data.get('schedule_name') or data.get('name') or 'Grade Oficial 2026.1 (IA Timetabling)'
    if isinstance(schedule_name, str):
        schedule_name = schedule_name.strip() or 'Grade Oficial 2026.1 (IA Timetabling)'

    semester = data.get('semester') or '1º Semestre 2026'
    if isinstance(semester, str):
        semester = semester.strip() or '1º Semestre 2026'

    # Validação inicial de viabilidade (Tarefa L4)
    if not SchoolClass.objects.exists():
        return Response({
            'status': 'INFEASIBLE',
            'message': 'Não foi possível iniciar o solver: nenhuma turma cadastrada no sistema.',
            'error': 'Nenhuma turma cadastrada no sistema.',
            'schedule_id': None,
            'viability_score': 0.0,
            'hard_violations': 0,
            'total_assignments': 0,
        }, status=status.HTTP_400_BAD_REQUEST)

    if not CurriculumRequirement.objects.exists():
        return Response({
            'status': 'INFEASIBLE',
            'message': 'Não foi possível iniciar o solver: nenhuma demanda curricular cadastrada para as turmas.',
            'error': 'Nenhuma demanda curricular cadastrada.',
            'schedule_id': None,
            'viability_score': 0.0,
            'hard_violations': 0,
            'total_assignments': 0,
        }, status=status.HTTP_400_BAD_REQUEST)

    if not TimeSlot.objects.filter(is_break=False).exists():
        return Response({
            'status': 'INFEASIBLE',
            'message': 'Não foi possível iniciar o solver: nenhum horário de aula configurado no sistema.',
            'error': 'Nenhum slot de aula configurado.',
            'schedule_id': None,
            'viability_score': 0.0,
            'hard_violations': 0,
            'total_assignments': 0,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():  # type: ignore
            solver = TimetablingSolver(schedule_name=schedule_name, semester=semester)
            raw_result = solver.solve()
    except Exception as exc:
        return Response({
            'status': 'ERROR',
            'message': f'Erro durante a execução do algoritmo do solver: {str(exc)}',
            'error': str(exc),
            'schedule_id': None,
            'viability_score': 0.0,
            'hard_violations': 0,
            'total_assignments': 0,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    hard_violations = raw_result.get('hard_violations', 0)
    viability_score = raw_result.get('viability_score', 0.0)
    exec_time = raw_result.get('execution_time', 0.0)
    exec_time_ms = raw_result.get('execution_time_ms', int(round(exec_time * 1000)))

    # Determina o status padronizado: SUCCESS ou INFEASIBLE
    computed_status = 'SUCCESS' if hard_violations == 0 and viability_score > 0 else 'INFEASIBLE'
    status_str = raw_result.get('status') or computed_status

    response_payload = {
        'status': status_str,
        'schedule_id': raw_result.get('schedule_id'),
        'schedule_name': raw_result.get('schedule_name', schedule_name),
        'semester': semester,
        'viability_score': viability_score,
        'hard_violations': hard_violations,
        'soft_penalties': raw_result.get('soft_penalties', 0.0),
        'execution_time': exec_time,
        'execution_time_ms': exec_time_ms,
        'total_assignments': raw_result.get('total_assignments', 0),
        'hard_details': raw_result.get('hard_details', []),
        'soft_details': raw_result.get('soft_details', []),
        'message': (
            'Grade horária gerada e otimizada com sucesso!'
            if status_str == 'SUCCESS'
            else 'Grade horária gerada com restrições ou conflitos identificados.'
        ),
    }

    # Preserva chaves adicionais retornadas pelo solver se existirem
    for key, value in raw_result.items():
        if key not in response_payload:
            response_payload[key] = value

    return Response(response_payload, status=status.HTTP_200_OK)


@api_view(['POST'])
def seed_sample_data(request):
    # 1. Default Shift & Slots
    shift, _ = Shift.objects.get_or_create(
        name="Matutino",
        defaults={'start_time': '07:15:00', 'end_time': '12:00:00'}
    )

    slots_data = [
        {'order': 1, 'name': '1º Período', 'start_time': '07:15:00', 'end_time': '08:05:00', 'duration_minutes': 50, 'is_break': False},
        {'order': 2, 'name': '2º Período', 'start_time': '08:05:00', 'end_time': '08:55:00', 'duration_minutes': 50, 'is_break': False},
        {'order': 3, 'name': 'Intervalo / Recreio', 'start_time': '08:55:00', 'end_time': '09:15:00', 'duration_minutes': 20, 'is_break': True},
        {'order': 4, 'name': '3º Período', 'start_time': '09:15:00', 'end_time': '10:05:00', 'duration_minutes': 50, 'is_break': False},
        {'order': 5, 'name': '4º Período', 'start_time': '10:05:00', 'end_time': '10:55:00', 'duration_minutes': 50, 'is_break': False},
        {'order': 6, 'name': '5º Período', 'start_time': '10:55:00', 'end_time': '11:45:00', 'duration_minutes': 50, 'is_break': False},
    ]
    created_slots = []
    for s in slots_data:
        slot, _ = TimeSlot.objects.update_or_create(
            shift=shift, order=s['order'],
            defaults=s
        )
        created_slots.append(slot)

    # 2. Subjects
    subjects_data = [
        {'name': 'Matemática I & II', 'code': 'MAT', 'color': '#3B82F6', 'requires_lab': False},
        {'name': 'Física', 'code': 'FIS', 'color': '#8B5CF6', 'requires_lab': True},
        {'name': 'Química Orgânica & Geral', 'code': 'QUI', 'color': '#F43F5E', 'requires_lab': True},
        {'name': 'Biologia', 'code': 'BIO', 'color': '#10B981', 'requires_lab': True},
        {'name': 'Língua Portuguesa & Literatura', 'code': 'POR', 'color': '#6366F1', 'requires_lab': False},
        {'name': 'História', 'code': 'HIS', 'color': '#F59E0B', 'requires_lab': False},
        {'name': 'Geografia', 'code': 'GEO', 'color': '#D97706', 'requires_lab': False},
        {'name': 'Inglês Instrumental', 'code': 'ING', 'color': '#06B6D4', 'requires_lab': False},
        {'name': 'Educação Física', 'code': 'EDF', 'color': '#F97316', 'requires_lab': False},
        {'name': 'Sociologia', 'code': 'SOC', 'color': '#EC4899', 'requires_lab': False},
        {'name': 'Filosofia', 'code': 'FIL', 'color': '#14B8A6', 'requires_lab': False},
        {'name': 'Artes Visuais', 'code': 'ART', 'color': '#A855F7', 'requires_lab': False},
    ]
    created_subjects = {}
    for s in subjects_data:
        subj, _ = Subject.objects.update_or_create(code=s['code'], defaults=s)
        created_subjects[s['code']] = subj

    # 3. Teachers
    teachers_data = [
        {'name': 'Prof. Roberto Silva', 'email': 'roberto.silva@escola.edu.br', 'avatar_initials': 'RS', 'color': '#1D4ED8', 'max_weekly_hours': 20},
        {'name': 'Profª. Mariana Costa', 'email': 'mariana.costa@escola.edu.br', 'avatar_initials': 'MC', 'color': '#6D28D9', 'max_weekly_hours': 16},
        {'name': 'Prof. Carlos Eduardo', 'email': 'carlos.eduardo@escola.edu.br', 'avatar_initials': 'CE', 'color': '#BE123C', 'max_weekly_hours': 14},
        {'name': 'Profª. Beatriz Lima', 'email': 'beatriz.lima@escola.edu.br', 'avatar_initials': 'BL', 'color': '#4338CA', 'max_weekly_hours': 22},
        {'name': 'Profª. Aline Mendes', 'email': 'aline.mendes@escola.edu.br', 'avatar_initials': 'AM', 'color': '#15803D', 'max_weekly_hours': 18},
        {'name': 'Prof. Fernando Dias', 'email': 'fernando.dias@escola.edu.br', 'avatar_initials': 'FD', 'color': '#B45309', 'max_weekly_hours': 16},
        {'name': 'Prof. Lucas Ribeiro', 'email': 'lucas.ribeiro@escola.edu.br', 'avatar_initials': 'LR', 'color': '#0F766E', 'max_weekly_hours': 12},
        {'name': 'Profª. Julia Smith', 'email': 'julia.smith@escola.edu.br', 'avatar_initials': 'JS', 'color': '#0891B2', 'max_weekly_hours': 10},
        {'name': 'Prof. Marcos Paulo', 'email': 'marcos.paulo@escola.edu.br', 'avatar_initials': 'MP', 'color': '#EA580C', 'max_weekly_hours': 10},
        {'name': 'Profª. Helena Ramos', 'email': 'helena.ramos@escola.edu.br', 'avatar_initials': 'HR', 'color': '#DB2777', 'max_weekly_hours': 12},
        {'name': 'Profª. Laura Meireles', 'email': 'laura.meireles@escola.edu.br', 'avatar_initials': 'LM', 'color': '#7C3AED', 'max_weekly_hours': 8},
    ]
    created_teachers = {}
    for t in teachers_data:
        teacher, _ = Teacher.objects.update_or_create(email=t['email'], defaults=t)
        created_teachers[t['name']] = teacher

    # Teacher Availabilities (e.g. Roberto Silva blocked Friday, Carlos blocked morning slot 1)
    non_break_slots = [s for s in created_slots if not s.is_break]
    for teacher in created_teachers.values():
        for d in range(5):
            for s in non_break_slots:
                st = 'FREE'
                if teacher.name == 'Prof. Roberto Silva' and d == 4:
                    st = 'BLOCKED' # Friday blocked for Roberto
                elif teacher.name == 'Prof. Roberto Silva' and (d == 0 or d == 2):
                    st = 'PREFERENTIAL'
                TeacherAvailability.objects.update_or_create(
                    teacher=teacher, day_of_week=d, time_slot=s,
                    defaults={'status': st}
                )

    # 4. School Classes
    c3a, _ = SchoolClass.objects.update_or_create(
        name="3º Ano A",
        defaults={'grade_level': '3º Ano Ensino Médio', 'shift': shift, 'student_count': 35}
    )
    c3b, _ = SchoolClass.objects.update_or_create(
        name="3º Ano B",
        defaults={'grade_level': '3º Ano Ensino Médio', 'shift': shift, 'student_count': 32}
    )

    # 5. Curriculum Requirements for 3º Ano A
    curric_3a = [
        (created_subjects['MAT'], created_teachers['Prof. Roberto Silva'], 4),
        (created_subjects['FIS'], created_teachers['Profª. Mariana Costa'], 3),
        (created_subjects['QUI'], created_teachers['Prof. Carlos Eduardo'], 3),
        (created_subjects['BIO'], created_teachers['Profª. Aline Mendes'], 3),
        (created_subjects['POR'], created_teachers['Profª. Beatriz Lima'], 4),
        (created_subjects['HIS'], created_teachers['Prof. Fernando Dias'], 2),
        (created_subjects['GEO'], created_teachers['Prof. Lucas Ribeiro'], 2),
        (created_subjects['ING'], created_teachers['Profª. Julia Smith'], 1),
        (created_subjects['EDF'], created_teachers['Prof. Marcos Paulo'], 1),
        (created_subjects['SOC'], created_teachers['Profª. Helena Ramos'], 1),
        (created_subjects['ART'], created_teachers['Profª. Laura Meireles'], 1),
    ]
    for subj, teach, hours in curric_3a:
        CurriculumRequirement.objects.update_or_create(
            school_class=c3a, subject=subj,
            defaults={'teacher': teach, 'weekly_lessons': hours, 'double_lessons_allowed': True}
        )

    # 6. Constraint Configurations
    constraints = [
        {'name': 'Sem choque de professor', 'key': 'teacher_clash', 'is_hard': True, 'weight': 100, 'description': 'Inviolável: 1 professor em apenas 1 turma simultânea'},
        {'name': 'Indisponibilidade do docente', 'key': 'teacher_blocked', 'is_hard': True, 'weight': 100, 'description': 'Respeitar dias bloqueados pelo professor'},
        {'name': 'Minimizar janelas vagas', 'key': 'min_gap_weight', 'is_hard': False, 'weight': 85, 'description': 'Penaliza horários ociosos entre aulas do docente'},
        {'name': 'Agrupamento de aulas geminadas', 'key': 'double_lesson_weight', 'is_hard': False, 'weight': 90, 'description': 'Favorece blocos contínuos de 2 aulas'},
        {'name': 'Distribuição homogênea semanal', 'key': 'daily_balance_weight', 'is_hard': False, 'weight': 70, 'description': 'Equilibra matérias durante a semana'},
        {'name': 'Concentração de dias de trabalho', 'key': 'day_concentration_weight', 'is_hard': False, 'weight': 60, 'description': 'Reduz dias de deslocamento do docente'},
    ]
    for c in constraints:
        ConstraintConfig.objects.update_or_create(key=c['key'], defaults=c)


    # 8. Execute initial solver run to generate active timetable
    solver = TimetablingSolver(schedule_name="Grade Oficial 2026.1", semester="1º Semestre 2026")
    solver_res = solver.solve()

    return Response({
        'status': 'Sample data initialized and timetable generated successfully',
        'classes_count': SchoolClass.objects.count(),
        'teachers_count': Teacher.objects.count(),
        'subjects_count': Subject.objects.count(),
        'solver_result': solver_res
    }, status=status.HTTP_201_CREATED)