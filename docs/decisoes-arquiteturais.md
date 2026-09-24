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
