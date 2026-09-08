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
-- Alocação (input do sistema — definida manualmente pelo coordenador)
-- ============================================================

CREATE TABLE alocacao (
    id               SERIAL PRIMARY KEY,
    turma_id         INT NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    disciplina_id    INT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    professor_id     INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    carga_horaria    INT NOT NULL CHECK (carga_horaria > 0),  -- em aulas/semana
    UNIQUE (turma_id, disciplina_id)  -- uma disciplina só é alocada uma vez por turma
);

-- ============================================================
-- Horário (OUTPUT do sistema — resultado do solver)
-- ============================================================

-- Nota de modelagem: professor_id é denormalizado aqui (já existe via
-- alocacao_id -> alocacao.professor_id) especificamente para permitir
-- que a restrição forte "professor não pode estar em duas turmas no
-- mesmo slot" seja garantida diretamente pelo banco via UNIQUE
-- constraint, sem depender de trigger ou validação só na aplicação.
-- É uma quebra de normalização estrita, feita de propósito, com
-- justificativa técnica clara — vale mencionar isso na documentação
-- entregue ao professor, já que ele pediu atenção à normalização.
CREATE TABLE horario (
    id             SERIAL PRIMARY KEY,
    alocacao_id    INT NOT NULL REFERENCES alocacao(id) ON DELETE CASCADE,
    slot_id        INT NOT NULL REFERENCES slot(id) ON DELETE CASCADE,
    professor_id   INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    UNIQUE (professor_id, slot_id),   -- garante restrição forte 1 no nível do banco
    UNIQUE (alocacao_id, slot_id)     -- evita duplicar a mesma aula no mesmo slot
);

-- Trigger para manter professor_id em horario sempre sincronizado
-- com alocacao.professor_id, evitando inconsistência manual
CREATE OR REPLACE FUNCTION sync_professor_horario()
RETURNS TRIGGER AS $$
BEGIN
    SELECT professor_id INTO NEW.professor_id
    FROM alocacao WHERE id = NEW.alocacao_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_professor_horario
BEFORE INSERT OR UPDATE ON horario
FOR EACH ROW EXECUTE FUNCTION sync_professor_horario();

-- ============================================================
-- Índices auxiliares (consultas mais comuns do sistema)
-- ============================================================

CREATE INDEX idx_turma_curso ON turma(curso_id);
CREATE INDEX idx_alocacao_turma ON alocacao(turma_id);
CREATE INDEX idx_alocacao_professor ON alocacao(professor_id);
CREATE INDEX idx_horario_alocacao ON horario(alocacao_id);
CREATE INDEX idx_horario_slot ON horario(slot_id);
CREATE INDEX idx_disponibilidade_professor ON professor_disponibilidade(professor_id);
