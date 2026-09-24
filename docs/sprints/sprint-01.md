# 🏃 Sprint 01 — Core do Solver e Integração Ponta a Ponta da Grade

> **Status:** Em Andamento  
> **Período Contemplado:** 25/09/2026 (Sexta-feira) a 02/10/2026 (Sexta-feira)  
> **Meta da Sprint (Sprint Goal):** Ter o algoritmo construtivo alocando aulas sem nenhum choque de professor ou turma, com a grade sendo persistida pelo backend e visualizada na tela do frontend.

---

## 🎯 Foco Estratégico da Sprint
Conectar a primeira **fatia vertical completa** do sistema:
1. O solver calcula a alocação de horários na memória RAM sem violar restrições fortes (*hard constraints*).
2. O backend disponibiliza o endpoint `/api/run-solver/`, executa o motor e salva o resultado no banco.
3. O frontend consome a API e renderiza a grade semanal da turma na tela.

---

## 👥 Distribuição de Responsabilidades e Tarefas

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SPRINT 1 (25/09 a 02/10)                             │
├──────────────────────────┬───────────────────────────┬──────────────────────────┤
│    KAUÊ (Tech Lead)      │   LUCAS (Backend & DB)    │  DORNELLAS (Frontend UI) │
├──────────────────────────┼───────────────────────────┼──────────────────────────┤
│ Branch:                  │ Branch:                   │ Branch:                  │
│ feat/solver-engine-core  │ feat/api-solver-integrate │ feat/ui-timetable-grid   │
└──────────────────────────┴───────────────────────────┴──────────────────────────┘
```

---

### 👤 Kauê Loreno — Tech Lead & Engenheiro de Otimização
* **Pasta de Trabalho:** `backend/solver/`
* **Branch Git:** `feat/solver-engine-core`
* **Tarefas Detalhadas:**
  - [ ] **Tarefa K1 (Estrutura em Memória):** Mapear o estado da grade em memória (`GridState`), criando matrizes de slots por dia da semana para turmas e professores sem overhead de banco de dados.
  - [ ] **Tarefa K2 (Algoritmo Construtivo Guloso):** Implementar a lógica de ordenação por criticidade (alocar primeiro matérias com maior carga horária e professores com menos horários disponíveis).
  - [ ] **Tarefa K3 (Hard Constraints Invioláveis):** Garantir 0 violações:
    - Nenhum professor com duas aulas no mesmo slot.
    - Nenhuma turma com duas aulas no mesmo slot.
    - Respeito estrito aos dias e horários bloqueados declarados pelo docente.
  - [ ] **Tarefa K4 (Retorno Estruturado):** Gerar o dicionário de resultado contendo: status (`SUCCESS` ou `INFEASIBLE`), tempo de execução em milissegundos e a lista de alocações prontas (`class_id`, `subject_id`, `teacher_id`, `day`, `slot`).
  - [ ] **Tarefa K5 (Homologação Semanal):** Conduzir na sexta-feira (02/10) a validação no Docker e carimbar a tag `v0.1-sprint-1`.

---

### 👤 Lucas — Backend & Engenheiro de Dados
* **Pasta de Trabalho:** `backend/core/`
* **Branch Git:** `feat/api-solver-integrate`
* **Tarefas Detalhadas:**
  - [ ] **Tarefa L1 (Conexão do Endpoint do Solver):** Ajustar a view `run_solver` em `backend/core/views.py` para receber os parâmetros (`schedule_name`, `semester`), instanciar o solver do Kauê e retornar o JSON padronizado.
  - [ ] **Tarefa L2 (Persistência da Grade no Banco):** Gravar o resultado retornado pelo solver na tabela `TimetableSlotAssignment` (`alocacao_horario`) via Django ORM dentro de uma transação atômica (`transaction.atomic`).
  - [ ] **Tarefa L3 (Endpoint de Consulta da Grade):** Criar/Ajustar o endpoint `GET /api/schedules/<id>/assignments/` (ou `/api/timetable/`) para retornar a matriz de aulas resolvida, permitindo filtrar por `school_class_id` ou por `teacher_id`.
  - [ ] **Tarefa L4 (Validação Inicial de Carga):** Criar verificação que impede rodar o solver se a turma não tiver nenhuma demanda curricular cadastrada.

---

### 👤 Pedro Dornellas — Frontend Engineer
* **Pasta de Trabalho:** `frontend/src/`
* **Branch Git:** `feat/ui-timetable-grid`
* **Tarefas Detalhadas:**
  - [ ] **Tarefa D1 (Configuração do Serviço de API):** Garantir que `frontend/src/services/api.ts` aponte corretamente para a baseURL `http://127.0.0.1:8000/api/` e exporte as funções de chamada (`runSolver` e `getScheduleAssignments`).
  - [ ] **Tarefa D2 (Botão "Gerar Grade Automática"):** Na tela `TimetablePage.tsx`, adicionar o botão de ação que dispara a geração, exibindo indicador visual de carregamento (*spinner/loading*) enquanto o backend processa.
  - [ ] **Tarefa D3 (Renderização da Matriz da Grade):** Exibir a tabela semanal (Segunda a Sexta, Períodos 1 a 6) preenchendo as células com os dados reais retornados pela API (nome da disciplina, cor e professor).
  - [ ] **Tarefa D4 (Filtro por Turma):** Permitir selecionar entre `3º Ano A` e `3º Ano B` no dropdown para alternar a visualização da grade.

---

## 📋 Definition of Done (Critérios de Aceite da Sprint 1)
A Sprint 1 só será considerada concluída se:
1. O Kauê rodar o solver e ele gerar uma grade viável com **0 choques** de professor ou turma.
2. O Lucas conseguir salvar essa grade no banco de dados SQLite e no PostgreSQL via API.
3. O Dornellas conseguir clicar no botão na tela React e ver a grade semanal preenchida com as matérias coloridas.
4. Todos os 3 Pull Requests forem mesclados na `main` sem quebrar o script `setup_dev.bat`.
5. O ambiente subir 100% liso no Docker via `docker compose up --build`.

---

## 💬 Mensagem Pronta para o WhatsApp da Equipe

*(Basta copiar o texto abaixo e enviar no grupo do WhatsApp)*

```text
Fala galera! 🚀
Organizei o planejamento da nossa SPRINT 1, que começa amanhã (sexta 25/09) e vai até a próxima sexta (02/10).
O foco dessa semana é colocar a grade para ser gerada e exibida na tela de ponta a ponta!

Cada um tem uma fatia clara para ninguém bater cabeça no Git:

👨‍💻 LUCAS (Backend & Dados):
- Conectar a rota /api/run-solver/ para chamar o motor e salvar a grade calculada no banco (TimetableSlotAssignment).
- Criar/ajustar a rota para o frontend consultar a grade pronta por turma.
- Branch: feat/api-solver-integrate

👨‍💻 DORNELLAS (Frontend):
- Conectar o api.ts com o backend Django.
- Na TimetablePage, colocar o botão de "Gerar Grade" com loading e desenhar a grade semanal consumindo os dados da API.
- Branch: feat/ui-timetable-grid

👨‍💻 KAUÊ (Solver & Líder):
- Construir o motor algorítmico (alocação de aulas na memória sem nenhum choque de professor ou turma).
- Fazer a homologação semanal no Docker na sexta-feira.
- Branch: feat/solver-engine-core

Lembrem-se: ninguém mexe direto na main! Criem suas branches a partir da main atualizada.
Qualquer B.O. ou dúvida, mandem mensagem aqui no grupo na hora que a gente resolve. Vamos pra cima! 🔥
```
