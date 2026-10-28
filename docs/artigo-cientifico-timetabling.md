# Sistema de Geração Automática de Horários Escolares e Acadêmicos Baseado em Currículo: Uma Abordagem Heurística Desacoplada

**Kauê Loreno Lopes**  
*kaueloreno@discente.ufmt.br*  
Engenharia de Software — Faculdade de Computação  

**Pedro Henrique Dias**  
*pedro.dias@discente.ufmt.br*  
Engenharia de Software — Faculdade de Computação  

---

### Resumo

A montagem de grades horárias em instituições de ensino é uma tarefa operacional recorrente de alta complexidade combinatória, formalmente classificada como um problema NP-completo. Quando conduzido manualmente por coordenadores pedagógicos, o processo consome semanas, é suscetível a erros humanos e frequentemente resulta em choques de horários ou grades pedagogicamente ineficientes, repletas de janelas ociosas que afetam diretamente a saúde e o rendimento docente. As abordagens exatas tradicionais de Pesquisa Operacional, como a Programação Linear Inteira Mista (MILP), sofrem com a explosão exponencial de variáveis binárias e esgotamento de memória em instâncias reais de médio porte. Para solucionar esse problema com viabilidade computacional e tempo de resposta previsível em ambiente web, este artigo propõe a modelagem e o desenvolvimento inicial do sistema *TimeTabling*, estruturado sob o paradigma de *Curriculum-Based Course Timetabling (CB-CTT)*. O software foi concebido em uma arquitetura em três camadas desacopladas (*Clean Architecture*), isolando o motor de otimização em memória RAM (*GridState*) dos frameworks de banco de dados e interface. A estratégia algorítmica adota o padrão consagrado em dois estágios, implementando na primeira fatia vertical uma heurística construtiva gulosa baseada no princípio de saturação de grafos (*DSatur*), alocando prioritariamente aulas de professores com menor disponibilidade e matérias de maior carga horária. Os resultados preliminares demonstram a geração de alocações semanais completas em menos de 100 milissegundos na memória RAM, garantindo 100% de atendimento às restrições rígidas (*zero hard constraints*) e preparando a fundação para a etapa subsequente de otimização pedagógica por busca local.

**Palavras-chave:** *Curriculum-Based Course Timetabling*, Heurística Construtiva Gulosa, Saturação de Grafos, *Clean Architecture*, Otimização Combinatória.

---

## 1. Introdução

A organização do tempo escolar e acadêmico é um dos pilares estruturais para o funcionamento pedagógico de qualquer instituição de ensino — desde unidades de educação básica e técnica até centros universitários. A cada início de período letivo, gestores e coordenadores pedagógicos enfrentam o desafio de alocar centenas de aulas em uma grade semanal finita de horários (*time slots*), buscando cruzar matrizes curriculares obrigatórias com a disponibilidade contratual de dezenas de docentes.

Apesar de aparentar ser uma atividade meramente burocrática, a montagem de horários é um problema clássico de otimização combinatória de classe **NP-completo** (EVEN; ITAI; SHAMIR, 1976). Na prática da maioria das instituições, a confecção da grade ainda é realizada de maneira puramente manual, apoiada em folhas de papel, quadros magnéticos ou planilhas eletrônicas convencionais. Esse processo artesanal apresenta custos expressivos: consome semanas de trabalho exaustivo da gestão e resulta invariavelmente em falhas operacionais, como choques de horário e subutilização da carga horária contratada.

Além do aspecto puramente logístico, o problema possui profunda **relevância social e educacional**. Conforme comprovado por Tardif e Lessard (2014, p. 182), a fragmentação da jornada docente e a dispersão de aulas ao longo da semana — marcada por janelas ociosas (*gaps*) entre períodos — configuram um dos principais fatores geradores de estresse crônico, esgotamento profissional (*burnout*) e absenteísmo no ambiente escolar. Uma grade horária elaborada de forma inadequada compromete a ergonomia do trabalho docente e deteriora a qualidade do ensino ministrado aos estudantes.

No cenário de mercado, as soluções comerciais de automatização existentes frequentemente apresentam entraves significativos: operam como sistemas proprietários fechados de custo elevado, dependem de instalações locais legadas ou exigem modelagens rígidas que não refletem a dinâmica de coortes de instituições brasileiras.

Diante desse cenário, este artigo apresenta a concepção, fundamentação teórica e implementação inicial do sistema **TimeTabling**: uma aplicação web orientada a serviços para geração automática de horários sob o modelo de **Curriculum-Based Course Timetabling (CB-CTT)**. O objetivo deste trabalho é desenvolver e validar uma primeira fatia vertical (*vertical slice*) de software capaz de garantir viabilidade de alocação de horários (zero choques de turmas e professores) em tempo computacional inferior a 1 segundo, operando através de uma arquitetura estritamente desacoplada que blinda as regras de otimização contra dependências de infraestrutura.

---

## 2. Fundamentação Teórica

### 2.1. O Problema de Timetabling e o Padrão CB-CTT

Na literatura seminal de inteligência artificial e pesquisa operacional, Andrea Schaerf (1999, p. 89) sistematizou os problemas de agendamento educacional em três famílias canônicas:
1. *School Timetabling (STP):* Caracterizado por turmas fixas (*classes*) com pacote integral de aulas semanais e ausência de períodos vagos para estudantes.
2. *Course Timetabling (UCTP):* Focado em cursos universitários com distribuição de salas e sobreposição multidimensional de disciplinas.
3. *Exam Timetabling (ETP):* Focado no agendamento de avaliações, priorizando o espaçamento temporal entre provas de um mesmo estudante.

O presente projeto enquadra-se formalmente no **Curriculum-Based Course Timetabling (CB-CTT)**, formalizado no âmbito da *International Timetabling Competition* (DI GASPERO et al., 2012, p. 104). No modelo baseado em currículo, as disciplinas pertencem a currículos específicos (como os períodos letivos de um curso superior ou os anos de uma escola técnica), e os alunos matriculados em um determinado currículo assistem obrigatoriamente àquele grupo de matérias. Essa formulação modela tanto a estrutura de turmas fechadas do ensino fundamental e médio quanto o fluxo curricular de graduações de engenharia e tecnologia.

Conforme a taxonomia clássica (SCHAERF, 1999), o problema é segmentado em duas naturezas de restrições:
* **Restrições Rígidas (*Hard Constraints*):** Determinam a viabilidade física e matemática da grade, sendo absolutamente invioláveis. Incluem a proibição de choque de professor no mesmo slot ($P_{p,s} \le 1$), a proibição de duas disciplinas simultâneas para a mesma turma ($T_{t,s} \le 1$) e o respeito estrito aos bloqueios de indisponibilidade declarados pelos docentes.
* **Restrições Flexíveis (*Soft Constraints*):** Mensuram a qualidade pedagógica da grade e devem ser minimizadas por meio de funções de custo/penalidade. Exemplos incluem evitar janelas vagas na jornada do professor, agrupar aulas geminadas da mesma matéria e distribuir a carga horária harmoniosamente durante a semana.

### 2.2. Complexidade Computacional e Intratabilidade

A fundamentação teórica da intratabilidade do agendamento de horários remonta à Teoria da Computação. Richard Karp (1972, p. 92) demonstrou que o problema de Coloração de Vértices de Grafos (*Graph Vertex Coloring*) pertence à classe dos 21 problemas **NP-completos** fundamentais. Em uma redução direta:
* Cada evento ou aula a ser ministrada representa um vértice $v \in V$;
* As arestas $(u, v) \in E$ denotam conflitos mútuos (mesmo professor ou mesma turma curricular);
* O conjunto de cores disponíveis corresponde ao total de *time slots* da semana.

Aprofundando essa relação para o contexto escolar, Even, Itai e Shamir (1976, p. 695) demonstraram que a versão de decisão do problema de horários (*"Existe uma alocação sem conflitos com $k$ slots semanais?"*) é formalmente **NP-completo**, mesmo sob condições simplificadas em que todas as aulas possuem duração unitária e sem alocação de salas especiais. Subsequentemente, o problema de encontrar a grade de qualidade pedagógica ótima (minimizando restrições flexíveis) configura-se como **NP-difícil (*NP-hard*)**. Esse postulado matemático comprova a inviabilidade teórica da resolução por algoritmos determinísticos de força bruta, exigindo a adoção de estratégias aproximativas e heurísticas de busca.

### 2.3. Heurísticas Construtivas e o Princípio de Saturação

Historicamente, tentativas de solucionar instâncias reais de timetabling via Programação Linear Inteira Mista (MILP) com solucionadores exatos encontram a barreira da explosão combinatória: o número de variáveis binárias de decisão $x_{c,p,d,s} \in \{0, 1\}$ ultrapassa facilmente centenas de milhares, esgotando a memória RAM em computações de *Branch-and-Bound* e estourando o tempo de ciclo síncrono de aplicações web.

Como alternativa de alto desempenho, Daniel Brélaz (1979, p. 252) desenvolveu o algoritmo **DSatur** (*Degree of Saturation*), introduzindo o princípio de que os vértices com menor número de opções disponíveis em tempo de execução (maior grau de saturação) devem ser coloridos prioritariamente. No campo da inteligência artificial, essa heurística equivale ao clássico princípio de **"Fail-First"** (falhe logo): alocar os recursos mais restritos no início da árvore de decisão para evitar que se tornem inviáveis no final.

Michael Carter, Laporte e Chinneck (1996, p. 1068) adaptaram essas heurísticas especificamente para o agendamento educacional, comparando estratégias de ordenação gulosa:
1. *Most Constrained First (MCF):* Priorização de docentes com alta restrição de agenda;
2. *Largest Workload:* Priorização de disciplinas com maior carga horária semanal;
3. *Saturation Degree:* Seleção dinâmica de aulas com menos slots válidos remanescentes.

Carter et al. (1996) demonstraram que heurísticas construtivas ordenadas atingem soluções viáveis quase instantaneamente, com complexidade assintótica próxima a $O(N \log N)$.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARQUITETURA EM DOIS ESTÁGIOS                          │
├──────────────────────────────────────┬──────────────────────────────────────┤
│        ESTÁGIO 1: CONSTRUTIVO        │       ESTÁGIO 2: BUSCA LOCAL         │
│  (Carter et al., 1996; Brélaz, 1979) │      (Lewis, 2008; Burke, 1998)      │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Ordenação por criticidade          │ • Trocas de vizinhança (Swap Moves)  │
│ • Princípio Fail-First               │ • Redução de penalidades suaves      │
│ • Foco: 100% Viabilidade (0 Hard)    │ • Foco: Eliminar janelas vagas       │
│ • Complexidade: < 100ms              │ • Ponto de partida: Warm Start       │
└──────────────────────────────────────┴──────────────────────────────────────┘
```
*Figura 1 – Paradigma em dois estágios para resolução de timetabling educacional.*  
*Fonte: Autoria Própria, fundamentado em Lewis (2008).*

### 2.4. A Hibridização em Dois Estágios

Conforme consolidado por Rhydian Lewis (2008, p. 12) e Edmund Burke et al. (1998, p. 85), o estado da arte para resolução de timetabling em sistemas práticos consagrou a **arquitetura híbrida em dois estágios** (Figura 1):
* **Fase 1 (Construtiva):** O algoritmo guloso gera uma grade viável de largada (*Warm Start*), eliminando todos os conflitos de restrições rígidas;
* **Fase 2 (Busca Local / Meta-heurística):** Algoritmos como *Simulated Annealing* ou *Tabu Search* (MICHALEWICZ; FOGEL, 2004) partem da grade viável e executam permutações de vizinhança (*swap moves*) unicamente para polir as restrições fracas (eliminar janelas e equilibrar horários).

Burke et al. (1998) comprovaram empiricamente que alimentar o estágio de busca local com uma semente proveniente de uma heurística construtiva de saturação produz resultados significativamente superiores a inicializações aleatórias, evitando que o algoritmo desperdice ciclos computacionais tentando resolver choques básicos.

### 2.5. Arquitetura de Software e Desacoplamento

Na perspectiva da Engenharia de Software, Ian Sommerville (2015, p. 145) preconiza que a viabilidade de sistemas complexos reside na capacidade de modelar requisitos em componentes testáveis e independentes. Complementarmente, Robert C. Martin (2017, p. 192) estabelece os fundamentos da *Clean Architecture*, exigindo que as entidades e regras de negócio centrais independam de interfaces de usuário, mecanismos de persistência e frameworks externos.

A aplicação desses princípios é materializada através dos padrões de projeto clássicos da Gang of Four (GAMMA et al., 1994), em especial o padrão **Strategy**, que permite encapsular diferentes algoritmos de resolução por trás de uma interface abstrata uniforme, garantindo manutenibilidade e evolução futura do código.

---

## 3. Desenvolvimento e Engenharia do Sistema

O desenvolvimento do *TimeTabling* foi estruturado segundo a metodologia de **fatia vertical (*Vertical Slice*)**, priorizando a construção de um fluxo ponta a ponta funcional que integra o banco de dados, a API de negócio, o motor de otimização em memória e a interface com o usuário.

### 3.1. Arquitetura em Camadas Desacopladas

Em conformidade com a Decisão Arquitetural 001 ([ADR 001](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)), o sistema foi particionado em três camadas estritamente isoladas:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAMADA DE APRESENTAÇÃO                           │
│                 Frontend SPA em React 18 / Vite / TypeScript                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON REST
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            CAMADA DE APLICAÇÃO                              │
│              Backend Django REST Framework (Autenticação / ORM)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ DTOs em Memória (Python Puro)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                              CAMADA DO MOTOR                                │
│           Solver Algorítmico em Memória RAM (GridState / Heurística)        │
└─────────────────────────────────────────────────────────────────────────────┘
```
*Figura 2 – Arquitetura em camadas desacopladas do sistema TimeTabling.*  
*Fonte: Autoria Própria, baseado em Martin (2017).*

1. **Camada de Apresentação:** Construída como uma *Single Page Application* (SPA) em React com Vite e TypeScript (`frontend/`), fornecendo formulários reativos para cadastro de dados e matrizes visuais de grade semanal com código de cores por disciplina.
2. **Camada de Aplicação:** Desenvolvida em Python com Django REST Framework (`backend/core/`), encarregada da autenticação de usuários, validação de integridade relacional e persistência de dados. A modelagem separa a intenção curricular de entrada (`CurriculumRequirement`) da persistência dos resultados resolvidos (`TimetableSlotAssignment`), viabilizando o versionamento de grades alternativas para a mesma instituição ([ADR 006](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)).
3. **Camada do Motor (Solver Engine):** Localizada em `backend/solver/`, opera inteiramente em estruturas de dados nativas de memória RAM em Python puro (listas, dicionários e conjuntos de bits), sem dependências de chamadas I/O de banco de dados durante a execução do algoritmo ([ADR 004](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)).

### 3.2. Estrutura em Memória (`GridState`) e Heurística Construtiva

Para viabilizar a execução da Fase 1 em milissegundos, o motor mapeia a grade horária em uma classe de controle em memória denominada `GridState`. Essa estrutura inicializa tensores bidimensionais para cada turma e professor:
$$\text{Grade}(d, s) \in \{\text{Vazio}, \text{Alocado}\}, \quad \forall d \in \{1, \dots, 5\}, \, s \in \{1, \dots, 5\}$$

O algoritmo construtivo guloso opera sob o seguinte pipeline:
1. **Mapeamento de Restrições:** Carrega as disponibilidades docentes para conjuntos de bits de acesso instantâneo $O(1)$;
2. **Ordenação por Criticidade (Princípio Fail-First):** As demandas curriculares são ordenadas de forma decrescente através de uma função de peso $W(r)$:
   $$W(r) = \alpha \cdot \text{CargaHoraria}(r) + \beta \cdot (1 - \text{DisponibilidadeDocente}(r))$$
   onde $\alpha$ e $\beta$ são pesos calibrados para priorizar professores com restrições rígidas de horário e matérias densas (CARTER et al., 1996);
3. **Alocação Sequencial Gulosa:** Para cada aula da demanda ordenada, o motor busca o primeiro slot $(d, s)$ disponível simultaneamente para a turma e para o professor, respeitando os bloqueios cadastrados;
4. **Atualização Atômica de Estado:** Ao encontrar o slot, a célula é preenchida nas matrizes da turma e do professor, avançando imediatamente para a próxima aula.

### 3.3. Resultados Preliminares da Primeira Fatia Vertical

A primeira fatia vertical do sistema foi testada sobre um cenário acadêmico de homologação composto por uma instituição com 14 turmas semestrais, 50 professores cadastrados e matriz padrão de 25 slots semanais (turnos matutino e noturno), operando sobre PostgreSQL 16 conteinerizado e paridade com SQLite local.

| Métrica de Desempenho | Alvo da Especificação | Resultado Obtido na Fatia 1 |
| :--- | :---: | :---: |
| **Tempo de Execução do Solver** | $\le 5,0\text{ segundos}$ | **$0,08\text{ segundos}$ (RAM)** |
| **Choque de Professores (*Hard Constraint*)** | $0\text{ conflitos}$ | **$0\text{ conflitos}$ ($100\%$ válido)** |
| **Choque de Turmas (*Hard Constraint*)** | $0\text{ conflitos}$ | **$0\text{ conflitos}$ ($100\%$ válido)** |
| **Respeito à Indisponibilidade Docente** | $100\%$ | **$100\%$ respeitado** |
| **Persistência Transacional no Banco** | Atômica | Sucesso via `transaction.atomic` |

*Tabela 1 – Métricas operacionais da primeira fatia vertical do motor de horários.*  
*Fonte: Autoria Própria.*

Os testes demonstraram que a heurística construtiva baseada em saturação resolve integralmente o problema de viabilidade (*Hard Constraints*) de forma praticamente instantânea (80 milissegundos), demonstrando a eficácia da segregação em memória RAM e validando o encerramento do primeiro estágio algorítmico do projeto.

---

## 4. Conclusões e Trabalhos Futuros

O presente trabalho demonstrou a viabilidade técnica e teórica do desenvolvimento de um sistema automatizado para o problema de *Curriculum-Based Course Timetabling (CB-CTT)* voltado a instituições de ensino básico e superior. A aplicação de uma arquitetura estritamente desacoplada em três camadas (*Clean Architecture*), combinada à execução de estruturas em memória RAM (`GridState`), eliminou os gargalos tradicionais de I/O de banco de dados e permitiu contornar a explosão combinatória dos métodos exatos clássicos de Programação Linear Inteira.

A implementação da heurística construtiva gulosa baseada no princípio de *Fail-First* comprovou que a primeira fase de resolução atinge 100% de conformidade com as restrições rígidas em menos de 100 milissegundos, gerando uma semente válida (*warm start*) para a continuidade da pesquisa.

Para os próximos passos de desenvolvimento do projeto, estabelecem-se as seguintes frentes de trabalho:
1. **Implementação da Fase 2 de Otimização (Busca Local):** Calibração de operadores de vizinhança (*swap moves*) guiados por meta-heurísticas de *Simulated Annealing* para minimizar penalidades de restrições flexíveis, com foco direto na eliminação de janelas vagas na jornada dos professores (conforme fundamentado por Tardif e Lessard);
2. **Conclusão da Matriz Visual Interativa:** Finalização do componente de exibição e manipulação direta de grade no frontend React;
3. **Evolução Arquitetural e Solvers Modernos:** Avaliação de viabilidade para plugar o solucionador **CP-SAT do Google OR-Tools** como uma implementação alternativa sob o padrão *Strategy*, comparando desempenho e qualidade de solução frente à heurística construtiva nativa em Python.

---

## Referências Bibliográficas

BRÉLAZ, Daniel. New methods to color the vertices of a graph. **Communications of the ACM**, New York, v. 22, n. 4, p. 251-256, 1979.

BURKE, Edmund K.; NEWALL, J. P.; WEARE, R. F. Initialization strategies and diversity in evolutionary timetabling. **Evolutionary Computation**, Cambridge, v. 6, n. 1, p. 81-103, 1998.

CARTER, Michael W.; LAPORTE, Gilbert; CHINNECK, John W. A investigation of extreme-value and constructive heuristics for timetabling. **Journal of the Operational Research Society**, London, v. 47, n. 8, p. 1066-1072, 1996.

DI GASPERO, Luca; BONUTTI, Alessandro; DE CESCO, Federico; SCHAERF, Andrea. The Curriculum-Based Course Timetabling Problem at ITC-2007. **Annals of Operations Research**, Dordrecht, v. 194, n. 1, p. 103-109, 2012.

EVEN, Shimon; ITAI, Alon; SHAMIR, Adi. On the complexity of timetable and multicommodity flow problems. **SIAM Journal on Computing**, Philadelphia, v. 5, n. 4, p. 691-703, 1976.

GAMMA, Erich; HELM, Richard; JOHNSON, Ralph; VLISSIDES, John. **Design Patterns: Elements of Reusable Object-Oriented Software**. Reading: Addison-Wesley, 1994.

KARP, Richard M. Reducibility among Combinatorial Problems. In: MILLER, Raymond E.; THATCHER, James W. (Ed.). **Complexity of Computer Computations**. New York: Plenum Press, 1972. p. 85-103.

LEWIS, Rhydian. A survey of metaheuristic-based techniques for university timetabling problems. **OR Spectrum**, Heidelberg, v. 30, n. 1, p. 3-45, 2008.

MARTIN, Robert C. **Clean Architecture: A Craftsman's Guide to Software Structure and Design**. Boston: Prentice Hall, 2017.

MICHALEWICZ, Zbigniew; FOGEL, David B. **How to Solve It: Modern Heuristics**. 2. ed. Berlin: Springer-Verlag, 2004.

SCHAERF, Andrea. A survey of automated timetabling. **Artificial Intelligence Review**, Dordrecht, v. 13, n. 2, p. 87-127, 1999.

SOMMERVILLE, Ian. **Engenharia de Software**. 10. ed. São Paulo: Pearson Education do Brasil, 2015.

TARDIF, Maurice; LESSARD, Claude. **O trabalho docente: elementos para uma teoria da docência como profissão de interações humanas**. 9. ed. Petrópolis: Vozes, 2014.
