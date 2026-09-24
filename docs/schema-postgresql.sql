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
-- Aula (fusão de Alocação + Horário)
-- ============================================================
-- Decisão de modelagem: cada linha já nasce representando UMA aula
-- da semana (não um resumo de carga horária). O coordenador, ao
-- definir que uma disciplina tem N aulas/semana para uma turma,
-- insere N linhas com slot_id NULL. O solver preenche slot_id.
--
-- Isso elimina duas fontes de verdade que existiam antes
-- (carga_horaria vs. contagem de linhas em Horario) e elimina a
-- necessidade do trigger de sincronização de professor_id/turma_id
-- — professor_id e turma_id agora são atributos nativos da linha,
-- não denormalização.
--
-- "Carga horária" deixa de ser um campo armazenado: é derivada por
-- COUNT(*) agrupando por turma_id + disciplina_id.
--
-- NULL em slot_id é o estado "ainda não alocado pelo solver". As
-- constraints UNIQUE abaixo não conflitam entre linhas com slot_id
-- NULL (comportamento padrão do Postgres: NULL nunca é igual a
-- NULL em UNIQUE), então múltiplas aulas pendentes coexistem sem
-- problema até o solver rodar.
--
-- Pressuposto assumido (não garantido por constraint, é
-- responsabilidade da aplicação ao inserir o lote de aulas): todas
-- as linhas de uma mesma combinação turma_id + disciplina_id devem
-- compartilhar o mesmo professor_id.
-- ============================================================

CREATE TABLE aula (
    id               SERIAL PRIMARY KEY,
    turma_id         INT NOT NULL REFERENCES turma(id) ON DELETE CASCADE,
    disciplina_id    INT NOT NULL REFERENCES disciplina(id) ON DELETE CASCADE,
    professor_id     INT NOT NULL REFERENCES professor(id) ON DELETE CASCADE,
    slot_id          INT REFERENCES slot(id) ON DELETE SET NULL,
    UNIQUE (professor_id, slot_id),  -- garante restrição forte 1 (professor) no nível do banco
    UNIQUE (turma_id, slot_id)       -- garante restrição forte 3 (turma) no nível do banco
);

-- ============================================================
-- Índices auxiliares (consultas mais comuns do sistema)
-- ============================================================

CREATE INDEX idx_turma_curso ON turma(curso_id);
CREATE INDEX idx_aula_turma ON aula(turma_id);
CREATE INDEX idx_aula_disciplina ON aula(disciplina_id);
CREATE INDEX idx_aula_professor ON aula(professor_id);
CREATE INDEX idx_aula_slot ON aula(slot_id);
CREATE INDEX idx_disponibilidade_professor ON professor_disponibilidade(professor_id);
