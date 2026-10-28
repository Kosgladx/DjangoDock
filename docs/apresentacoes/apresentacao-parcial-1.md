# Roteiro de Slides — Apresentação Parcial do TCC

> **Projeto:** Sistema de Geração Automática de Horários Escolares e Acadêmicos (TimeTabling)  
> **Formato:** Estrutura limpa de tópicos para importação direta no **Canva (Magic Design / Doc para Apresentação)**, **Gamma** ou **PowerPoint**.  
> **Autores:** Kauê Loreno Lopes & Pedro Henrique Dias  
> **Orientador:** Prof. [Nome do Orientador]  
> **Curso:** Engenharia de Software — Faculdade de Computação  

---

### [Slide 1/10] Capa Institucional

* **Título:** Sistema de Geração Automática de Horários Escolares e Acadêmicos (TimeTabling)
* **Subtítulo:** Uma Abordagem Heurística Desacoplada sob o Paradigma *Curriculum-Based Course Timetabling*
* **Autores:** Kauê Loreno Lopes & Pedro Henrique Dias
* **Orientador:** Prof. [Nome do Orientador]
* **Instituição:** Faculdade de Computação — Curso de Engenharia de Software
* **Tags / Badges:** Pesquisa Operacional | Engenharia de Software | Otimização Combinatória

---

### [Slide 2/10] O Problema: Complexidade e Custo Social

* **Título:** O Desafio do Timetabling Escolar e Universitário
* **O Processo Manual Tradicional:**
  * Coordenadores gastam de 2 a 3 semanas no início de cada semestre montando grades manualmente;
  * Processo propenso a falhas humanas, choques de turmas e subutilização da carga horária.
* **A Barreira Matemática:**
  * Problema formalmente provado como **NP-completo** (EVEN; ITAI; SHAMIR, 1976);
  * Espaço de busca exponencial que supera $2^{262.500}$ combinações em instâncias médias;
  * Força bruta e métodos determinísticos simples são computacionalmente inviáveis.
* **A Relevância Social & Saúde Docente:**
  * Grades fragmentadas geram janelas ociosas (*gaps*) entre períodos letivos;
  * Causa direta de **estresse crônico, esgotamento mental (*burnout*) e absenteísmo docente** (TARDIF; LESSARD, 2014);
  * Compromete a qualidade pedagógica e a retenção de professores.
* **Métrica Alvo:** Redução de semanas de trabalho manual para resolução automatizada em **menos de 5 segundos**.

---

### [Slide 3/10] Objetivos da Pesquisa

* **Título:** Objetivos do Trabalho
* **Objetivo Geral:**
  * Desenvolver e validar uma aplicação web com motor de otimização combinatória para resolução automática do problema de horários baseado em currículo (*CB-CTT*), garantindo zero violações de restrições rígidas em tempo determinístico.
* **Objetivos Específicos:**
  * **Elicitar** restrições operacionais e regras de negócio com a coordenação pedagógica (SOMMERVILLE, 2015);
  * **Modelar** esquema relacional no PostgreSQL com separação entre Demanda Curricular e Alocação Efetiva (ADR 006);
  * **Implementar** motor algorítmico em memória RAM baseado em heurísticas construtivas de saturação (BRÉLAZ, 1979; CARTER et al., 1996);
  * **Isolar** a lógica de negócio sob o padrão *Clean Architecture* e padrão *Strategy* (MARTIN, 2017; GAMMA et al., 1994);
  * **Disponibilizar** a aplicação conteinerizada na nuvem Microsoft Azure para homologação dos usuários.

---

### [Slide 4/10] Metodologia & Pipeline de Engenharia

* **Título:** Metodologia de Desenvolvimento
* **Classificação:** Pesquisa Aplicada com abordagem quantitativa e qualitativa mista.
* **Procedimento:** Pesquisa-Ação orientada a **Fatias Verticais (*Vertical Slices*)**.
* **Pipeline de Execução:**
  * **Fase 1 — Elicitação & Modelagem Formal:**
    * Entrevistas semiestruturadas com a gestão escolar;
    * Definição formal de *Hard Constraints* (viabilidade lógica) e *Soft Constraints* (qualidade pedagógica) (SCHAERF, 1999);
    * Catalogação de decisões arquiteturais via ADRs.
  * **Fase 2 — Engenharia Incremental:**
    * Monorepo desacoplado integrando Banco $\rightarrow$ API REST $\rightarrow$ Engine em RAM $\rightarrow$ Frontend SPA;
    * Pipeline ágil com validação preventiva e paridade de ambientes.
  * **Fase 3 — Validação Experimental & Benchmark:**
    * Testes sobre massa de dados reais com 50 professores e 14 turmas;
    * Mensuração de tempo de CPU, ausência de conflitos e persistência transacional.

---

### [Slide 5/10] Resultados: Arquitetura em 3 Camadas Desacopladas

* **Título:** Resultados (1/3) — Arquitetura de Software (ADR 001)
* **Estrutura de Camadas:**
  * **Camada 1 — Apresentação:** Frontend SPA em React 18, TypeScript e Vite;
  * **Camada 2 — Aplicação:** Backend em Django REST Framework com autenticação, validação e persistência ORM;
  * **Camada 3 — Motor (Solver Engine):** Núcleo algorítmico em memória RAM (`backend/solver/`) operando em Python puro.
* **Vantagens de Engenharia:**
  * **Clean Architecture (MARTIN, 2017):** O algoritmo de otimização independe de frameworks web e bancos de dados;
  * **Padrão Strategy (GAMMA et al., 1994):** Interface padronizada que permite plugar novos motores de cálculo no futuro;
  * **Eliminação de Gargalo de I/O:** Sem queries de banco dentro do loop combinatorial; cálculos executados a centenas de milhares de iterações por segundo na RAM.

---

### [Slide 6/10] Resultados: Modelagem Relacional & Cenário Real

* **Título:** Resultados (2/3) — Modelagem Semântica (ADR 006)
* **Segregação entre Intenção e Alocação:**
  * **Demanda Curricular (`CurriculumRequirement`):** A intenção pedagógica do coordenador (Turma, Disciplina, Professor e Carga Horária Semanal);
  * **Alocação Efetiva (`TimetableSlotAssignment`):** O resultado calculado pelo solver (Dia da Semana, Período Letivo, Professor e Turma).
* **Benefício Direto:** Permite o **versionamento de grades** — a coordenação pode gerar múltiplos cenários alternativos (Versões A, B e C) para a mesma escola sem duplicar dados cadastrais.
* **Cenário Real de Homologação (`seed_data.py`):**
  * 14 Turmas Curriculares ativas;
  * 50 Professores cadastrados;
  * 275 Restrições de disponibilidade e bloqueios docentes cadastrados;
  * Paridade total entre PostgreSQL 16 conteinerizado e SQLite local.

---

### [Slide 7/10] Resultados: Desempenho do Motor em Memória

* **Título:** Resultados (3/3) — Validação da Primeira Fatia Vertical
* **Métricas Obtidas nos Testes Experimentais:**
  * **Tempo de Execução do Solver:** **0.08 segundos** na memória RAM (Meta: $\le 5.0\text{ s}$);
  * **Choque de Professores (*Hard Constraint*):** **Zero (0)** conflitos ($100\%$ válido);
  * **Choque de Turmas (*Hard Constraint*):** **Zero (0)** conflitos ($100\%$ válido);
  * **Respeito à Indisponibilidade Docente:** **100%** de conformidade com os dias e horários bloqueados;
  * **Persistência Transacional:** Gravação atômica íntegra no banco de dados (`transaction.atomic`).
* **Princípio Algorítmico Aplicado:**
  * Estrutura de dados `GridState` operando com tensores matriciais e *bitsets* de acesso instantâneo $O(1)$;
  * Heurística construtiva com ordenação por criticidade baseada no princípio *Fail-First* (BRÉLAZ, 1979; CARTER et al., 1996).

---

### [Slide 8/10] Conclusão Parcial & Próximos Passos

* **Título:** Conclusões Desta Etapa & Roadmap Futuro
* **Conclusões Consolidadas:**
  * Comprovada a viabilidade do modelo CB-CTT sem dependência de solucionadores exatos lentos;
  * A arquitetura desacoplada demonstrou alta performance e modularidade;
  * O sistema opera de forma estável na nuvem com dados homologados.
* **Próximos Passos de Desenvolvimento:**
  * **Fase 2 de Otimização (Busca Local):** Implementação de trocas de vizinhança (*swap moves*) guiadas por *Simulated Annealing* (MICHALEWICZ; FOGEL, 2004) para **eliminar janelas vagas** na jornada dos professores (TARDIF; LESSARD, 2014);
  * **Experiência Visual Interativa:** Conclusão da grade com filtros por professor e exportação para PDF/Excel;
  * **Evolução Arquitetural:** Avaliação do CP-SAT (Google OR-Tools) como motor alternativo sob o padrão Strategy.

---

### [Slide 9/10] Referências Bibliográficas Fundamentais

* **Título:** Referências Bibliográficas
* BRÉLAZ, D. New methods to color the vertices of a graph. **Communications of the ACM**, 1979.
* BURKE, E. K. et al. Initialization strategies and diversity in evolutionary timetabling. **Evolutionary Computation**, 1998.
* CARTER, M. W. et al. Extreme-value and constructive heuristics for timetabling. **JORS**, 1996.
* DI GASPERO, L. et al. The Curriculum-Based Course Timetabling Problem at ITC-2007. **Annals of OR**, 2012.
* EVEN, S.; ITAI, A.; SHAMIR, A. On the complexity of timetable problems. **SIAM J. Comput.**, 1976.
* GAMMA, E. et al. **Design Patterns: Elements of Reusable Object-Oriented Software**. Addison-Wesley, 1994.
* KARP, R. M. Reducibility among Combinatorial Problems. **Plenum Press**, 1972.
* LEWIS, R. A survey of metaheuristic-based techniques for university timetabling. **OR Spectrum**, 2008.
* MARTIN, R. C. **Clean Architecture: A Craftsman's Guide to Software Structure**. Prentice Hall, 2017.
* MICHALEWICZ, Z.; FOGEL, D. B. **How to Solve It: Modern Heuristics**. Springer, 2004.
* SCHAERF, A. A survey of automated timetabling. **Artificial Intelligence Review**, 1999.
* SOMMERVILLE, I. **Engenharia de Software**. 10. ed. Pearson, 2015.
* TARDIF, M.; LESSARD, C. **O trabalho docente: elementos para uma teoria da docência**. Vozes, 2014.

---

### [Slide 10/10] Transição para a Demonstração Prática

* **Título:** Demonstração Prática do Software
* **Ambiente em Produção:** Nuvem Microsoft Azure
* **Stack Homologada:** PostgreSQL 16 + Django REST Framework + Vite / React 18
* **Fluxo da Demonstração ao Vivo:**
  1. Cadastro e visualização de bloqueios de disponibilidade dos docentes;
  2. Consulta de matrizes curriculares ativas por turma;
  3. **Execução síncrona do Solver de Otimização em tempo real**;
  4. Renderização imediata da grade semanal gerada com zero choques de horários.
* **Ação:** *Transição para o ambiente web em produção.*

---

### [Slide Final] Agradecimentos & Considerações da Banca

* **Título:** Agradecimentos
* **Integrantes:** Kauê Loreno Lopes & Pedro Henrique Dias
* **Agradecimentos:** Ao Orientador, à Faculdade de Computação e aos membros da Banca Examinadora.
* **Acesso ao Projeto:** [Link / QR Code para Repositório GitHub]
* **Status:** *Abertura para perguntas e considerações da banca examinadora.*

---

## 🛡️ Slides de Apêndice / Backup (Plano de Contingência)

### [Slide Backup 1] Cadastro de Indisponibilidade Docente
* Interface web do módulo de declaração de bloqueios semanais pelo professor.

### [Slide Backup 2] Matriz Semanal Resolvida pelo Solver
* Visualização da grade semanal completa gerada para a turma com distinção de cores por matéria.

### [Slide Backup 3] Registro de Execução em Terminal (0.08s)
* Log do backend comprovando a resolução e persistência transacional em milissegundos.
