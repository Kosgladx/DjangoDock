# 🎙️ Roteiro da Apresentação Parcial — Projeto Final (TCC)

> **Documento Base:** Alinhado estritamente com o `TCC_Presentation_Blueprint_(2).pptx`  
> **Tema do Projeto:** Sistema de Geração Automática de Horários Escolares (Timetabling)  
> **Apresentadores / Autores:** Kauê Loreno Lopes & Pedro Henrique Dias  
> **Tempo Alvo:** 15 a 18 minutos (com margem de segurança para perguntas)  
> **Formato:** Otimizado para geração direta via IA de Slides (Gamma, Tome, Copilot) e leitura de orador.

---

## 🧭 Visão Geral da Divisão de Apresentação

| Bloco | Tópico do Blueprint | Responsável Principal | Duração Estimada |
| :---: | :--- | :---: | :---: |
| **01** | Capa e Identificação (Slide 1) | Kauê & Pedro | 1 min |
| **02** | O Assunto & Contexto do Problema (Slide 2) | Pedro Henrique | 2 min |
| **03** | Objetivos Geral e Específicos (Slide 3) | Pedro Henrique | 2 min |
| **04** | Metodologia da Pesquisa & Engenharia (Slide 4) | Pedro Henrique | 2.5 min |
| **05.1** | Resultados: Arquitetura & Decisões Técnicas (Slide 5) | Kauê Loreno | 3 min |
| **05.2** | Resultados: Modelagem de Dados & Cenário Real (Slide 6) | Kauê Loreno | 2.5 min |
| **05.3** | Resultados: O Core do Solver & Primeira Fatia (Slide 7) | Kauê Loreno | 3 min |
| **06** | Conclusão, Limitações e Próximos Passos (Slide 8) | Kauê & Pedro | 2 min |
| **Final** | Referências Bibliográficas & Agradecimento (Slide 9) | Kauê & Pedro | 1 min |

---

## 📑 Roteiro Slide a Slide

---

### [Slide 1/9] Capa / Apresentação Institucional

* **Título:** Sistema de Geração Automática de Horários Escolares (Timetabling)
* **Subtítulo:** Uma Abordagem Heurística Aplicada à Otimização de Recursos no Ensino Médio e Técnico
* **Autores:** Kauê Loreno Lopes & Pedro Henrique Dias
* **Orientador(a):** Prof. [Nome do Orientador]
* **Instituição:** [Nome da Faculdade] — Curso de Engenharia de Software
* **Elemento Visual:** Layout clean, identidade visual do projeto (EduSchedule), brasão/logo discreto da faculdade.

> 🗣️ **Notas do Orador (Kauê e Pedro):**  
> *"Bom dia/boa noite a todos os presentes, aos membros da banca examinadora e ao nosso orientador. Eu sou o Kauê Loreno, este é o Pedro Henrique Dias, e hoje vamos apresentar o desenvolvimento parcial do nosso projeto de conclusão de curso: o Sistema de Geração Automática de Horários Escolares fundamentado em Pesquisa Operacional e Engenharia de Software."*

---

### [Slide 2/9] O Assunto: Contexto e Problematização

* **Título:** O Desafio do Timetabling Escolar
* **Tópicos Visuais:**
  * **O Processo Manual:** Coordenadores gastam semanas combinando horários manualmente no início de cada semestre.
  * **A Explosão Combinatória:** Problema clássico de Pesquisa Operacional classificado como **NP-difícil**.
  * **Custo do Erro:** Conflitos de agenda docente, janelas ociosas (*gaps*) e descontentamento pedagógico.
  * **A Pergunta de Pesquisa:** *É possível automatizar a geração de grades escolares viáveis e de alta qualidade em tempo computacional previsível (<10s) para instituições de médio porte?*
* **Elemento Visual Sugerido:** Ícone de quebra-cabeça / funil comparando o processo manual caótico versus o processamento computacional estruturado.

> 🗣️ **Notas do Orador (Pedro Henrique):**  
> *"Para situar a banca: montar a grade de horários é uma das tarefas mais estressantes de uma escola. Parece simples, mas matematicamente é um problema combinatorial de alta complexidade. Um coordenador precisa cruzar dezenas de professores, cada um com dias bloqueados, com matrizes curriculares e turmas. Manualmente, isso leva semanas e frequentemente resulta em choques de horário. Nossa pesquisa nasceu exatamente para responder: conseguimos resolver isso de forma automatizada, rápida e acessível para escolas de médio porte?"*

---

### [Slide 3/9] Objetivos

* **Título:** Objetivos da Pesquisa
* **Tópicos Visuais:**
  * **Objetivo Geral:**
    * **Desenvolver** um sistema web integrado com motor de otimização matemática para geração autônoma de grades de horários sem choques.
  * **Objetivos Específicos:**
    * **Levantar** e formalizar restrições operacionais reais através de entrevistas com a coordenação escolar.
    * **Modelar** o esquema relacional em PostgreSQL garantindo integridade e separação estrita entre demanda e alocação.
    * **Formular** e calibrar o algoritmo de resolução comparando modelos exatos (MILP) e heurísticas construtivas.
    * **Construir** uma aplicação web com API REST (Django) e interface moderna e reativa (React/Vite).
    * **Validar** a eficácia do motor frente a instâncias reais de teste.
* **Elemento Visual Sugerido:** Ícone de alvo com lista numerada de verbos no infinitivo destacados em negrito.

> 🗣️ **Notas do Orador (Pedro Henrique):**  
> *"Nosso objetivo geral é entregar uma solução prática de ponta a ponta: o algoritmo que resolve a matemática e a aplicação web que o coordenador realmente consegue usar. Para isso, os nossos passos específicos envolveram desde a entrevista com coordenadores reais para mapear as regras do jogo, a modelagem formal do banco de dados, a implementação do algoritmo de otimização e a validação quantitativa das soluções geradas."*

---

### [Slide 4/9] Metodologia da Pesquisa

* **Título:** Metodologia & Pipeline de Engenharia
* **Tópicos Visuais:**
  * **Classificação:** Pesquisa Aplicada, com abordagem quantitativa e qualitativa mista.
  * **Procedimento:** Pesquisa-Ação integrada ao desenvolvimento ágil de software (*Vertical Slices*).
  * **Pipeline de Execução (3 Fases):**
    1. *Elicitação & Modelagem:* Entrevistas estruturadas, elaboração de DER e especificação de restrições fortes (*hard*) e fracas (*soft*).
    2. *Desenvolvimento Incremental:* Monorepo conteinerizado, arquitetura de microsserviços conceituais e versionamento via GitHub Flow.
    3. *Validação Experimental:* Benchmark de tempo de execução, ausência de choques e conformidade de grade.
* **Elemento Visual Sugerido:** Diagrama em fluxo de 3 caixas horizontais conectadas por setas (Entrevista/Modelagem $\rightarrow$ Engenharia/Solver $\rightarrow$ Homologação/Benchmark).

> 🗣️ **Notas do Orador (Pedro Henrique):**  
> *"Nossa metodologia une o rigor científico à engenharia de software de ponta. Tratamos o trabalho como uma pesquisa aplicada e pesquisa-ação. Não ficamos apenas na teoria matemática: estruturamos um pipeline completo em fatias verticais testáveis. Levantamos os dados reais de uma escola técnica com cerca de 50 docentes, desenhamos o modelo de dados e adotamos o GitHub Flow com homologação contínua para validar cada módulo desenvolvido."*

---

### [Slide 5/9] Resultados: Arquitetura & Decisão Tecnológica Crítica

* **Título:** Resultados (1/3) — Arquitetura e Decisão de Solver (ADR 004)
* **Tópicos Visuais:**
  * **Pivô Tecnológico Fundamental:**
    * *Modelo Inicial (MILP / Branch-and-Bound):* Espaço de estados ultrapassava $2^{262.500}$ combinações; risco real de estourar a memória RAM e tempo imprevisível de resposta na nuvem.
    * *Solução Adotada (Meta-heurística Construtiva Gulosa + Reparação Local):* Resolução em tempo determinístico (< 5 segundos) com garantia de viabilidade física.
  * **Arquitetura Monorepo Limpo:**
    * *Core Matemático:* Motor em Python puro desacoplado do banco de dados (alta velocidade em memória RAM).
    * *Backend:* Django REST Framework operando com persistência transacional atômica.
    * *Frontend:* React 18, TypeScript e Vite com feedback visual dinâmico.
* **Elemento Visual Sugerido:** Tabela comparativa ou diagrama de arquitetura em 3 blocos (Frontend $\leftrightarrow$ Django REST $\leftrightarrow$ Solver em Memória).

> 🗣️ **Notas do Orador (Kauê Loreno):**  
> *"Entrando agora nos resultados técnicos já consolidados. Um dos nossos maiores marcos de engenharia foi o registro da ADR 004 — a Decisão Arquitetural sobre o motor de otimização. Inicialmente, a literatura sugere Programação Linear Inteira (MILP). Porém, ao realizarmos a modelagem matemática sobre o cenário real, identificamos que a árvore de busca geraria uma explosão de estados que consumiria gigabytes de memória. Tomamos a decisão pragmática de migrar para uma heurística construtiva gulosa baseada em criticidade com reparação local. O resultado? O sistema encontra soluções viáveis em menos de 5 segundos, sem congelar o servidor."*

---

### [Slide 6/9] Resultados: Modelagem Relacional & Cenário Real

* **Título:** Resultados (2/3) — Modelagem de Dados & Carga de Teste
* **Tópicos Visuais:**
  * **Separação Semântica (ADR 006):**
    * *Demanda Curricular:* A intenção pedagógica cadastrada pelo coordenador (ex: Matemática, 4 aulas/semana, Professor Carlos).
    * *Alocação Efetiva:* O slot resolvido (Dia, Horário, Turma, Professor) com constraints de unicidade estritas.
  * **Massa de Teste Real Provisionada (`seed_data.py`):**
    * 1 Turno Matutino com 6 períodos letivos e intervalo pedagógico de 20 min.
    * 12 Disciplinas escolares completas com identificadores e cores visuais.
    * 11 Professores com tetos de carga e **275 restrições de disponibilidade cadastradas**.
    * 2 Turmas do Ensino Médio com demandas curriculares completas.
* **Elemento Visual Sugerido:** Print do terminal executando `python manage.py seed_data` ou miniatura do Diagrama Entidade-Relacionamento (DER).

> 🗣️ **Notas do Orador (Kauê Loreno):**  
> *"Para garantir que nossos testes fossem fidedignos, nós não usamos dados fictícios triviais. Modelamos um banco de dados relacional normalizado no PostgreSQL e criamos um mecanismo de seed idempotente. Nossa base já conta com 11 professores reais, turnos escolares e mais de 270 slots de disponibilidade mapeados — contemplando inclusive restrições complexas, como docentes que não podem lecionar às sextas-feiras ou após o intervalo. Isso nos dá a segurança de que o solver está sendo desafiado com a realidade de uma escola brasileira."*

---

### [Slide 7/9] Resultados: O Core do Solver & Primeira Fatia Vertical

* **Título:** Resultados (3/3) — Desempenho do Motor de Otimização
* **Tópicos Visuais:**
  * **Garantia de Restrições Fortes (*Hard Constraints*):**
    * $\mathbf{0}$ Choques de horário de turmas (uma turma nunca tem duas aulas simultâneas).
    * $\mathbf{0}$ Choques de agenda docente (um professor nunca é alocado em duas turmas no mesmo período).
    * **100% de respeito** aos dias e horários bloqueados declarados pelos docentes.
  * **Heurística de Ordenação por Criticidade:**
    * Aulas de professores com disponibilidade escassa e disciplinas com maior carga horária são alocadas prioritariamente.
  * **Paridade de Ambientes (Docker Compose):**
    * Homologação em PostgreSQL 16 conteinerizado e execução local instantânea em SQLite.
* **Elemento Visual Sugerido:** Gráfico ou scorecard destacando: "Zero Conflitos | Tempo Médio < 3s | 100% Constraints Respeitadas" junto a um print da matriz da grade gerada.

> 🗣️ **Notas do Orador (Kauê Loreno):**  
> *"Aqui apresentamos o núcleo da nossa primeira fatia vertical: o algoritmo executa na memória RAM estruturando matrizes de slots por dia da semana. Ele ordena as disciplinas pelo grau de criticidade — ou seja, professores mais requisitados e matérias com maior carga horária são posicionados primeiro. Nos testes executados, o algoritmo atingiu 100% de sucesso nas restrições rígidas: zero conflitos entre turmas e zero professores duplicados, persistindo o resultado no banco com integridade transacional total."*

---

### [Slide 8/9] Conclusão, Limitações e Próximos Passos

* **Título:** Conclusão Parcial & Próximos Passos
* **Tópicos Visuais:**
  * **Conclusões Desta Etapa:**
    * Viabilidade computacional do modelo comprovada: a abordagem heurística resolve o problema prático de médio porte com agilidade.
    * A base arquitetural (Monorepo, Django, React, Docker) está consolidada e pronta para escala.
  * **Limitações do Escopo Atual (ADR 005):**
    * Gestão de salas físicas mantida fora do escopo inicial (foco restrito em tempo, professor e turma; sala fica como proposta de extensão futura).
  * **Cronograma da Reta Final:**
    * Concluir a integração visual interativa da matriz semanal no frontend React.
    * Implementar métricas de penalidade para restrições fracas (*soft constraints* - ex: evitar janelas vagas na agenda do professor).
    * Rodada final de testes de usabilidade com a coordenação.
* **Elemento Visual Sugerido:** Linha do tempo gráfica com marcos: Concluído (Modelagem, Solver Core, Docker) $\rightarrow$ Em Andamento (Frontend Grid) $\rightarrow$ Próximo (Validação Final da Banca).

> 🗣️ **Notas do Orador (Kauê e Pedro):**  
> *(Pedro)* *"Respondendo à nossa pergunta de pesquisa: sim, é plenamente viável automatizar a geração com tempo de resposta quase instantâneo utilizando heurísticas bem calibradas. A arquitetura construída até aqui já elimina o maior gargalo das escolas."*  
> *(Kauê)* *"Como próximos passos para a entrega final, estamos finalizando a experiência visual no React para que o coordenador possa ver a grade interativa com cores por disciplina e exportar os relatórios. O projeto segue rigorosamente dentro do cronograma previsto."*

---

### [Slide 9/9] Referências Bibliográficas & Agradecimento

* **Título:** Referências & Agradecimento
* **Tópicos Visuais:**
  * **Principais Referências:**
    * LALESCU, L. **FET: Free Timetabling Software**. 2026.
    * HILLIER, F. S.; LIEBERMAN, G. J. **Introduction to Operations Research**. McGraw-Hill.
    * MASSACHUSETTS INSTITUTE OF TECHNOLOGY (MIT). **Integer Programming and Combinatorial Optimization**. MIT OpenCourseWare.
    * GAMMA, E. et al. **Design Patterns: Elements of Reusable Object-Oriented Software**.
  * **Agradecimento:**
    * Agradecemos ao nosso orientador pelo suporte contínuo, à banca avaliadora pela presença e contribuições, e à faculdade pela oportunidade.
  * **Abertura para Perguntas:**
    * *Estamos abertos às perguntas e considerações da banca.*
* **Elemento Visual Sugerido:** QR Code para o repositório GitHub do projeto e contatos (e-mail institucional / LinkedIn).

> 🗣️ **Notas do Orador (Kauê e Pedro):**  
> *"Gostaríamos de agradecer imensamente ao nosso orientador pelas diretrizes, à instituição e aos professores membros da banca pelo tempo e pelas avaliações que certamente enriquecerão o nosso trabalho. Deixamos aqui o acesso ao nosso repositório e estamos à inteira disposição para os questionamentos e considerações da banca. Muito obrigado!"*

---

## 🎯 Dicas de Ouro para o Ensaio da Dupla (Blueprint Compliance)

1. **Numeração nos Slides:** Ao gerar no PowerPoint/Gamma, certifique-se de que o número do slide (ex: `1/9`, `2/9`...) apareça no rodapé. A banca anota o número do slide para fazer as perguntas!
2. **Sem Blocos de Texto:** Mantenha os tópicos do slide concisos. Deixe a explicação técnica densa para a fala de vocês (o roteiro acima já tem tudo detalhado).
3. **Divisão Harmônica:** Pedro assume o contexto acadêmico, o problema e a metodologia (fundamentação da pesquisa). Kauê assume os resultados técnicos, o solver e a arquitetura (engenharia de software). No encerramento, ambos concluem juntos.
4. **Cronômetro Ligado:** Façam pelo menos dois ensaios cronometrando. A meta é cravar entre 14 e 16 minutos, deixando 4 minutos de folga caso o nervosismo acelere ou atrase a fala.
