# Requisitos Técnicos do Sistema de Timetabling

> Consolidação da entrevista com o professor, aqui referenciado como cliente. Organizado por tema, não por ordem cronológica das entrevistas. Este documento reflete o que foi pedido/confirmado pelo cliente — decisões técnicas tomadas pelo time (arquitetura, modelagem de schema) ficam registradas em `decisoes-arquiteturais.md`.

---

## 1. Visão geral do problema

O sistema recebe **alocações já definidas** (professor + disciplina + turma, decididas manualmente pelo coordenador) e a **disponibilidade de cada professor**, e precisa determinar **em qual slot de horário cada aula acontece**, sem conflito de horário para nenhum professor.

**O sistema não decide quem dá aula de quê para quem** — isso é decisão humana do coordenador, feita antes. O sistema só decide **quando**.

---

## 2. Papéis e permissões

Três níveis de acesso:

| Papel | Quantidade | Responsabilidades |
|---|---|---|
| **Admin** | Um único no sistema | Cadastra coordenadores e professores |
| **Coordenador** | Pode haver vários | Cadastra slots, turmas, disciplinas, professores; aloca professor → disciplina → turma |
| **Professor** | Vários | Declara disponibilidade (dentro dos slots já criados pelo coordenador); recebe o horário final pronto. Não escolhe disciplina/turma. |

**Autenticação:** precisa de recuperação de senha (esquecimento de senha é um caso de uso citado explicitamente).

---

## 3. Fluxo de trabalho (ordem de operações)

1. Coordenador cadastra os **slots** de horário (dias da semana ativos, horário de início de cada slot, duração — ex: 50 min)
2. Coordenador cadastra **turmas** e **disciplinas**
3. Professor declara sua **disponibilidade** dentro dos slots existentes (quantos "tempos" ele tem disponíveis, em quais dias/horários)
4. Coordenador **aloca** professor → disciplina → turma, definindo quantas aulas/semana — **dentro do limite** de disponibilidade que o professor declarou. O sistema deve bloquear/avisar se o coordenador tentar alocar mais tempos do que o professor tem disponível.
5. Sistema **roda o solver**, determinando em qual slot cada aula vai acontecer, sem conflito

---

## 4. Entidades e regras de negócio (nível conceitual)

### 4.1 Entidades confirmadas pelo cliente
- **Professor** — nome, login, disponibilidade
- **Curso** — nome, nível de ensino
- **Turma** — série, curso, quantidade de alunos, período letivo, turno (manhã/tarde/noite)
- **Disciplina** — nome
- **Slot** — dia da semana, horário de início, duração; não podem se sobrepor
- **Alocação de aula** — professor + disciplina + turma + quando (slot)

**Removidas do escopo:** Sala (fixas, conhecidas fora do sistema) e Qualificação/Habilitação do professor (decisão humana anterior ao sistema).

### 4.2 Relacionamentos confirmados
- **Curso → Turma**: 1:N (um curso tem várias turmas)
- **Turma → Disciplina**: via curso, uma turma tem várias disciplinas
- **Disciplina ↔ Professor**: **N:N** (uma disciplina pode ter vários professores possíveis; um professor pode lecionar várias disciplinas) — confirmado explicitamente pelo cliente, corrigindo suposição inicial de 1:1

### 4.3 Carga horária
A carga horária é determinada na **junção entre Curso/Turma e Disciplina**. `Disciplina` é reaproveitável entre contextos (ex: "Matemática" é a mesma disciplina para todos os anos) — o que muda por contexto é a carga horária.

*(Como essa regra foi implementada no schema físico — incluindo a decisão de fundir Alocação e Horário — está documentado em `decisoes-arquiteturais.md`.)*

### 4.4 Aviso do cliente sobre normalização
Mesmo não sendo técnico, o cliente alertou explicitamente para cuidado com técnicas de normalização, evitando redundância/desperdício de espaço (citou como exemplo o risco de duplicar estrutura ao separar por turno). Isso será avaliado na entrega do modelo.

---

## 5. Restrições (constraints)

### Fortes (hard — nunca podem ser violadas)
1. Professor não pode estar alocado em duas turmas no mesmo slot
2. Alocação só pode acontecer dentro da disponibilidade declarada pelo professor
3. Um slot = um professor = uma turma (sem fusão de turmas, sem múltiplos professores no mesmo slot/turma)

### Fracas (soft — desejável evitar, não bloqueia)
1. Evitar buracos/janelas vagas na grade do professor
2. Evitar buracos/janelas vagas na grade da turma
3. Preferência do professor entre disciplinas que leciona — **opcional ("plus")**, não faz parte do escopo obrigatório (implementá-la muda a natureza do problema: o sistema passaria a decidir também a distribuição de disciplina, não só o horário). Se implementada, o professor apenas **ordena** as disciplinas por prioridade (1ª, 2ª, 3ª opção...) — sem sistema de peso/nota quantificada.

### Critério de validação
Solução válida = nenhuma restrição forte violada. Quanto menos restrição fraca violada, melhor (mas não invalida).

---

## 6. Explicitamente fora do escopo obrigatório

- Alocação automática de **sala**
- Checagem de **qualificação/habilitação** do professor
- **Substituições de última hora** — sistema é estático, roda uma vez, ponto final
- Sistema de **preferência de disciplina** do professor (só "plus")
- **Integração com sistemas externos** — inclusive o sistema legado da instituição (RP) foi explicitamente descartado como referência de dados/integração (só pode ser olhado como inspiração de UX)
- **Junção de turmas** no mesmo horário (comum em engenharia, ex: Cálculo compartilhado entre turmas) — não existe nesse escopo

---

## 7. Liberdade de extensão de escopo

O cliente autorizou extensões (ex: alocação de sala, múltiplos professores por aula) **desde que documentadas na análise de requisitos como decisão própria da equipe**, não como requisito dele. A avaliação será feita de acordo com o que a equipe documentar.

**Nota para o TCC:** sala está fora do escopo deste semestre, mas é extensão esperada e autorizada para a continuidade do projeto como TCC — o schema deve ser pensado para receber essa extensão sem precisar ser reescrito do zero (ver `decisoes-arquiteturais.md` para acompanhamento de como isso está sendo considerado nas decisões de modelagem).

---

## 8. Requisitos não-funcionais

- **Plataforma: web/online**, confirmado explicitamente (motivo: professor precisa acessar de casa para declarar disponibilidade remotamente)
- **Performance:** sem limite rígido de tempo definido, mas força bruta é inviável em escala real (exemplo dado: 50 professores, 11-14 turmas, manhã e noite — força bruta levaria ~2 anos). Precisa de algoritmo real (MILP/heurística).
- **Paralelismo:** não é usado normalmente; pode ser usado se a metodologia suportar, mas não é requisito
- **Execução única/estática:** roda do zero a cada execução, sem estado parcial entre sessões
- **Checagem de viabilidade prévia:** sistema deve detectar e avisar se a instância é inviável (ex: nenhum professor disponível numa sexta-feira, disciplina sem cobertura possível) — não deve falhar silenciosamente. A mensagem de erro deve ser a mais fácil de compreender possível para o coordenador (usuário não-técnico) — preferir algo como "Não foi possível gerar o horário: [disciplina X] não tem professor disponível em [dia Y]" a expor termos internos do algoritmo (infeasible, constraint violation, etc.).
- **Exportação:** tabela/planilha (Excel), organizada por dia+horário+professor, dia+disciplina+turma. **Agrupada por curso/turma com horários compatíveis** (ex: Ensino Médio manhã+tarde num grupo, Ensino Fundamental noutro, Faculdade separada por curso) — não uma tabela única gigante.
- **Front-end/UX:** livre, a critério da equipe, mas pensado de forma integrada com o design do banco de dados
- **Escala de teste:** sem mínimo obrigatório para a fase de modelagem; cliente vai fornecer depois um dataset mais robusto (baseado em escola real: ~50 professores, 11-14 turmas, manhã e noite)
- **Possível otimização de modelagem:** separar o problema por turno (manhã/tarde/noite) como subproblemas independentes, reduzindo a dimensionalidade — sugestão validada pelo cliente, não obrigatória, mas vale considerar na formulação MILP

---

## 9. Referências externas de mercado mencionadas pelo cliente

- **Ferramentas de mercado de referência nacional: Urânia e PowerCubus**
  - Tratar como pesquisa complementar de regras de negócio e de UX, servindo como benchmark para entregar uma interface moderna, amigável e produtiva para a coordenação pedagógica.

---

## Resumo executivo

> Sistema web para geração automática de horário escolar. Recebe alocações de professor+disciplina+turma definidas pelo coordenador e disponibilidade de professores, e determina o slot de cada aula sem conflito. Hierarquia de 3 papéis (Admin, Coordenador, Professor). Sem sala, sem qualificação, sem tempo real, sem integração externa — escopo enxuto e bem definido.
