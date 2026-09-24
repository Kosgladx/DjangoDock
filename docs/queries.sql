-- ============================================================
-- Queries de referência — Sistema de Timetabling
-- Atualizado para a tabela `aula` (fusão de Alocação + Horário)
-- ============================================================

SELECT * FROM admin;

SELECT * FROM coordenador;


-- ------------------------------------------------------------
-- Query 1: alocações (quem leciona o quê, para quem)
-- Antes precisava de 4 JOINs passando por `alocacao`; agora é
-- direto, pois `aula` já carrega turma/disciplina/professor.
-- DISTINCT porque uma disciplina com carga horária > 1 aparece
-- em várias linhas de `aula` (uma por aula da semana) — aqui
-- queremos só a lista de alocações, não uma linha por aula.
-- ------------------------------------------------------------

SELECT DISTINCT
    professor.nome,
    curso.nome,
    turma.serie,
    turma.turno,
    disciplina.nome
FROM aula
JOIN professor  ON aula.professor_id  = professor.id
JOIN disciplina ON aula.disciplina_id = disciplina.id
JOIN turma      ON aula.turma_id      = turma.id
JOIN curso      ON turma.curso_id     = curso.id;


-- ------------------------------------------------------------
-- Query 2: horário completo, com dia/horário de cada aula
-- Filtra só aulas já alocadas (slot_id preenchido).
-- ------------------------------------------------------------

SELECT
    professor.nome,
    curso.nome,
    turma.serie,
    disciplina.nome,
    slot.dia_semana,
    slot.hora_inicio
FROM aula
JOIN professor  ON aula.professor_id  = professor.id
JOIN disciplina ON aula.disciplina_id = disciplina.id
JOIN turma      ON aula.turma_id      = turma.id
JOIN curso      ON turma.curso_id     = curso.id
JOIN slot       ON aula.slot_id       = slot.id
WHERE aula.slot_id IS NOT NULL;


-- ------------------------------------------------------------
-- Exemplos de filtro para acrescentar à Query 2 (adicionar com
-- AND depois do WHERE aula.slot_id IS NOT NULL acima):
-- ------------------------------------------------------------

-- AND professor.nome = 'Ana Paula Ferreira'
-- AND curso.nome = 'Ciência da Computação' AND turma.serie = '1º período'
