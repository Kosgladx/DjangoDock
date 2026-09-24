# 📑 Relatório Mensal de Evolução — Setembro de 2026

> **Projeto:** EduSchedule Timetabling  
> **Equipe:** Kauê Loreno (Tech Lead & Solver), Lucas (Backend & Dados), Pedro Dornellas (Frontend UI)  
> **Mês de Referência:** Setembro / 2026  
> **Data de Emissão:** 24/09/2026  

---

## 1. Resumo Executivo do Mês

Durante o mês de Setembro de 2026, a equipe realizou a estruturação fundacional do projeto **EduSchedule**, transformando o repositório em um **Monorepo profissional** com paridade entre desenvolvimento ágil e ambiente conteinerizado. Foram superados gargalos críticos de modelagem matemática e arquitetura de software: a substituição do solver exato (MILP) por meta-heurísticas de alta escalabilidade, o alinhamento estrito do domínio excluindo entidades fora de escopo (salas), a separação clara entre intenção curricular e grade gerada, e a implementação de um ecossistema de onboarding e automação em 1-clique para todo o time.

---

## 2. Entregas Técnicas Consolidadas & Panorama da Engenharia do Repositório

### 2.1. Arquitetura do Repositório & Higiene Estrutural (Monorepo Limpo)
- **Eliminação de Redundâncias:** Remoção de diretórios aninhados legados (`django_project`) e promoção do projeto para a raiz `TimeTabling/`, consolidando um Monorepo unificado com três frentes bem delimitadas:
  - `backend/`: API REST em Django e Django REST Framework.
  - `frontend/`: Single Page Application (SPA) em React 18, Vite e TypeScript.
  - `docs/`: Documentação viva de Engenharia de Software e modelagem relacional.
- **Preservação Histórica:** Todos os commits anteriores de cada membro da equipe (Lucas e Pedro) foram integralmente preservados no histórico do Git.
- **Isolamento de Credenciais:** Configuração de leitor nativo de variáveis de ambiente (`backend/.env`) e disponibilização de um modelo versionado seguro (`backend/.env.example`).
- **Blindagem do Git contra Conflitos Binários:** Adição do banco de dados local SQLite (`*.sqlite3` e `db.sqlite3`) ao `.gitignore`. O banco agora é gerado e populado on-the-fly, eliminando 100% dos conflitos de merge de arquivos binários entre os desenvolvedores.

### 2.2. Reprodutibilidade de Ambiente & Automação em 1-Clique
- **Script Inteligente de Setup (`setup_dev.bat`):** Automação em lote para Windows que valida o executável Python no PATH, cria o ambiente virtual `.venv`, instala pacotes via `requirements.txt`, gera o `.env` inicial, roda as migrações estruturais do Django e executa a carga de dados de teste (seed).
- **Scripts de Execução Ágil:** 
  - `run_backend.bat`: Inicialização rápida do backend com auto-ativação inteligente do `.venv`.
  - `run_frontend.bat`: Inicialização do frontend com checagem preventiva de Node/npm e auto-instalação de dependências.

### 2.3. Massa de Dados Automatizada e Idempotente (`seed_data.py`)
- **Comando Django Nativo (`python manage.py seed_data`):** Desenvolvido em `backend/core/management/commands/seed_data.py` com suporte à codificação ASCII segura para terminais Windows (evitando falhas de CP1252).
- **Idempotência Absoluta:** Utiliza `update_or_create` e `get_or_create`, garantindo que executar o comando uma ou cem vezes mantenha a base íntegra sem duplicar registros.
- **Catálogo Mestre Provisionado em ~2 segundos:**
  - 1 Turno Matutino com 6 períodos letivos e intervalo pedagógico de 20 minutos.
  - 12 Disciplinas escolares parametrizadas com códigos e cores hexadecimais para interface.
  - 11 Professores com limites de carga horária semanal e 275 slots de disponibilidade mapeados (incluindo restrições específicas como bloqueio de sextas-feiras).
  - 2 Turmas escolares (3º Ano A e 3º Ano B) do Ensino Médio.
  - 11 Demandas curriculares completas vinculadas ao 3º Ano A.
  - 6 Parâmetros e pesos calibrados para o solver (Hard e Soft Constraints).
- **Disparador Integrado (`--with-solver`):** Permite popular a base e já executar o algoritmo para alocar a grade com um único comando.

### 2.4. Paridade com Produção e Ambientes Híbridos (Docker Compose)
- **Container de Banco (PostgreSQL 16 Alpine):** Provisionado na porta `5432` com volumes montados em `/docker-entrypoint-initdb.d/` executando automaticamente os scripts canônicos `docs/schema-postgresql.sql` e `docs/sample-dataDB.sql`.
- **Container Web (Django API):** Imagem conteinerizada em `python:3.12-slim-bookworm` com live-reload da pasta `backend/`.
- **Chaveamento Transparente Multi-Database:** Configuração em `settings.py` que comuta automaticamente entre SQLite (desenvolvimento local imediato <1s) e PostgreSQL corporativo (Docker Compose) via variáveis de ambiente.

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
