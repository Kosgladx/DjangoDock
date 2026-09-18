import re
from django.db import models


class Teacher(models.Model):
    SHIFT_PREFERENCES = [
        ('ANY', 'Sem Restrição'),
        ('MORNING', 'Manhã (Preferencial)'),
        ('AFTERNOON', 'Tarde (Preferencial)'),
        ('NIGHT', 'Noite (Preferencial)'),
    ]

    name = models.CharField(max_length=150, verbose_name="Nome do Professor")
    email = models.EmailField(unique=True, verbose_name="E-mail Institucional")
    avatar_initials = models.CharField(max_length=5, default="DOC")
    color = models.CharField(max_length=20, default="#1D4ED8")
    photo = models.ImageField(upload_to='teachers/', null=True, blank=True, verbose_name="Foto de Perfil")
    max_weekly_hours = models.IntegerField(default=20, verbose_name="Carga Máx. Semanal (aulas)")
    max_daily_hours = models.IntegerField(default=4, verbose_name="Máx. Aulas/Dia")
    shift_preference = models.CharField(max_length=20, choices=SHIFT_PREFERENCES, default='ANY')
    allow_double_lessons = models.BooleanField(default=True, verbose_name="Permitir Aulas Geminadas")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Professor"
        verbose_name_plural = "Professores"
        ordering = ['name']

    def calculate_initials(self):
        clean_name = re.sub(r'^(prof\.?|profª\.?|professor|professora|dr\.?|dra\.?|doutor|doutora|msc\.?|me\.?|ma\.?)\s+', '', self.name, flags=re.IGNORECASE).strip()
        parts = [p for p in re.split(r'\s+', clean_name) if p]
        if not parts:
            return "DOC"
        if len(parts) == 1:
            return parts[0][:2].upper()
        # Initials of First Name (Nome) and Last Name (Sobrenome)
        return f"{parts[0][0]}{parts[-1][0]}".upper()

    def save(self, *args, **kwargs):
        if not self.avatar_initials or self.avatar_initials == "DOC":
            self.avatar_initials = self.calculate_initials()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Shift(models.Model):
    name = models.CharField(max_length=50, verbose_name="Nome do Turno") # Matutino, Vespertino, Noturno
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Turno"
        verbose_name_plural = "Turnos"

    def __str__(self):
        return f"{self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"


class TimeSlot(models.Model):
    shift = models.ForeignKey(Shift, related_name='slots', on_delete=models.CASCADE)
    order = models.IntegerField(verbose_name="Ordem do Período")
    name = models.CharField(max_length=50, verbose_name="Nome do Slot") # 1º Período, Intervalo, etc.
    start_time = models.TimeField(verbose_name="Início")
    end_time = models.TimeField(verbose_name="Fim")
    duration_minutes = models.IntegerField(default=50)
    is_break = models.BooleanField(default=False, verbose_name="É Intervalo / Recreio")
    allow_double_lesson = models.BooleanField(default=True)
    requires_lab = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Slot de Tempo"
        verbose_name_plural = "Slots de Tempo"
        ordering = ['shift', 'order']

    def __str__(self):
        return f"{self.shift.name} - {self.name} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"


class TeacherAvailability(models.Model):
    STATUS_CHOICES = [
        ('FREE', 'Livre / Disponível'),
        ('PREFERENTIAL', 'Preferencial'),
        ('BLOCKED', 'Bloqueio Absoluto (Hard Constraint)'),
    ]
    DAYS_OF_WEEK = [
        (0, 'Segunda-feira'),
        (1, 'Terça-feira'),
        (2, 'Quarta-feira'),
        (3, 'Quinta-feira'),
        (4, 'Sexta-feira'),
        (5, 'Sábado'),
    ]

    teacher = models.ForeignKey(Teacher, related_name='availabilities', on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='FREE')
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Disponibilidade Docente"
        verbose_name_plural = "Disponibilidades Docentes"
        unique_together = ('teacher', 'day_of_week', 'time_slot')

    def __str__(self):
        return f"{self.teacher.name} - Dia {self.day_of_week} Slot {self.time_slot.name}: {self.status}"


class Subject(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nome da Disciplina")
    code = models.CharField(max_length=10, verbose_name="Código / Sigla") # MAT, FIS, etc.
    color = models.CharField(max_length=20, default="#3B82F6")
    requires_lab = models.BooleanField(default=False, verbose_name="Requer Laboratório")

    class Meta:
        verbose_name = "Disciplina"
        verbose_name_plural = "Disciplinas"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class ClassRoom(models.Model):
    name = models.CharField(max_length=80, verbose_name="Nome da Sala")
    block = models.CharField(max_length=50, default="Bloco A")
    capacity = models.IntegerField(default=40)
    is_lab = models.BooleanField(default=False)
    lab_type = models.CharField(max_length=80, blank=True, null=True) # Física, Química, Informática

    class Meta:
        verbose_name = "Sala / Espaço"
        verbose_name_plural = "Salas e Laboratórios"

    def __str__(self):
        return f"{self.name} ({self.block})"


class SchoolClass(models.Model):
    name = models.CharField(max_length=80, verbose_name="Nome da Turma") # 3º Ano A
    grade_level = models.CharField(max_length=80, default="3º Ano Ensino Médio")
    shift = models.ForeignKey(Shift, related_name='classes', on_delete=models.CASCADE)
    student_count = models.IntegerField(default=35)
    default_room = models.ForeignKey(ClassRoom, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = "Turma"
        verbose_name_plural = "Turmas"

    def __str__(self):
        return self.name


class CurriculumRequirement(models.Model):
    school_class = models.ForeignKey(SchoolClass, related_name='curriculum', on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, related_name='curriculum_assignments', on_delete=models.CASCADE)
    weekly_lessons = models.IntegerField(default=4, verbose_name="Aulas Semanais")
    double_lessons_allowed = models.BooleanField(default=True)
    preferred_room = models.ForeignKey(ClassRoom, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = "Carga Curricular"
        verbose_name_plural = "Cargas Curriculares"
        unique_together = ('school_class', 'subject')

    def __str__(self):
        return f"{self.school_class.name} - {self.subject.code} ({self.weekly_lessons} aulas/sem) - {self.teacher.name}"


class ConstraintConfig(models.Model):
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=50, unique=True)
    is_hard = models.BooleanField(default=False)
    weight = models.IntegerField(default=50, help_text="Peso da restrição (0 a 100)")
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Configuração de Restrição"
        verbose_name_plural = "Configurações de Restrições"

    def __str__(self):
        return f"{self.name} (Peso: {self.weight})"


class TimetableSchedule(models.Model):
    name = models.CharField(max_length=100, default="Grade Horária Oficial 2026.1")
    semester = models.CharField(max_length=20, default="1º Semestre 2026")
    is_active = models.BooleanField(default=True)
    viability_score = models.FloatField(default=100.0)
    hard_violations_count = models.IntegerField(default=0)
    soft_penalties_score = models.FloatField(default=0.0)
    execution_time_seconds = models.FloatField(default=0.0)
    algorithm_used = models.CharField(max_length=100, default="Genetic Algorithm + Tabu Search")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Grade Horária"
        verbose_name_plural = "Grades Horárias"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} (Viabilidade: {self.viability_score}%)"


class TimetableSlotAssignment(models.Model):
    timetable_schedule = models.ForeignKey(TimetableSchedule, related_name='assignments', on_delete=models.CASCADE)
    school_class = models.ForeignKey(SchoolClass, related_name='schedule_slots', on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=TeacherAvailability.DAYS_OF_WEEK)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    room = models.ForeignKey(ClassRoom, on_delete=models.CASCADE)
    is_manual_override = models.BooleanField(default=False)
    has_conflict = models.BooleanField(default=False)
    conflict_type = models.CharField(max_length=50, blank=True, null=True) # HARD_CLASH, SOFT_GAP, PREFERENCE_BREAK
    conflict_message = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Alocação de Aula"
        verbose_name_plural = "Alocações de Aulas"
        unique_together = ('timetable_schedule', 'school_class', 'day_of_week', 'time_slot')

    def __str__(self):
        return f"{self.school_class.name} - Dia {self.day_of_week} Slot {self.time_slot.name}: {self.subject.code} ({self.teacher.name})"