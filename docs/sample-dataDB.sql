-- ============================================================
-- DADOS DE EXEMPLO — SISTEMA DE TIMETABLING
-- PostgreSQL
-- ============================================================
-- Pressupõe que as tabelas estejam vazias e que os IDs SERIAL
-- comecem em 1.
--
-- As senhas abaixo são apenas hashes fictícios para ambiente
-- de desenvolvimento/teste.
-- ============================================================


-- ============================================================
-- 1. ADMIN
-- ============================================================

INSERT INTO admin (login, senha_hash) VALUES
('admin', '$2b$12$hash_ficticio_admin');


-- ============================================================
-- 2. COORDENADORES
-- ============================================================

INSERT INTO coordenador
    (nome, login, senha_hash, criado_por_admin_id)
VALUES
('Mariana Souza', 'mariana.souza', '$2b$12$hash_mariana', 1),
('Ricardo Almeida', 'ricardo.almeida', '$2b$12$hash_ricardo', 1);


-- ============================================================
-- 3. PROFESSORES
-- ============================================================

INSERT INTO professor
    (nome, login, senha_hash, criado_por_coordenador_id)
VALUES
('Ana Paula Ferreira',   'ana.ferreira',    '$2b$12$hash_ana',      1),
('Bruno Martins',        'bruno.martins',   '$2b$12$hash_bruno',    1),
('Carla Mendes',         'carla.mendes',    '$2b$12$hash_carla',    1),
('Daniel Oliveira',      'daniel.oliveira', '$2b$12$hash_daniel',   1),
('Eduardo Lima',         'eduardo.lima',    '$2b$12$hash_eduardo',  2),
('Fernanda Rocha',       'fernanda.rocha',  '$2b$12$hash_fernanda', 2),
('Gabriel Santos',       'gabriel.santos',  '$2b$12$hash_gabriel',  2),
('Helena Costa',         'helena.costa',    '$2b$12$hash_helena',   2);


-- ============================================================
-- 4. CURSOS
-- ============================================================

INSERT INTO curso (nome, nivel_ensino) VALUES
('Ciência da Computação',        'Graduação'),
('Sistemas de Informação',       'Graduação'),
('Análise e Desenvolvimento de Sistemas', 'Tecnólogo');


-- ============================================================
-- 5. TURMAS
-- ============================================================

INSERT INTO turma
    (curso_id, serie, quantidade_alunos, periodo_letivo, turno)
VALUES
-- Ciência da Computação
(1, '1º período', 40, '2026.2', 'manha'),
(1, '3º período', 35, '2026.2', 'tarde'),

-- Sistemas de Informação
(2, '1º período', 38, '2026.2', 'noite'),
(2, '3º período', 32, '2026.2', 'noite'),

-- ADS
(3, '1º período', 42, '2026.2', 'manha'),
(3, '3º período', 36, '2026.2', 'noite');


-- ============================================================
-- 6. DISCIPLINAS
-- ============================================================

INSERT INTO disciplina (nome) VALUES
('Algoritmos e Programação'),       -- 1
('Banco de Dados'),                 -- 2
('Engenharia de Software'),         -- 3
('Estrutura de Dados'),             -- 4
('Redes de Computadores'),          -- 5
('Sistemas Operacionais'),          -- 6
('Matemática Discreta'),            -- 7
('Programação Orientada a Objetos'),-- 8
('Desenvolvimento Web'),            -- 9
('Interação Humano-Computador');    -- 10


-- ============================================================
-- 7. SLOTS DE HORÁRIO
-- ============================================================
-- Foram criados slots para manhã, tarde e noite.
-- Cada aula possui duração de 50 minutos.
-- ============================================================

INSERT INTO slot (dia_semana, hora_inicio, duracao_minutos) VALUES

-- ---------------- SEGUNDA ----------------
('segunda', '07:30', 50),  -- 1
('segunda', '08:20', 50),  -- 2
('segunda', '09:20', 50),  -- 3
('segunda', '10:10', 50),  -- 4

('segunda', '13:00', 50),  -- 5
('segunda', '13:50', 50),  -- 6
('segunda', '14:50', 50),  -- 7
('segunda', '15:40', 50),  -- 8

('segunda', '18:30', 50),  -- 9
('segunda', '19:20', 50),  -- 10
('segunda', '20:20', 50),  -- 11
('segunda', '21:10', 50),  -- 12

-- ---------------- TERÇA ----------------
('terca', '07:30', 50),    -- 13
('terca', '08:20', 50),    -- 14
('terca', '09:20', 50),    -- 15
('terca', '10:10', 50),    -- 16

('terca', '13:00', 50),    -- 17
('terca', '13:50', 50),    -- 18
('terca', '14:50', 50),    -- 19
('terca', '15:40', 50),    -- 20

('terca', '18:30', 50),    -- 21
('terca', '19:20', 50),    -- 22
('terca', '20:20', 50),    -- 23
('terca', '21:10', 50),    -- 24

-- ---------------- QUARTA ----------------
('quarta', '07:30', 50),   -- 25
('quarta', '08:20', 50),   -- 26
('quarta', '09:20', 50),   -- 27
('quarta', '10:10', 50),   -- 28

('quarta', '13:00', 50),   -- 29
('quarta', '13:50', 50),   -- 30
('quarta', '14:50', 50),   -- 31
('quarta', '15:40', 50),   -- 32

('quarta', '18:30', 50),   -- 33
('quarta', '19:20', 50),   -- 34
('quarta', '20:20', 50),   -- 35
('quarta', '21:10', 50),   -- 36

-- ---------------- QUINTA ----------------
('quinta', '07:30', 50),   -- 37
('quinta', '08:20', 50),   -- 38
('quinta', '09:20', 50),   -- 39
('quinta', '10:10', 50),   -- 40

('quinta', '13:00', 50),   -- 41
('quinta', '13:50', 50),   -- 42
('quinta', '14:50', 50),   -- 43
('quinta', '15:40', 50),   -- 44

('quinta', '18:30', 50),   -- 45
('quinta', '19:20', 50),   -- 46
('quinta', '20:20', 50),   -- 47
('quinta', '21:10', 50),   -- 48

-- ---------------- SEXTA ----------------
('sexta', '07:30', 50),    -- 49
('sexta', '08:20', 50),    -- 50
('sexta', '09:20', 50),    -- 51
('sexta', '10:10', 50),    -- 52

('sexta', '13:00', 50),    -- 53
('sexta', '13:50', 50),    -- 54
('sexta', '14:50', 50),    -- 55
('sexta', '15:40', 50),    -- 56

('sexta', '18:30', 50),    -- 57
('sexta', '19:20', 50),    -- 58
('sexta', '20:20', 50),    -- 59
('sexta', '21:10', 50);    -- 60


-- ============================================================
-- 8. PROFESSOR x DISCIPLINA
-- ============================================================
-- Define quais disciplinas cada professor está apto a lecionar.
-- ============================================================

INSERT INTO professor_disciplina
    (professor_id, disciplina_id)
VALUES

-- Ana: programação
(1, 1), -- Algoritmos
(1, 4), -- Estrutura de Dados
(1, 8), -- POO

-- Bruno: banco e software
(2, 2), -- Banco de Dados
(2, 3), -- Engenharia de Software

-- Carla: matemática e algoritmos
(3, 7), -- Matemática Discreta
(3, 1), -- Algoritmos

-- Daniel: infraestrutura
(4, 5), -- Redes
(4, 6), -- Sistemas Operacionais

-- Eduardo: desenvolvimento
(5, 8), -- POO
(5, 9), -- Desenvolvimento Web

-- Fernanda: software/IHC
(6, 3),  -- Engenharia de Software
(6, 10), -- IHC
(6, 9),  -- Desenvolvimento Web

-- Gabriel: banco
(7, 2), -- Banco de Dados
(7, 6), -- Sistemas Operacionais

-- Helena: matemática/programação
(8, 7), -- Matemática Discreta
(8, 4); -- Estrutura de Dados


-- ============================================================
-- 9. DISPONIBILIDADE DOS PROFESSORES
-- ============================================================
-- Para simplificar os testes, cada professor possui vários slots
-- disponíveis, mas não necessariamente a semana inteira.
-- ============================================================

INSERT INTO professor_disponibilidade
    (professor_id, slot_id)
VALUES

-- Ana - manhã
(1,1), (1,2), (1,3), (1,4),
(1,13), (1,14), (1,15), (1,16),
(1,25), (1,26), (1,27), (1,28),
(1,37), (1,38), (1,39), (1,40),

-- Bruno - manhã/tarde
(2,1), (2,2), (2,13), (2,14),
(2,17), (2,18), (2,19), (2,20),
(2,29), (2,30), (2,31), (2,32),
(2,41), (2,42),

-- Carla - manhã
(3,3), (3,4),
(3,15), (3,16),
(3,25), (3,26), (3,27), (3,28),
(3,49), (3,50), (3,51), (3,52),

-- Daniel - tarde/noite
(4,17), (4,18), (4,19), (4,20),
(4,29), (4,30), (4,31), (4,32),
(4,45), (4,46), (4,47), (4,48),
(4,57), (4,58), (4,59), (4,60),

-- Eduardo - noite
(5,9), (5,10), (5,11), (5,12),
(5,21), (5,22), (5,23), (5,24),
(5,33), (5,34), (5,35), (5,36),
(5,45), (5,46), (5,47), (5,48),

-- Fernanda - tarde/noite
(6,5), (6,6), (6,7), (6,8),
(6,29), (6,30), (6,31), (6,32),
(6,33), (6,34), (6,35), (6,36),
(6,57), (6,58), (6,59), (6,60),

-- Gabriel - noite
(7,9), (7,10), (7,11), (7,12),
(7,21), (7,22), (7,23), (7,24),
(7,45), (7,46), (7,47), (7,48),
(7,57), (7,58), (7,59), (7,60),

-- Helena - manhã/noite
(8,1), (8,2), (8,3), (8,4),
(8,25), (8,26), (8,27), (8,28),
(8,37), (8,38), (8,39), (8,40),
(8,45), (8,46), (8,47), (8,48);

-- ============================================================
-- 10. AULAS (fusão de Alocação + Horário)
-- ============================================================
-- Cada linha representa UMA aula da semana. Uma disciplina com
-- carga horária de 2 aulas/semana para uma turma gera 2 linhas
-- aqui, com o MESMO turma_id + disciplina_id + professor_id,
-- diferindo apenas no slot_id.
--
-- "Carga horária" de uma alocação = COUNT(*) agrupando por
-- turma_id + disciplina_id (ver query de verificação na seção 11).
--
-- Todas respeitam professor_disciplina e professor_disponibilidade.
-- ============================================================

INSERT INTO aula
    (turma_id, disciplina_id, professor_id, slot_id)
VALUES

-- ------------------------------------------------------------
-- Turma 1 - Ciência da Computação - 1º período - manhã
-- ------------------------------------------------------------
-- Algoritmos / Ana
(1, 1, 1, 1),   -- segunda 07:30
(1, 1, 1, 2),   -- segunda 08:20

-- Matemática Discreta / Carla
(1, 7, 3, 15),  -- terça 09:20
(1, 7, 3, 16),  -- terça 10:10

-- POO / Ana
(1, 8, 1, 25),  -- quarta 07:30
(1, 8, 1, 26),  -- quarta 08:20

-- ------------------------------------------------------------
-- Turma 2 - Ciência da Computação - 3º período - tarde
-- ------------------------------------------------------------
-- Banco de Dados / Bruno
(2, 2, 2, 17),  -- terça 13:00
(2, 2, 2, 18),  -- terça 13:50

-- Redes / Daniel
(2, 5, 4, 29),  -- quarta 13:00
(2, 5, 4, 30),  -- quarta 13:50

-- Engenharia de Software / Fernanda
(2, 3, 6, 5),   -- segunda 13:00
(2, 3, 6, 6),   -- segunda 13:50

-- ------------------------------------------------------------
-- Turma 3 - Sistemas de Informação - 1º período - noite
-- ------------------------------------------------------------
-- Banco de Dados / Gabriel
(3, 2, 7, 9),   -- segunda 18:30
(3, 2, 7, 10),  -- segunda 19:20

-- POO / Eduardo
(3, 8, 5, 21),  -- terça 18:30
(3, 8, 5, 22),  -- terça 19:20

-- Matemática Discreta / Helena
(3, 7, 8, 45),  -- quinta 18:30
(3, 7, 8, 46),  -- quinta 19:20

-- ------------------------------------------------------------
-- Turma 4 - Sistemas de Informação - 3º período - noite
-- ------------------------------------------------------------
-- Sistemas Operacionais / Gabriel
(4, 6, 7, 23),  -- terça 20:20
(4, 6, 7, 24),  -- terça 21:10

-- Desenvolvimento Web / Eduardo
(4, 9, 5, 33),  -- quarta 18:30
(4, 9, 5, 34),  -- quarta 19:20

-- IHC / Fernanda
(4, 10, 6, 57), -- sexta 18:30
(4, 10, 6, 58), -- sexta 19:20

-- ------------------------------------------------------------
-- Turma 5 - ADS - 1º período - manhã
-- ------------------------------------------------------------
-- Algoritmos / Ana
(5, 1, 1, 13),  -- terça 07:30
(5, 1, 1, 14),  -- terça 08:20

-- Matemática Discreta / Carla
(5, 7, 3, 49),  -- sexta 07:30
(5, 7, 3, 50),  -- sexta 08:20

-- Estrutura de Dados / Helena
(5, 4, 8, 37),  -- quinta 07:30
(5, 4, 8, 38),  -- quinta 08:20

-- ------------------------------------------------------------
-- Turma 6 - ADS - 3º período - noite
-- ------------------------------------------------------------
-- Banco de Dados / Gabriel
(6, 2, 7, 57),  -- sexta 18:30
(6, 2, 7, 58),  -- sexta 19:20

-- Desenvolvimento Web / Eduardo
(6, 9, 5, 45),  -- quinta 18:30
(6, 9, 5, 46),  -- quinta 19:20

-- IHC / Fernanda
(6, 10, 6, 33), -- quarta 18:30
(6, 10, 6, 34); -- quarta 19:20


-- ============================================================
-- 11. CONSULTAS PARA VERIFICAR OS DADOS
-- ============================================================

-- ------------------------------------------------------------
-- Horário completo e legível
-- ------------------------------------------------------------

SELECT
    a.id AS aula_id,
    c.nome AS curso,
    t.serie,
    t.turno,
    d.nome AS disciplina,
    p.nome AS professor,
    s.dia_semana,
    s.hora_inicio,
    s.duracao_minutos
FROM aula a
JOIN turma t
    ON t.id = a.turma_id
JOIN curso c
    ON c.id = t.curso_id
JOIN disciplina d
    ON d.id = a.disciplina_id
JOIN professor p
    ON p.id = a.professor_id
JOIN slot s
    ON s.id = a.slot_id
ORDER BY
    t.id,
    CASE s.dia_semana
        WHEN 'segunda' THEN 1
        WHEN 'terca'   THEN 2
        WHEN 'quarta'  THEN 3
        WHEN 'quinta'  THEN 4
        WHEN 'sexta'   THEN 5
        WHEN 'sabado'  THEN 6
    END,
    s.hora_inicio;


-- ------------------------------------------------------------
-- Quantidade de aulas geradas (carga horária derivada) por
-- turma + disciplina + professor
-- ------------------------------------------------------------
-- Antes (com Alocação separada), esta query comparava
-- "carga_horaria esperada" vs. "aulas_geradas", pois eram duas
-- fontes de verdade que podiam divergir. Com a fusão em Aula,
-- não existe mais "esperado" separado de "gerado" — a contagem
-- de linhas JÁ É a carga horária. Esta query serve para
-- inspecionar essa contagem, não para comparar duas fontes.
-- ------------------------------------------------------------

SELECT
    t.id AS turma_id,
    d.nome AS disciplina,
    p.nome AS professor,
    COUNT(a.id) AS aulas_por_semana,
    COUNT(a.slot_id) AS aulas_ja_alocadas,
    COUNT(a.id) - COUNT(a.slot_id) AS aulas_pendentes
FROM aula a
JOIN turma t
    ON t.id = a.turma_id
JOIN disciplina d
    ON d.id = a.disciplina_id
JOIN professor p
    ON p.id = a.professor_id
GROUP BY
    t.id,
    d.nome,
    p.nome
ORDER BY t.id;


-- ------------------------------------------------------------
-- Verificar se algum professor foi colocado fora da
-- disponibilidade declarada
-- ------------------------------------------------------------

SELECT
    p.nome AS professor,
    s.dia_semana,
    s.hora_inicio
FROM aula a
JOIN professor p
    ON p.id = a.professor_id
JOIN slot s
    ON s.id = a.slot_id
LEFT JOIN professor_disponibilidade pd
    ON pd.professor_id = a.professor_id
   AND pd.slot_id = a.slot_id
WHERE a.slot_id IS NOT NULL
  AND pd.professor_id IS NULL;

-- Resultado esperado: 0 linhas.


-- ============================================================
-- FIM DOS DADOS DE EXEMPLO
-- ============================================================
