from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import (
    Teacher, TeacherAvailability, Shift, TimeSlot, Subject,
    SchoolClass, CurriculumRequirement, ConstraintConfig,
    TimetableSchedule, TimetableSlotAssignment, UserProfile,
    InstitutionSetting
)
from .serializers import (
    TeacherSerializer, TeacherAvailabilitySerializer, ShiftSerializer,
    TimeSlotSerializer, SubjectSerializer,
    SchoolClassSerializer, CurriculumRequirementSerializer,
    ConstraintConfigSerializer, TimetableScheduleSerializer,
    TimetableSlotAssignmentSerializer, UserAccountSerializer,
    InstitutionSettingSerializer
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
    ).all()
    serializer_class = TimetableSlotAssignmentSerializer

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
    queryset = TimetableSchedule.objects.prefetch_related('assignments__subject', 'assignments__teacher', 'assignments__time_slot', 'assignments__school_class').all()
    serializer_class = TimetableScheduleSerializer


    @action(detail=False, methods=['get'])
    def active(self, request):
        schedule = TimetableSchedule.objects.filter(is_active=True).first()
        if not schedule:
            return Response({'error': 'Nenhuma grade horária ativa encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)


class UserAccountViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('profile').all().order_by('-date_joined')
    serializer_class = UserAccountSerializer

    def get_queryset(self):
        # Auto-ensure profile exists for any user that lacks it
        for u in User.objects.filter(profile__isnull=True):
            role = 'admin' if u.is_superuser else 'coordinator'
            UserProfile.objects.create(user=u, role=role)
        return User.objects.select_related('profile').all().order_by('-date_joined')

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        full_name = request.data.get('name', '').strip()
        role = request.data.get('role', 'coordinator')
        password = request.data.get('password', '123456')
        department = request.data.get('department', 'Coordenação Pedagógica')
        username = email or request.data.get('username', '').strip()

        if not email or not full_name:
            return Response({'error': 'Nome completo e E-mail são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
            return Response({'error': 'Já existe um usuário cadastrado com este e-mail.'}, status=status.HTTP_400_BAD_REQUEST)

        name_parts = full_name.split()
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        is_superuser = (role == 'admin')
        is_staff = (role in ['admin', 'coordinator'])

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_superuser=is_superuser,
            is_staff=is_staff
        )

        initials = (first_name[0] + (last_name[0] if last_name else '')).upper() if first_name else 'US'
        UserProfile.objects.create(
            user=user,
            role=role,
            avatar_initials=initials,
            department=department
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        email = request.data.get('email')
        full_name = request.data.get('name') or request.data.get('full_name')
        role = request.data.get('role')
        department = request.data.get('department')
        is_active = request.data.get('is_active')
        password = request.data.get('password')

        if email:
            email = email.strip().lower()
            if email != user.email:
                if User.objects.filter(email=email).exclude(id=user.id).exists():
                    return Response({'error': 'Já existe outro usuário cadastrado com este e-mail.'}, status=status.HTTP_400_BAD_REQUEST)
                user.email = email
                if user.username == user.email or '@' in user.username:
                    user.username = email

        if full_name is not None and str(full_name).strip():
            name_parts = str(full_name).strip().split()
            user.first_name = name_parts[0]
            user.last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        if is_active is not None:
            user.is_active = bool(is_active)

        if role:
            user.is_superuser = (role == 'admin')
            user.is_staff = (role in ['admin', 'coordinator'])

        if password and str(password).strip():
            user.set_password(str(password).strip())

        user.save()

        # Update or create profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if role:
            profile.role = role
        if department is not None:
            profile.department = str(department).strip()

        # Update initials
        first_char = user.first_name[0].upper() if user.first_name else ''
        last_char = user.last_name[0].upper() if user.last_name else ''
        if first_char:
            profile.avatar_initials = (first_char + (last_char if last_char else ''))[:2]
        profile.save()
        user.profile = profile
        user.refresh_from_db()

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        is_admin = user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'admin')
        if is_admin:
            admin_count = User.objects.filter(Q(is_superuser=True) | Q(profile__role='admin')).distinct().count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Operação cancelada: Não é permitido excluir o único administrador ativo do sistema.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        name = f"{user.first_name} {user.last_name}".strip() or user.username
        user.delete()
        return Response(
            {'status': 'success', 'message': f'Conta de {name} excluída com sucesso.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        status_text = 'ativada' if user.is_active else 'desativada'
        name = f"{user.first_name} {user.last_name}".strip() or user.username
        return Response({
            'status': 'success',
            'is_active': user.is_active,
            'message': f'A conta de {name} foi {status_text} com sucesso.'
        })

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password') or '123456'
        user.set_password(new_password)
        user.save()
        name = f"{user.first_name} {user.last_name}".strip() or user.username
        return Response({
            'status': 'success',
            'new_password': new_password,
            'message': f'Senha de {name} foi resetada para "{new_password}".'
        })


class InstitutionSettingViewSet(viewsets.ViewSet):
    def list(self, request):
        setting, _ = InstitutionSetting.objects.get_or_create(
            id=1,
            defaults={
                'institution_name': 'Centro Universitário Geraldo Di Biase — UGB',
                'active_school_year': '2026.1',
                'academic_term': '1º Semestre Letivo',
                'term_start_date': '2026-02-02',
                'term_end_date': '2026-07-03',
                'solver_status': 'ACTIVE',
                'solver_algorithm': 'Híbrido Construtivo + Busca Local + Propagação de Restrições',
                'auto_balance_shifts': True,
                'contact_email': 'coordenacao@escola.edu.br'
            }
        )
        if not setting.term_start_date or not setting.term_end_date:
            if not setting.term_start_date:
                setting.term_start_date = '2026-02-02'
            if not setting.term_end_date:
                setting.term_end_date = '2026-07-03'
            setting.save()

        serializer = InstitutionSettingSerializer(setting)
        data = serializer.data
        data['solver_diagnostics'] = {
            'status': 'ONLINE',
            'engine_version': 'v2.4-hybrid-ai',
            'latency_ms': 12,
            'constraints_loaded': ConstraintConfig.objects.count(),
            'active_schedules': TimetableSchedule.objects.filter(is_active=True).count(),
            'engine_type': 'Heurística Construtiva com Busca Tabu',
        }
        return Response(data)

    def create(self, request):
        setting, _ = InstitutionSetting.objects.get_or_create(id=1)
        serializer = InstitutionSettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            data['solver_diagnostics'] = {
                'status': 'ONLINE',
                'engine_version': 'v2.4-hybrid-ai',
                'latency_ms': 12,
                'constraints_loaded': ConstraintConfig.objects.count(),
                'active_schedules': TimetableSchedule.objects.filter(is_active=True).count(),
                'engine_type': 'Heurística Construtiva com Busca Tabu',
            }
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def run_solver(request):
    schedule_name = request.data.get('name', 'Grade Oficial 2026.1 (IA Timetabling)')
    semester = request.data.get('semester', '1º Semestre 2026')
    solver = TimetablingSolver(schedule_name=schedule_name, semester=semester)
    result = solver.solve()
    return Response(result, status=status.HTTP_200_OK)


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