# Log de Decisões Arquiteturais — Sistema de Timetabling

> Registro cronológico de decisões técnicas tomadas pelo time (não requisitos do cliente — esses ficam em `requisitos-timetabling-tecnico.md`). Cada entrada documenta o contexto, a decisão, as alternativas consideradas e o trade-off aceito. Objetivo: qualquer pessoa do time (ou o próprio avaliador do TCC) conseguir entender *por que* o schema/arquitetura chegou no estado atual, sem precisar reconstruir o raciocínio de memória.

---

## Decisão 001 — Denormalização de `professor_id`/`turma_id` para garantir restrições fortes no banco

**Contexto:** o modelo inicial tinha `Alocação` (input do coordenador) e `Horário` (output do solver) como entidades separadas. Para garantir a restrição forte "professor/turma não pode estar em dois lugares no mesmo slot" diretamente no banco (via `UNIQUE constraint`), seria necessário ter `professor_id` e `turma_id` disponíveis na própria tabela `Horário` — mas essa informação só existia indiretamente, via `Horário → Alocação → professor_id/turma_id`.

**Decisão tomada:** denormalizar `professor_id` e `turma_id` diretamente em `Horário`, com um trigger para manter os campos sincronizados com `Alocação` a cada inserção.

**Alternativa considerada:** confiar apenas na aplicação/solver para nunca gerar conflito, sem garantia no banco.

**Trade-off aceito na época:** redundância de dado (dois campos que replicavam informação já existente via `Alocação`) em troca de garantia de integridade no nível do banco.

**Status:** **superada pela Decisão 003** (fusão de Alocação e Horário elimina a necessidade de denormalizar, resolvendo o problema de origem sem a redundância).

---

## Decisão 002 — Reversão parcial da Decisão 001 pelo responsável do schema

**Contexto:** ao revisar o schema, o responsável pelo banco no time considerou a denormalização (Decisão 001) uma redundância desnecessária, dado o alerta do cliente sobre cuidado com normalização.

**Decisão tomada:** remover `turma_id` de `Horário`, mantendo apenas `professor_id` denormalizado.

**Problema identificado nessa reversão:** ficou assimétrico — a restrição forte de professor continuava garantida pelo banco, mas a de turma passou a depender inteiramente da corretude do solver, sem rede de segurança no banco. Essa assimetria não estava documentada com justificativa no momento em que foi identificada.

**Status:** **superada pela Decisão 003.**

---

## Decisão 003 — Fusão de `Alocação` e `Horário` em `Aula`

**Data de referência:** durante a fase de modelagem inicial, após revisão do schema entre os três responsáveis.

**Contexto:** as Decisões 001 e 002 revelaram duas fragilidades estruturais na separação entre `Alocação` (input) e `Horário` (output):
1. Duas fontes de verdade para a mesma contagem — `carga_horaria` (em `Alocação`) podia divergir da contagem real de linhas em `Horário`, exigindo query de verificação de sanidade específica para checar se os números batiam.
2. Dependência de trigger para propagar `professor_id`/`turma_id` — peça adicional de código que pode falhar silenciosamente (ex: desabilitada durante carga em massa de dados).

**Decisão tomada:** fundir as duas entidades numa única tabela `Aula`. Cada linha já nasce representando uma aula da semana desde o cadastro — o coordenador, ao definir N aulas/semana de uma disciplina para uma turma, insere N linhas com `slot_id` nulo. O solver apenas preenche `slot_id` das linhas pendentes.

**Alternativas consideradas:**
- Manter `turma_id` denormalizado em `Horário` (reverter a Decisão 002) — resolveria a assimetria, mas manteria a dependência do trigger e as duas fontes de verdade para carga horária.
- Trigger com subquery validando conflito via `JOIN` com `Alocação`, sem denormalizar nenhuma coluna — resolveria a garantia de integridade sem redundância de coluna, mas manteria a separação conceitual entre input e output, e ainda dependeria de trigger.

**Trade-off aceito:** a entidade `Aula` passa a misturar, na mesma linha, a intenção do coordenador (quem leciona o quê, para quem) com o resultado do solver (quando). Isso é resolvido operacionalmente com `WHERE slot_id IS NULL` para identificar aulas ainda não alocadas. Considerado um custo conceitual pequeno frente ao ganho de robustez (elimina a necessidade de trigger) e desempenho (menos JOIN nas consultas mais comuns).

**Pressuposto assumido, não garantido por constraint:** todas as linhas de uma mesma combinação `turma_id` + `disciplina_id` devem compartilhar o mesmo `professor_id`. É responsabilidade da aplicação garantir isso ao inserir o lote de aulas (o coordenador aloca um professor por vez para uma disciplina/turma, gerando todas as N linhas daquela alocação de uma vez).

**Status:** **superada pela Decisão 006.**

---

## Decisão 004 — Substituição de MILP (PuLP) por Meta-heurísticas e Busca Local no Solver

**Contexto:** O pré-projeto inicial previa a formulação e resolução matemática exata via Programação Linear Inteira Mista (MILP). No entanto, o problema de Timetabling Universitário/Escolar (UCTP) é classicamente categorizado na literatura de Pesquisa Operacional e Ciência da Computação como **NP-difícil**. 

Para compreender o gargalo prático, considere uma formulação MILP sobre os dados de referência do projeto (escola de médio porte com aproximadamente 50 professores, 14 turmas, 15 disciplinas por turma e 25 slots na semana):
- Para cada combinação de professor ($p$), turma ($t$), disciplina ($d$) e slot ($s$), o modelo exige uma variável de decisão binária $x_{p,t,d,s} \in \{0, 1\}$.
- Apenas nessa escala, o solver precisa lidar com:
  $$\approx 50 \times 14 \times 15 \times 25 = 262.500 \text{ variáveis binárias}$$
- O espaço de busca teórico de combinações possíveis atinge a ordem de magnitude de **$2^{262.500}$**, um número astronômico com dezenas de milhares de dígitos (superior ao número total de átomos no universo observável).

Essa complexidade resultou na rejeição do MILP em favor de Meta-heurísticas devido a **3 fatores fundamentais**:

1. **Explosão Combinatória e Gargalo de Memória no Branch-and-Bound:**
   Solvers exatos de MILP buscam a prova matemática de otimalidade absoluta dividindo o problema em uma árvore binária de busca (*Branch-and-Bound*). Com dezenas de restrições conflitantes e janelas vagas a evitar, as regras de corte matemático falham em podar ramos suficientes com rapidez. A árvore de nós a explorar explode na memória RAM, transformando instâncias reais que deveriam rodar em segundos em execuções imprevisíveis que podem levar de 40 minutos a horas inteiras sem fechar o gap de otimalidade.
2. **Incompatibilidade com o Ciclo de Vida HTTP e Arquitetura Web:**
   Servidores web modernos (Gunicorn, Nginx) e navegadores encerram conexões síncronas que excedam limites de tempo (*timeouts* típicos de 30 a 60 segundos com erro `504 Gateway Timeout`). Um algoritmo exato cujo tempo de convergência é imprevisível quebra a arquitetura cliente-servidor síncrona da API REST.
3. **Inviabilidade do Ciclo de Iteração do Coordenador Pedagógico:**
   Na rotina acadêmica real, a montagem da grade é um processo iterativo de experimentação ("o que acontece se eu bloquear a manhã de sexta do Professor Carlos?"). Se cada teste exigir dezenas de minutos para rodar, o coordenador não consegue testar cenários. A meta-heurística permite delimitar um orçamento de tempo (*time budget* de 5 a 10 segundos), gerando uma solução viável e de altíssima qualidade de forma imediata.

### Comparativo Arquitetural: MILP Exato vs. Meta-heurísticas

| Dimensão de Análise | Solver MILP Exato (PuLP / CBC / Gurobi) | Solver Heurístico / Meta-heurística |
| :--- | :--- | :--- |
| **Garantia Teórica** | Prova matemática de otimalidade global absoluta. | Não garante ótimo global provado, mas garante **viabilidade estrita** (zero conflitos) e alta qualidade. |
| **Tempo de Execução** | **Imprevisível:** varia de segundos em instâncias simples a horas/dias em instâncias densas. | **100% Previsível e Delimitado:** controlado por *time budget* (ex: 5s) ou limite de gerações. |
| **Consumo de Memória** | Alto risco de explosão exponencial da árvore de nós (*Branch-and-Bound*). | Estável e constante ao longo de todas as iterações (mantém população/grade corrente). |
| **Comportamento na Web** | Bloqueia conexões HTTP, exigindo fila assíncrona pesada e longa espera. | Permite feedback visual e interativo em poucos segundos na interface. |
| **Flexibilidade de Regras** | Restrições não-lineares precisam ser artificialmente linearizadas com variáveis binárias extras. | Qualquer regra de negócio ou penalidade pode ser programada diretamente em Python na função de custo (*fitness*). |

**Decisão tomada:** Adotar uma abordagem baseada em Heurísticas e Meta-heurísticas (como Algoritmo Construtivo Guloso com Busca Local / Algoritmo Genético) no módulo `backend/solver/`.
- Permite processar grandes volumes de dados mantendo o tempo de execução delimitado por um orçamento de tempo (*time budget*) ou limite de iterações configurável.
- As restrições fortes (sem choque de professor ou turma, respeito estrito à disponibilidade) são garantidas na fase de geração construtiva ou por penalidades assintóticas na função de aptidão (*fitness*).
- As restrições fracas (minimização de janelas vagas do professor e da turma) são ponderadas dinamicamente na função de custo, sem a necessidade de linearização artificial de restrições complexas.

**Alternativas consideradas:**
- Manter MILP com PuLP/CBC: descartado pela perda acentuada de desempenho e escalabilidade em instâncias reais de grande porte, além de menor flexibilidade para incorporar restrições flexíveis não-lineares.
- Satisfatibilidade Booleana / SAT / SMT: descartado pela dificuldade em calibrar e otimizar restrições flexíveis graduais (*soft constraints*), sendo mais rígido para otimização de funções de custo contínuas.

**Trade-off aceito:** Abre-se mão da prova formal de otimalidade matemática absoluta em troca de altíssima escalabilidade computacional para grandes volumes de dados, tempo de resposta previsível para o usuário da aplicação web e facilidade de ajuste empírico dos pesos das restrições de negócio.

**Status:** **decisão vigente.**

---

## Decisão 005 — Exclusão da Entidade Sala do Escopo da Versão Corrente

**Contexto:** O protótipo rascunhado continha a entidade `ClassRoom` (Salas) e campos de chave estrangeira em alocações de aula. No entanto, na entrevista consolidada de requisitos ([requisitos-timetabling-tecnico.md](file:///c:/Users/Kauê/Documents/TimeTabling/docs/requisitos-timetabling-tecnico.md), Seção 4.1 e Seção 6), o cliente/professor confirmou explicitamente que as salas são fixas e conhecidas fora do sistema, excluindo a alocação de salas do escopo obrigatório deste semestre. A presença dessa entidade no código gerava dependência de integridade artificial e complexidade fantasma no solver.

**Decisão tomada:** Remover completamente a entidade `ClassRoom` e suas referências do código ativo (modelos, serializers, views, solver e rotas da API) nesta versão do software, mantendo o DER e o schema alinhados com [schema-postgresql.sql](file:///c:/Users/Kauê/Documents/TimeTabling/docs/schema-postgresql.sql).
- A alocação de salas fica documentada e preservada formalmente apenas como extensão futura planejada para a continuidade do projeto como TCC.

**Alternativas consideradas:**
- Manter `ClassRoom` com chaves estrangeiras opcionais (`null=True, blank=True`): descartado para evitar código zumbi/morto (YAGNI) e evitar questionamentos da banca examinadora sobre regras de sala incompletas.

**Trade-off aceito:** Simplificação radical e coerência do domínio atual (foco estrito no conflito professor/turma/horário), ao custo de precisar recriar a entidade sala no futuro quando a extensão de TCC for iniciada.

**Status:** **decisão vigente.**

---

## Decisão 006 — Segregação entre Demanda Curricular (Input) e Alocação na Grade (Output)

**Contexto:** A Decisão 003 propôs a fusão das entidades de alocação e horário numa única tabela `Aula`, na qual cada aula semanal nascia com `slot_id` nulo e era preenchida pelo solver. Embora conceitualmente compacta, essa abordagem gerou complexidade operacional na API REST e no frontend: misturava a intenção de cadastro do coordenador (que define de forma agregada que uma disciplina tem 4 aulas/semana para uma turma) com as células individuais da grade horária resolvida. A proliferação de linhas com `slot_id = NULL` exigia queries de agrupamento contínuas na aplicação web para exibir o painel de distribuição de carga horária e dificultava o versionamento de grades horárias alternativas.

**Decisão tomada:** Adotar a segregação de responsabilidades entre entrada de dados e saída gerada pelo solver por meio de duas entidades complementares:
1. `CurriculumRequirement` (`demanda_curricular`): Entidade de **input**, onde o coordenador cadastra a carga horária semanal combinando turma, disciplina, professor e permissão de geminação (`double_lessons_allowed`).
2. `TimetableSlotAssignment` (`alocacao_horario`): Entidade de **output**, vinculada a uma versão da grade (`TimetableSchedule`), onde cada registro representa uma célula preenchida da matriz semanal (`turma`, `dia_semana`, `slot`, `disciplina`, `professor`).
- A tabela `alocacao_horario` conta com constraints `UNIQUE (grade_horaria_id, turma_id, slot_id)` e `UNIQUE (grade_horaria_id, professor_id, slot_id)` no banco, garantindo que nem turmas nem professores tenham choques no mesmo slot.

**Alternativas consideradas:**
- Manter tabela única `Aula` com `slot_id = NULL` (Decisão 003): superada devido ao alto custo de refatoração no frontend React, necessidade de queries de agregação artificiais na interface de cadastro e mistura de ciclo de vida entre intenção curricular e grade gerada.

**Trade-off aceito:** Reintroduz-se duas tabelas no domínio em troca de clareza semântica na API REST, alinhamento direto com os wireframes da interface de usuário, suporte nativo a versionamento de grades (`TimetableSchedule` com scores de viabilidade) e manutenção íntegra do frontend já desenvolvido.

**Status:** **decisão vigente (supera a Decisão 003).**

---

## Decisão 007 — Metodologia de Desenvolvimento do Solver: Design Conceitual e Prototipação em Detrimento de TDD Estrito

**Contexto:** O Desenvolvimento Guiado por Testes (TDD — *Test-Driven Development*) é uma prática consagrada na Engenharia de Software para regras de negócio determinísticas e fluxos de aplicação web/CRUD (onde uma dada entrada possui um retorno exato previsível). No entanto, a construção de um motor de resolução algorítmica para o Timetabling (problema de otimização combinatória NP-difícil e estocástico) impõe desafios metodológicos singulares:

1. **Natureza Não-Determinística e Ausência de Gabarito Único:** Em instâncias com dezenas de turmas e professores, não existe uma única grade horária correta, mas sim um vasto espaço de soluções viáveis com distribuições de probabilidade distintas. Formular asserções clássicas de valor fixo (`assert resultado == esperado`) antes da consolidação do modelo de busca é metodologicamente inviável.
2. **Centralidade Crítica da Estrutura de Dados na Memória:** Em meta-heurísticas, mais de 80% da performance e viabilidade dependem da representação matemática dos dados em memória RAM (vetores, conjuntos e matrizes indexadas desacopladas do ORM do Django, permitindo avaliar milhares de trocas por segundo). Tentar impor testes antes de prototipar e validar a eficiência computacional dessa representação engessaria a experimentação algorítmica.
3. **Inadequação do TDD na Fase Exploratória:** Escrever testes unitários rígidos antes de estabilizar a função de custo (*fitness*) e a geração construtiva gera retrabalho constante de reescrita de testes a cada calibração de pesos ou mudança na vizinhança da busca local.

**Decisão tomada:** Adotar a abordagem de **Design Conceitual & Prototipação** para o núcleo do solver (`backend/solver/`), dividida em etapas deliberadas:
- **Etapa A (Design Conceitual):** Definição matemática e arquitetural da estrutura de dados em memória, operadores de vizinhança e função de aptidão (*fitness*).
- **Etapa B (Prototipação Funcional):** Implementação do gerador construtivo e dos passos de busca local até atingir geração de grades viáveis em tempo de execução estável.
- **Etapa C (Blindagem por Testes de Invariantes / Property-Based Testing):** Os testes automatizados entram imediatamente após a estabilização do protótipo, atuando não sobre valores fixos arbitrários, mas verificando propriedades e invariantes inegociáveis do sistema (ex: `assert hard_violations == 0` para qualquer semente, preservação estrita da carga horária semanal e ausência de sobreposição de turmas ou docentes).

**Alternativas consideradas:**
- *TDD Estrito desde a primeira linha:* Descartado pela fricção com a natureza estocástica da heurística e pelo risco de cristalizar prematuramente estruturas de dados ineficientes.
- *Desenvolvimento empírico sem testes posteriores:* Descartado por violar os padrões rigorosos de Engenharia de Software e deixar o sistema suscetível a regressões silenciosas em restrições fortes.

**Trade-off aceito:** Posterga-se a escrita de testes unitários para o momento imediatamente posterior à validação da representação matemática em memória, ganhando agilidade analítica e clareza de modelagem, com garantia de qualidade assegurada por testes de invariantes na sequência.

**Status:** **decisão vigente.**

---

## Como registrar novas decisões



Ao adicionar uma entrada nova, seguir o formato:

```
## Decisão NNN — [título curto da decisão]

**Contexto:** [qual problema motivou a decisão]

**Decisão tomada:** [o que foi decidido]

**Alternativas consideradas:** [o que mais foi cogitado e por que não foi escolhido]

**Trade-off aceito:** [o que se ganha e o que se perde com essa escolha]

**Status:** [vigente / superada pela Decisão NNN]
```

Decisões extensíveis para o TCC (registrar aqui quando forem tomadas, mesmo que ainda não implementadas):
- Alocação de sala (fora do escopo deste semestre, mas prevista para o TCC — considerar impacto na tabela `Aula` ao decidir)
- Outras extensões eventualmente autorizadas pelo cliente (ver seção 7 de `requisitos-timetabling-tecnico.md`)
