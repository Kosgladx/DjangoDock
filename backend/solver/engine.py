import time
import random
from .constraints import ConstraintEvaluator
from core.models import (
    SchoolClass, CurriculumRequirement, TimeSlot, TeacherAvailability,
    ClassRoom, TimetableSchedule, TimetableSlotAssignment, ConstraintConfig
)


class TimetablingSolver:
    def __init__(self, schedule_name="Grade Otimizada por IA", semester="1º Semestre 2026"):
        self.schedule_name = schedule_name
        self.semester = semester

        # Load constraint weights from DB
        weights = {}
        for cfg in ConstraintConfig.objects.filter(is_enabled=True):
            weights[cfg.key] = cfg.weight
        self.evaluator = ConstraintEvaluator(weights)

    def solve(self):
        start_time = time.time()

        # 1. Fetch data
        classes = list(SchoolClass.objects.all())
        curricula = list(CurriculumRequirement.objects.select_related('school_class', 'subject', 'teacher', 'preferred_room').all())
        # Filter regular non-break slots
        slots = list(TimeSlot.objects.filter(is_break=False).order_by('order'))
        rooms = list(ClassRoom.objects.all())
        default_room = rooms[0] if rooms else None

        # Fetch teacher availabilities: map (teacher_id, day, slot_id) -> status
        avail_qs = TeacherAvailability.objects.all()
        avail_map = {
            (a.teacher_id, a.day_of_week, a.time_slot_id): a.status
            for a in avail_qs
        }

        days = [0, 1, 2, 3, 4] # Seg a Sex (0 a 4)

        # 2. Build list of lessons to allocate per class
        # Each item: { class_id, subject_id, teacher_id, room_id, allow_double }
        class_lessons = {}
        for c in classes:
            class_lessons[c.id] = []

        for req in curricula:
            room = req.preferred_room or (req.school_class.default_room if hasattr(req.school_class, 'default_room') and req.school_class.default_room else default_room)
            for _ in range(req.weekly_lessons):
                class_lessons[req.school_class_id].append({
                    'class_id': req.school_class_id,
                    'subject_id': req.subject_id,
                    'teacher_id': req.teacher_id,
                    'room_id': room.id if room else 1,
                    'allow_double': req.double_lessons_allowed,
                })

        # 3. Available grid coordinates: list of (day, slot)
        grid_positions = []
        for d in days:
            for s in slots:
                grid_positions.append((d, s))

        best_assignments = []
        best_eval = {'viability_score': -1, 'hard_violations': 9999, 'soft_penalty': 999999}

        # 4. Multi-restart constructive search + local repair
        max_attempts = 15
        for attempt in range(max_attempts):
            current_assignments = []
            occupied_teacher = set() # (teacher_id, day, slot_id)
            occupied_room = set()    # (room_id, day, slot_id)

            for c in classes:
                lessons = list(class_lessons[c.id])
                # Shuffle lessons prioritizing subjects with double lessons
                random.shuffle(lessons)
                class_grid = list(grid_positions)

                # Prioritize pairing double lessons
                paired_lessons = []
                # Group by subject
                by_subject = {}
                for l in lessons:
                    by_subject.setdefault(l['subject_id'], []).append(l)

                unpaired = []
                for s_id, s_lessons in by_subject.items():
                    while len(s_lessons) >= 2 and s_lessons[0]['allow_double']:
                        paired_lessons.append((s_lessons.pop(), s_lessons.pop()))
                    unpaired.extend(s_lessons)

                # Allocate pairs first
                for l1, l2 in paired_lessons:
                    placed = False
                    for d in days:
                        for s_idx in range(len(slots) - 1):
                            s1 = slots[s_idx]
                            s2 = slots[s_idx + 1]

                            # Check if slots are free for this class
                            pos1_used = any(a['class_id'] == c.id and a['day'] == d and a['slot_id'] == s1.id for a in current_assignments)
                            pos2_used = any(a['class_id'] == c.id and a['day'] == d and a['slot_id'] == s2.id for a in current_assignments)

                            if not pos1_used and not pos2_used:
                                t1_free = (l1['teacher_id'], d, s1.id) not in occupied_teacher and avail_map.get((l1['teacher_id'], d, s1.id)) != 'BLOCKED'
                                t2_free = (l2['teacher_id'], d, s2.id) not in occupied_teacher and avail_map.get((l2['teacher_id'], d, s2.id)) != 'BLOCKED'

                                if t1_free and t2_free:
                                    current_assignments.append({
                                        'class_id': c.id, 'day': d, 'slot_id': s1.id, 'slot_order': s1.order,
                                        'teacher_id': l1['teacher_id'], 'subject_id': l1['subject_id'], 'room_id': l1['room_id']
                                    })
                                    current_assignments.append({
                                        'class_id': c.id, 'day': d, 'slot_id': s2.id, 'slot_order': s2.order,
                                        'teacher_id': l2['teacher_id'], 'subject_id': l2['subject_id'], 'room_id': l2['room_id']
                                    })
                                    occupied_teacher.add((l1['teacher_id'], d, s1.id))
                                    occupied_teacher.add((l2['teacher_id'], d, s2.id))
                                    placed = True
                                    break
                        if placed:
                            break

                    if not placed:
                        # Add back to unpaired
                        unpaired.extend([l1, l2])

                # Allocate remaining unpaired lessons
                for l in unpaired:
                    placed = False
                    random.shuffle(class_grid)
                    for d, s in class_grid:
                        already_used = any(a['class_id'] == c.id and a['day'] == d and a['slot_id'] == s.id for a in current_assignments)
                        if not already_used:
                            t_free = (l['teacher_id'], d, s.id) not in occupied_teacher and avail_map.get((l['teacher_id'], d, s.id)) != 'BLOCKED'
                            if t_free:
                                current_assignments.append({
                                    'class_id': c.id, 'day': d, 'slot_id': s.id, 'slot_order': s.order,
                                    'teacher_id': l['teacher_id'], 'subject_id': l['subject_id'], 'room_id': l['room_id']
                                })
                                occupied_teacher.add((l['teacher_id'], d, s.id))
                                placed = True
                                break

                    if not placed:
                        # Fallback: place in any remaining free slot for class
                        for d, s in class_grid:
                            already_used = any(a['class_id'] == c.id and a['day'] == d and a['slot_id'] == s.id for a in current_assignments)
                            if not already_used:
                                current_assignments.append({
                                    'class_id': c.id, 'day': d, 'slot_id': s.id, 'slot_order': s.order,
                                    'teacher_id': l['teacher_id'], 'subject_id': l['subject_id'], 'room_id': l['room_id']
                                })
                                break

            # Evaluate candidate schedule
            eval_res = self.evaluator.evaluate_schedule(current_assignments, avail_map)
            if eval_res['viability_score'] > best_eval['viability_score']:
                best_eval = eval_res
                best_assignments = current_assignments

                if eval_res['hard_violations'] == 0 and eval_res['viability_score'] >= 98.0:
                    break # Reached high-quality optimal solution

        exec_duration = round(time.time() - start_time, 2)

        # 5. Persist to Database
        schedule = TimetableSchedule.objects.create(
            name=self.schedule_name,
            semester=self.semester,
            is_active=True,
            viability_score=best_eval['viability_score'],
            hard_violations_count=best_eval['hard_violations'],
            soft_penalties_score=best_eval['soft_penalty'],
            execution_time_seconds=exec_duration,
            algorithm_used="Hybrid Constructive Heuristic + Local Constraint Optimization"
        )

        # Build quick lookup for soft warnings
        warning_map = {}
        for s in best_eval.get('soft_details', []):
            if 'teacher_id' in s and 'day' in s:
                warning_map[(s['teacher_id'], s['day'])] = s['message']

        # Save slot assignments
        slot_assignment_objs = []
        for a in best_assignments:
            has_warn = (a['teacher_id'], a['day']) in warning_map
            msg = warning_map.get((a['teacher_id'], a['day']), None)
            slot_assignment_objs.append(
                TimetableSlotAssignment(
                    timetable_schedule=schedule,
                    school_class_id=a['class_id'],
                    day_of_week=a['day'],
                    time_slot_id=a['slot_id'],
                    subject_id=a['subject_id'],
                    teacher_id=a['teacher_id'],
                    room_id=a['room_id'],
                    has_conflict=has_warn,
                    conflict_type='SOFT_GAP' if has_warn else None,
                    conflict_message=msg
                )
            )

        TimetableSlotAssignment.objects.bulk_create(slot_assignment_objs)

        return {
            'schedule_id': schedule.id,
            'schedule_name': schedule.name,
            'viability_score': schedule.viability_score,
            'hard_violations': schedule.hard_violations_count,
            'soft_penalties': schedule.soft_penalties_score,
            'execution_time': schedule.execution_time_seconds,
            'total_assignments': len(slot_assignment_objs),
            'hard_details': best_eval['hard_details'],
            'soft_details': best_eval['soft_details'],
        }