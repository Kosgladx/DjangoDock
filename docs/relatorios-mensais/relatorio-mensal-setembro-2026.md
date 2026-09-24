# 📑 Relatório Mensal de Evolução — Setembro de 2026

> **Projeto:** EduSchedule Timetabling  
> **Equipe:** Kauê Loreno (Tech Lead & Solver), Lucas (Backend & Dados), Pedro Dornellas (Frontend UI)  
> **Mês de Referência:** Setembro / 2026  
> **Data de Emissão:** 24/09/2026  

---

## 1. Resumo Executivo do Mês

Durante o mês de Setembro de 2026, a equipe realizou a estruturação fundacional do projeto **EduSchedule**, transformando o repositório em um **Monorepo profissional** com paridade entre desenvolvimento ágil e ambiente conteinerizado. Foram superados gargalos críticos de modelagem matemática e arquitetura de software: a substituição do solver exato (MILP) por meta-heurísticas de alta escalabilidade, o alinhamento estrito do domínio excluindo entidades fora de escopo (salas), a separação clara entre intenção curricular e grade gerada, e a implementação de um ecossistema de onboarding e automação em 1-clique para todo o time.

---

## 2. Entregas Técnicas Consolidadas

### 2.1. Arquitetura do Repositório & Higiene de Código
- **Unificação em Monorepo:** Estruturação padronizada das pastas `backend/` (Django REST Framework), `frontend/` (React/Vite/TypeScript) e `docs/` (Engenharia de Software).
- **Isolamento de Credenciais:** Configuração de leitor nativo de variáveis de ambiente (`backend/.env`) e modelo versionado (`backend/.env.example`).
- **Prevenção de Conflitos no Git:** Adição do banco SQLite local (`db.sqlite3`) ao `.gitignore`, impedindo conflitos binários de merge entre os desenvolvedores.

### 2.2. Reprodutibilidade de Ambiente & Automação
- **Script de 1-Clique (`setup_dev.bat`):** Automação que cria o ambiente virtual `.venv`, instala dependências do `requirements.txt`, gera o `.env`, aplica migrações e popula dados de teste de forma autônoma.
- **Scripts de Execução:** `run_backend.bat` (com auto-ativação do `.venv`) e `run_frontend.bat` (com verificação preventiva de Node/npm).
- **Massa de Dados Idempotente (`seed_data.py`):** Comando Django nativo que popula 1 turno (6 slots), 12 disciplinas com códigos hexadecimais, 11 professores com 275 slots de disponibilidade, 2 turmas (3º Ano A e B) e os 6 parâmetros de restrições em menos de 3 segundos.

### 2.3. Paridade com Produção (Docker Compose)
- **Container de Banco:** PostgreSQL 16 Alpine na porta `5432` com carga inicial automática via `docs/schema-postgresql.sql` e `docs/sample-dataDB.sql`.
- **Container Web:** Imagem `python:3.12-slim-bookworm` orquestrada e integrada com live-reload da pasta `backend/`.

---

## 3. Decisões Arquiteturais Registradas no Mês (ADRs)

| ADR | Título | Impacto Principal no Projeto |
| :---: | :--- | :--- |
| **004** | Substituição de MILP por Meta-heurísticas | Rejeição de modelos exatos devido à explosão combinatória ($2^{262.500}$ estados e gargalo de Branch-and-Bound na RAM); adoção de heurísticas gulosas com busca local em tempo previsível (5-10s). |
| **005** | Exclusão da Entidade Sala do Escopo Ativo | Eliminação de complexidade desnecessária e alinhamento estrito com os requisitos da entrevista do cliente (sala reservada como extensão para o TCC). |
| **006** | Segregação de Demanda Curricular e Alocação | Separação entre `CurriculumRequirement` (input agregado do coordenador) e `TimetableSlotAssignment` (célula resolvida da grade), com constraints `UNIQUE` semânticas no PostgreSQL. |
| **007** | Design Conceitual & Prototipação | Adoção de metodologia de modelagem de matrizes em memória prévia à escrita de testes, com blindagem posterior via testes de invariantes. |
| **008** | Arquitetura de Ambientes Híbrida | Uso de SQLite local para desenvolvimento ágil ultrarrápido (<1s) e PostgreSQL via Docker Compose para homologação e apresentação de banca. |

---

## 4. Governança de Equipe & Gestão de Processo

- **Adoção do GitHub Flow:** Abandono de commits diretos na `main`. O time agora opera com branches curtas de funcionalidade (`feat/...`), garantindo isolamento total do trabalho.
- **Rituais Ágeis:** Definição do processo de **Homologação Semanal** conduzido pelo Tech Lead (Kauê) e comunicação diária de impeditivos via WhatsApp.
- **Documentação de Suporte:**
  - `SETUP_EQUIPE.md`: Onboarding, catálogo completo do `seed_data.py` e FAQ de erros de Windows.
  - `docs/guia-git-fluxo-trabalho.md`: Receita prática em 5 passos para branches, commits semânticos e Pull Requests.
  - `docs/arquitetura-software.md`: Diagrama Mermaid das 3 camadas e especificação de persistência.

---

## 5. Planejamento da Sprint 1 e Próximos Passos

O mês encerra com o planejamento oficial da **Sprint 1 (25/09 a 02/10)** estruturado em `docs/sprints/sprint-01.md`:
* **Kauê Loreno:** Construção do motor heurístico construtivo em memória (`backend/solver/`).
* **Lucas:** Conexão da rota `/api/run-solver/` e persistência no banco (`backend/core/`).
* **Pedro Dornellas:** Renderização da matriz semanal e botão de ação na interface (`frontend/src/`).
* **Meta para 10/10/2026:** Entrega oficial da API Funcional com alocação automática de horários sem conflitos.
