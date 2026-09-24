class ConstraintEvaluator:
    def __init__(self, config_weights=None):
        self.weights = {
            'teacher_clash': 100000,
            'class_clash': 100000,
            'teacher_blocked': 100000,
            'min_gap_weight': 85,
            'double_lesson_weight': 90,
            'daily_balance_weight': 70,
            'day_concentration_weight': 60,
        }
        if config_weights:
            self.weights.update(config_weights)

    def evaluate_schedule(self, assignments, teacher_availabilities, max_daily_limits=None):
        """
        assignments: list of dicts:
          { 'class_id': int, 'day': int, 'slot_id': int, 'slot_order': int,
            'teacher_id': int, 'subject_id': int }
        """
        hard_violations = 0
        soft_penalty = 0
        hard_details = []
        soft_details = []

        # 1. HARD: Teacher Clashes
        # Map (teacher_id, day, slot_id) -> list of classes
        teacher_time_map = {}
        # 2. HARD: Class Clashes (turma com duas aulas simultâneas)
        # Map (class_id, day, slot_id) -> list of assignments
        class_time_map = {}
        # Teacher schedule by day: teacher_id -> day -> list of slot_orders
        teacher_day_slots = {}
        # Class schedule by day: class_id -> day -> list of subject_ids
        class_day_subjects = {}

        for a in assignments:
            t_key = (a['teacher_id'], a['day'], a['slot_id'])
            teacher_time_map.setdefault(t_key, []).append(a)

            c_key = (a['class_id'], a['day'], a['slot_id'])
            class_time_map.setdefault(c_key, []).append(a)

            # Check teacher blocked availability
            avail_key = (a['teacher_id'], a['day'], a['slot_id'])
            status = teacher_availabilities.get(avail_key, 'FREE')
            if status == 'BLOCKED':
                hard_violations += 1
                hard_details.append(f"Professor {a['teacher_id']} alocado em horário bloqueado (Dia {a['day']}, Slot {a['slot_id']})")

            # Collect for soft constraints
            teacher_day_slots.setdefault(a['teacher_id'], {}).setdefault(a['day'], []).append(a['slot_order'])
            class_day_subjects.setdefault(a['class_id'], {}).setdefault(a['day'], []).append(a['subject_id'])

        # Check teacher double-booking
        for (t_id, day, slot_id), class_list in teacher_time_map.items():
            if len(class_list) > 1:
                violation_count = len(class_list) - 1
                hard_violations += violation_count
                hard_details.append(f"Choque: Professor {t_id} alocado em {len(class_list)} turmas no Dia {day} Slot {slot_id}")

        # Check class double-booking
        for (c_id, day, slot_id), a_list in class_time_map.items():
            if len(a_list) > 1:
                violation_count = len(a_list) - 1
                hard_violations += violation_count
                hard_details.append(f"Choque: Turma {c_id} possui {len(a_list)} aulas simultâneas no Dia {day} Slot {slot_id}")


        # 3. SOFT CONSTRAINTS
        # A. Minimize Teacher Gaps (Janelas Vagas)
        gap_weight = self.weights.get('min_gap_weight', 85)
        for t_id, days_map in teacher_day_slots.items():
            for day, slot_orders in days_map.items():
                if len(slot_orders) > 1:
                    sorted_slots = sorted(slot_orders)
                    span = sorted_slots[-1] - sorted_slots[0] + 1
                    gaps = span - len(sorted_slots)
                    if gaps > 0:
                        soft_penalty += gaps * gap_weight
                        soft_details.append({
                            'type': 'SOFT_GAP',
                            'teacher_id': t_id,
                            'day': day,
                            'message': f"Professor {t_id} com {gaps} janela(s) vaga(s) no Dia {day}"
                        })

        # B. Subject Distribution (Avoid too many isolated singles or overcrowding)
        balance_weight = self.weights.get('daily_balance_weight', 70)
        for c_id, days_map in class_day_subjects.items():
            for day, subj_list in days_map.items():
                counts = {}
                for s in subj_list:
                    counts[s] = counts.get(s, 0) + 1
                for s, count in counts.items():
                    if count > 2: # More than 2 lessons of the same subject on the same day
                        soft_penalty += (count - 2) * balance_weight
                        soft_details.append({
                            'type': 'SOFT_BALANCE',
                            'class_id': c_id,
                            'subject_id': s,
                            'day': day,
                            'message': f"Turma {c_id} com {count} aulas da disciplina {s} no mesmo dia"
                        })

        # Viability Score calculation: 100 - (Hard * 25 + Soft normalized)
        viability_score = max(0.0, min(100.0, 100.0 - (hard_violations * 25.0) - (soft_penalty * 0.05)))

        return {
            'hard_violations': hard_violations,
            'soft_penalty': soft_penalty,
            'viability_score': round(viability_score, 1),
            'hard_details': hard_details,
            'soft_details': soft_details,
        }