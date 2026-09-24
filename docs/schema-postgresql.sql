-- ============================================================
-- Schema PostgreSQL — Sistema de Timetabling
-- Baseado no DER consolidado a partir das entrevistas com o cliente
-- ============================================================

-- Tipos enumerados (mais seguro e legível que VARCHAR livre)
CREATE TYPE turno_enum AS ENUM ('manha', 'tarde', 'noite');
CREATE TYPE dia_semana_enum AS ENUM ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado');

-- ============================================================
-- Usuários (3 papéis, tabelas separadas — reflete a hierarquia
-- confirmada na entrevista: Admin único, Coordenador e Professor)
-- ============================================================

CREATE TABLE admin (
    id            SERIAL PRIMARY KEY,
    login         VARCHAR(100) UNIQUE NOT NULL,
    senha_hash    VARCHAR(255) NOT NULL
);

CREATE TABLE coordenador (
    id                      SERIAL PRIMARY KEY,
    nome                    VARCHAR(150) NOT NULL,
    login                   VARCHAR(100) UNIQUE NOT NULL,
    senha_hash              VARCHAR(255) NOT NULL,
    criado_por_admin_id     INT REFERENCES admin(id)
);

CREATE TABLE professor (
    id                          SERIAL PRIMARY KEY,
    nome                        VARCHAR(150) NOT NULL,
    login                       VARCHAR(100) UNIQUE NOT NULL,
    senha_hash                  VARCHAR(255) NOT NULL,
    criado_por_coordenador_id   INT REFERENCES coordenador(id)
);

-- ============================================================
-- Entidades acadêmicas
-- ============================================================

CREATE TABLE curso (
    id             SERIAL PRIMARY KEY,
    nome           VARCHAR(150) NOT NULL,
    nivel_ensino   VARCHAR(50) NOT NULL
);

CREATE TABLE turma (
    id                   SERIAL PRIMARY KEY,
    curso_id             INT NOT NULL REFERENCES curso(id) ON DELETE CASCADE,
    serie                VARCHAR(50) NOT NULL,
    quantidade_alunos    INT NOT NULL CHECK (quantidade_alunos > 0),
    periodo_letivo       VARCHAR(20) NOT NULL,
    turno                turno_enum NOT NULL
);

CREATE TABLE disciplina (
    id     SERIAL PRIMARY KEY,
    nome   VARCHAR(150) NOT NULL UNIQUE
);

-- ============================================================
-- Slots de horário (definidos pelo coordenador)
-- ============================================================

CREATE TABLE slot (
    id                 SERIAL PRIMARY KEY,
    dia_semana         dia_semana_enum NOT NULL,
    hora_inicio        TIME NOT NULL,
    duracao_minutos    INT NOT NULL CHECK (duracao_minutos > 0),
    UNIQUE (dia_semana, hora_inicio)
);

-- ============================================================
-- Relações N:N
-- ============================================================

-- Quais disciplinas cada professor está apto a lecionar
CREATE TABLE professor_disciplina (
    professor_id    INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    disciplina_id   INT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    PRIMARY KEY (professor_id, disciplina_id)
);

-- Disponibilidade declarada pelo professor (quais slots ele pode dar aula)
CREATE TABLE professor_disponibilidade (
    professor_id   INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    slot_id        INT NOT NULL REFERENCES slot(id) ON DELETE CASCADE,
    PRIMARY KEY (professor_id, slot_id)
);

-- ============================================================
-- Grade Horária (Versionamento e Execuções do Solver)
-- ============================================================

CREATE TABLE grade_horaria (
    id                       SERIAL PRIMARY KEY,
    nome                     VARCHAR(100) NOT NULL DEFAULT 'Grade Horária Oficial',
    semestre                 VARCHAR(20) NOT NULL DEFAULT '1º Semestre',
    ativa                    BOOLEAN NOT NULL DEFAULT TRUE,
    score_viabilidade        FLOAT NOT NULL DEFAULT 100.0,
    violacoes_hard           INT NOT NULL DEFAULT 0,
    penalidades_soft         FLOAT NOT NULL DEFAULT 0.0,
    tempo_execucao_segundos  FLOAT NOT NULL DEFAULT 0.0,
    algoritmo_utilizado      VARCHAR(100) NOT NULL DEFAULT 'Meta-heurística Construtiva Gulosa + Busca Local',
    criada_em                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Demanda Curricular (INPUT do coordenador — Decisão 006)
-- Define a quantidade de aulas semanais de cada disciplina para a turma
-- ============================================================

CREATE TABLE demanda_curricular (
    id                      SERIAL PRIMARY KEY,
    turma_id                INT NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    disciplina_id           INT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    professor_id            INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    aulas_semanais          INT NOT NULL CHECK (aulas_semanais > 0),
    permite_geminada        BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (turma_id, disciplina_id)
);

-- ============================================================
-- Alocação de Horário (OUTPUT do solver na grade — Decisão 006)
-- Representa as células preenchidas da grade semanal
-- ============================================================

CREATE TABLE alocacao_horario (
    id                  SERIAL PRIMARY KEY,
    grade_horaria_id    INT NOT NULL REFERENCES grade_horaria(id) ON DELETE CASCADE,
    turma_id            INT NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    slot_id             INT NOT NULL REFERENCES slot(id) ON DELETE CASCADE,
    disciplina_id       INT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    professor_id        INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    sobrescrita_manual  BOOLEAN NOT NULL DEFAULT FALSE,
    tem_conflito        BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_conflito       VARCHAR(50),
    mensagem_conflito   VARCHAR(255),
    UNIQUE (grade_horaria_id, turma_id, slot_id),      -- Garante restrição forte 3 (sem choque de turma)
    UNIQUE (grade_horaria_id, professor_id, slot_id)  -- Garante restrição forte 1 (sem choque de professor)
);

-- ============================================================
-- Índices auxiliares (consultas mais comuns do sistema)
-- ============================================================

CREATE INDEX idx_turma_curso ON turma(curso_id);
CREATE INDEX idx_demanda_turma ON demanda_curricular(turma_id);
CREATE INDEX idx_demanda_professor ON demanda_curricular(professor_id);
CREATE INDEX idx_alocacao_grade ON alocacao_horario(grade_horaria_id);
CREATE INDEX idx_alocacao_turma ON alocacao_horario(turma_id);
CREATE INDEX idx_alocacao_professor ON alocacao_horario(professor_id);
CREATE INDEX idx_alocacao_slot ON alocacao_horario(slot_id);
CREATE INDEX idx_disponibilidade_professor ON professor_disponibilidade(professor_id);

