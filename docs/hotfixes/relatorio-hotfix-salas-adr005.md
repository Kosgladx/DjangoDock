# 🛠️ Relatório de Hotfix — Desacoplamento da Entidade Sala (ADR 005)

> **Status:** Resolvido e Homologado Localmente  
> **Severidade:** Alta (Bloqueio total de carregamento da interface web)  
> **Data:** 29/09/2026  
> **Responsável pelo Diagnóstico e Solução:** Kauê Loreno (Tech Lead & Engenheiro de Otimização)  
> **Branch:** `feat/solver-engine-core`  

---

## 1. Sumário Executivo
Durante a inicialização integrada dos serviços (Django REST API na porta `8000` e React SPA via Vite na porta `3000`), a interface do usuário permanecia estagnada na tela de carregamento (*loading* contínuo), impossibilitando a visualização e manipulação da grade horária escolar populada no banco de dados.

O diagnóstico técnico identificou uma divergência entre a especificação vigente do domínio (**ADR 005 — Exclusão da Entidade Sala do Escopo da Versão Corrente**) e uma chamada legada remanescente no ciclo de montagem assíncrono do frontend.

---

## 2. Diagnóstico Técnico & Causa Raiz (Root Cause Analysis - RCA)

### 2.1 Alinhamento do Backend com a ADR 005
Conforme documentado na **Decisão Arquitetural 005** (`docs/decisoes-arquiteturais.md`), a alocação de salas físicas foi explicitamente excluída do escopo do semestre a pedido do cliente/professor. O backend Django seguiu essa diretriz à risca, expurgando modelos, serializers e a rota `api/rooms/` de `backend/core/urls.py`.

### 2.2 Dependência Legada e Falha no Frontend
O método de inicialização `loadAllData()` no arquivo `frontend/src/App.tsx` realizava a busca inicial de entidades agregadas através de um `Promise.all`:

```typescript
const [classesRes, teachersRes, roomsRes, slotsRes, shiftsRes] = await Promise.all([
  api.getClasses(),
  api.getTeachers(),
  api.getRooms(), // <-- Disparava GET /api/rooms/
  api.getSlots(),
  api.getShifts(),
]);
```

### 2.3 Mecanismo de Falha em Cadeia (Fail-Fast)
1. O método `api.getRooms()` efetuava requisição para `/api/rooms/`, que o proxy reverso do Vite repassava ao Django.
2. O Django REST Framework, em conformidade com o escopo atual, respondeu com status **HTTP 404 (Not Found)**.
3. Conforme a especificação do ECMAScript, o método `Promise.all` opera sob a semântica *fail-fast*: a rejeição de uma única promessa aborta imediatamente toda a cadeia de execução.
4. Consequentemente, as respostas válidas com status 200 contendo Turmas, Professores, Slots e Turnos foram sumariamente descartadas no bloco `catch`, resultando na tela vazia.

---

## 3. Ações Corretivas Executadas (Hotfix)

1. **Desacoplamento do Ciclo de Carregamento (`frontend/src/App.tsx`):**
   - Removida a requisição `api.getRooms()` do array de promessas de `Promise.all`.
   - Removida a atribuição de estado `setRooms(roomsRes)`.
   - Mantido o estado inicial neutro `const [rooms] = useState<ClassRoom[]>([]);` para preservar a integridade das tipagens do TypeScript no componente dependente `TimetablePage`.

2. **Validação de Compilação Estática:**
   - Executado teste de sanidade completo via TypeScript Compiler e Vite:
     ```bash
     npm --prefix frontend run build
     # Resultado: 0 erros de tipagem, bundle gerado com sucesso.
     ```

3. **Validação Funcional Ponta a Ponta:**
   - Interface acessada em `http://localhost:3000/`.
   - Grid semanal de horários carregando com sucesso 11 professores, 12 disciplinas e dados do `seed_data`.

---

## 4. Recomendações e Débito Técnico Mapeado
* **Atribuição para a fatia de Frontend (`feat/ui-timetable-grid` - Pedro Dornellas):**
  - Remover a prop `rooms` da interface `TimetablePageProps` e do componente `ManualLessonModal`.
  - Remover da UI o botão de alternância de visualização por "Sala" (`viewMode === 'sala'`), concluindo a limpeza de código morto (YAGNI).
