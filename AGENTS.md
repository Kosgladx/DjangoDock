# Diretrizes para Agentes de IA — EduSchedule (Timetabling)

Este repositório possui regras estritas de arquitetura, governança de Git e qualidade de código que qualquer assistente de IA (Cursor, Copilot, Antigravity, Windsurf, Claude) deve seguir.

---

## 1. Regras de Git e Governança da Equipe
- **A branch `main` é sagrada (Release):** NENHUMA IA deve dar commit ou merge direto na `main`.
- **Branches de Feature:**
  - Kauê (Tech Lead & Solver): `feat/solver-engine-core`
  - Lucas (Backend & API): `feat/api-solver-integrate`
  - Pedro Dornellas (Frontend UI): `feat/ui-timetable-grid`
- **Revisão e Merge:** Todo desenvolvedor abre Pull Request (PR) apontando para a `main` e marcando **Kauê Loreno (Tech Lead)** como Reviewer. O desenvolvedor **NUNCA clica em Merge**.

---

## 2. Comandos Especiais de Setup ("Arrume a casa" / "Faça o setup" / "Inicie")
Quando o desenvolvedor pedir para configurar, iniciar ou preparar o ambiente:
1. **Python Backend:**
   - Garantir `.venv` ativo/criado.
   - Instalar dependências: `.venv\Scripts\pip install -r backend\requirements.txt`.
   - Garantir arquivo `backend\.env` (copiar de `backend\.env.example` se ausente).
   - Rodar migrações: `.venv\Scripts\python backend\manage.py migrate`.
   - Rodar seed: `.venv\Scripts\python backend\manage.py seed_data`.
2. **Node.js Frontend:**
   - Conferir se `npm` existe. Se ausente no Windows, instalar via:
     `winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements`
   - Instalar pacotes com `npm install` na pasta `frontend/`.
3. **Teste de Sanidade:**
   - Executar `backend\manage.py check` (Django sem erros).
   - Executar `npm run build` na pasta `frontend/` (TypeScript compilando sem erros).
4. **Relatório:** Informar que o ambiente está 100% pronto e os atalhos de inicialização (`run_backend.bat` e `run_frontend.bat`).

---

## 3. Protocolo de Conclusão de Tarefa ("Terminei meu trabalho" / "Faça o que tem que fazer")
Quando o desenvolvedor disser que concluiu a tarefa:
1. **Verificação preventiva:** Rodar `backend\manage.py check` (backend) ou `npm run build` (frontend) para garantir que nada está quebrado.
2. **Proteção de Branch:** Conferir se está na branch correta de feature (`feat/...`). Se estiver na `main`, não commitar!
3. **Commit & Push:** Realizar commits semânticos claros e executar `git push origin <sua-branch>`.
4. **Pull Request:** Orientar o desenvolvedor a abrir o PR no GitHub atribuindo **Kauê Loreno (Tech Lead)** como Reviewer.
5. **Bloqueio:** Avisar explicitamente para **não fazer merge**; a homologação será conduzida pelo Tech Lead na sexta-feira.

---

## 4. Padrões de Código
- Código (classes, métodos, variáveis) preferencialmente em **inglês**.
- Testes unitários seguindo padrão **Arrange-Act-Assert (AAA)** com mocks.
