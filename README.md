# EduSchedule — Sistema de Resolução de Horários Escolares (Timetabling)

> Sistema web full-stack para geração e otimização automatizada de grades horárias escolares, modelado para resolver o problema clássico de alocação combinatória (*University/School Course Timetabling Problem — UCTP*) por meio de **meta-heurísticas construtivas e busca local**.

---

## 🏛️ Arquitetura do Repositório

O projeto é estruturado em um monorepo modular e desacoplado:

```text
TimeTabling/
├── docs/                      # Documentação viva de Engenharia de Software (DER, ADRs, Requisitos)
│   ├── decisoes-arquiteturais.md
│   ├── requisitos-timetabling-tecnico.md
│   ├── schema-postgresql.sql
│   ├── der-timetabling.md
│   ├── diagrama-classes-timetabling.md
│   └── casos-de-uso-timetabling.md
├── backend/                   # API REST (Django + Django REST Framework)
│   ├── core/                  # Domínio acadêmico, modelos e endpoints
│   ├── solver/                # Motor de otimização matemática (Meta-heurística)
│   ├── eduschedule_backend/   # Configurações do framework e multi-database
│   ├── Dockerfile             # Imagem conteinerizada do backend
│   └── requirements.txt       # Dependências Python travadas
├── frontend/                  # Single Page Application (React 18 + TypeScript + Vite + Tailwind CSS)
│   ├── src/pages/             # Telas de Matriz de Horários, Docentes e Slots
│   ├── src/components/        # Modais de cadastro e edição
│   └── package.json           # Dependências e scripts do frontend
├── docker-compose.yml         # Orquestração do ambiente completo (PostgreSQL + Backend)
├── run_backend.bat            # Script de inicialização rápida do backend (auto-ativa .venv)
└── run_frontend.bat           # Script de inicialização rápida do frontend
```

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Python 3.12, Django 5.x, Django REST Framework, django-cors-headers, Pillow.
* **Banco de Dados:** PostgreSQL 16 (ambiente conteinerizado/produção) e SQLite 3 (desenvolvimento local imediato).
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
* **Infraestrutura & DevOps:** Docker, Docker Compose, Git.
* **Algoritmos & Otimização:** Heurística Construtiva Gulosa + Busca Local para Otimização de Restrições.

---

## 🚀 Como Executar o Projeto

### Opção 1: Via Docker Compose (Recomendado / Completo)

Com o Docker instalado, execute na raiz do projeto:

```bash
docker compose up --build
```

* **Backend / API:** `http://localhost:8000/api/`
* **Banco de Dados PostgreSQL:** porta `5432` (com schema e carga inicial provisionados automaticamente via `docs/`).

---

### Opção 2: Execução Local no Host

#### 1. Backend (Django)

1. Crie e ative um ambiente virtual:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate   # Windows
   ```
2. Instale as dependências:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Configure o arquivo de ambiente:
   * Copie `backend/.env.example` para `backend/.env` (por padrão já vem configurado para SQLite local).
4. Execute as migrações e inicialize a API:
   ```bash
   python backend/manage.py migrate
   python backend/manage.py runserver 127.0.0.1:8000
   ```
   *(Ou execute diretamente o atalho `run_backend.bat` na raiz)*

#### 2. Frontend (React + Vite)

1. Abra um terminal na pasta `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *(Ou execute diretamente o atalho `run_frontend.bat` na raiz)*
2. Acesse a aplicação no navegador em: `http://localhost:5173` ou `http://localhost:3000`.

---

## 🧠 Motor de Resolução (*Timetabling Problem Solver*)

O solver reside no módulo `backend/solver/` e opera em duas etapas:

1. **Fase Construtiva Gulosa:**
   Aloca pares de aulas geminadas e avulsas na matriz temporal respeitando estritamente as **restrições fortes** (*hard constraints*):
   * Sem choque de professor (1 docente em no máximo 1 turma por slot).
   * Sem choque de turma (1 turma com no máximo 1 aula por slot).
   * Respeito absoluto aos horários bloqueados declarados pelo professor.
2. **Fase de Otimização e Busca Local:**
   Minimiza penalidades de **restrições fracas** (*soft constraints*):
   * Minimização de janelas vagas (*gaps*) na jornada docente.
   * Agrupamento de aulas geminadas contíguas.
   * Equilíbrio na distribuição semanal de disciplinas.

---

## 📚 Documentação Técnica e Decisões de Arquitetura

Toda a fundamentação teórica, modelagem conceitual e registro histórico de engenharia do projeto estão versionados na pasta `docs/`:

* **[Guia de Onboarding da Equipe (SETUP_EQUIPE.md)](SETUP_EQUIPE.md):** Manual rápido de setup em 1-clique, comandos do `seed_data.py`, catálogo de professores/matérias e FAQ de desenvolvimento.
* **[Arquitetura de Software e Ambientes](docs/arquitetura-software.md):** Visão completa das 3 camadas (Frontend, Backend, Solver) e estratégia de ambientes híbridos (SQLite Local vs. PostgreSQL Docker).
* **[Log de Decisões Arquiteturais (ADRs)](docs/decisoes-arquiteturais.md):** Histórico formal de decisões tomadas (Decisões 001 a 008), incluindo o comparativo matemático de complexidade entre MILP e Meta-heurísticas, segregação de demanda/alocação e arquitetura de ambientes híbrida.
* **[Requisitos Técnicos Consolidados](docs/requisitos-timetabling-tecnico.md):** Escopo delimitado com o cliente, papéis de acesso e regras de negócio.
* **[Schema Físico PostgreSQL](docs/schema-postgresql.sql):** DDL do banco de dados relacional com tipos enumerados, índices e restrições de integridade.
* **[Diagrama Entidade-Relacionamento (DER)](docs/der-timetabling.md):** Modelagem conceitual das entidades acadêmicas e seus relacionamentos.
* **[Diagrama de Classes](docs/diagrama-classes-timetabling.md):** Estrutura de classes e métodos do domínio.
* **[Casos de Uso](docs/casos-de-uso-timetabling.md):** Atores, fluxos principais e cenários de exceção do sistema.