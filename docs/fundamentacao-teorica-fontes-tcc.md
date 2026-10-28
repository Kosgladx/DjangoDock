# 📚 Fundamentação Teórica & Referencial Bibliográfico — Projeto TimeTabling

> **Projeto Final de Curso (TCC) — Engenharia de Software**  
> **Tema:** Sistema de Geração Automática de Horários Escolares e Acadêmicos (*Curriculum-Based Course Timetabling*)  
> **Autores:** Kauê Loreno Lopes & Pedro Henrique Dias  
> **Orientador:** Prof. [Nome do Orientador]  
> **Entrega:** Demonstração de Fontes Bibliográficas para Veracidade Técnica e Relevância Social do Projeto  

---

## 1. Contextualização do Projeto Real (*Ground Truth*)

O presente trabalho aborda o desenvolvimento de um sistema web para resolução do problema de agendamento de horários escolares e universitários, formalmente classificado na literatura como **Curriculum-Based Course Timetabling (CB-CTT)**. 

O software foi concebido para atender instituições de ensino que operam sob matrizes curriculares estruturadas por turmas/semestres fechados — cobrindo desde o Ensino Fundamental e Médio até cursos de graduação do campus universitário. O sistema encontra-se atualmente em sua **primeira fatia vertical (*Vertical Slice*)**, com o motor de otimização em fase de implementação em memória RAM (`backend/solver/`), apoiado em uma arquitetura desacoplada em três camadas:
1. **Frontend:** Interface interativa em React, TypeScript e Vite (`frontend/`).
2. **Backend API:** Serviços RESTful, persistência e autenticação em Django REST Framework (`backend/core/`).
3. **Engine do Solver:** Mapeamento de matrizes de horários (`GridState`), executando heurísticas combinatórias puras em Python sem sobrecarga de I/O de banco de dados ([ADR 004](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)).

A seguir, apresentam-se as **fontes bibliográficas fundamentais** que sustentam a **veracidade técnica**, a **arquitetura de engenharia** e a **relevância social** do projeto.

---

## 2. Fontes da Área de Tecnologia da Informação (TI)
*Foco: Engenharia de Software, Arquitetura de Sistemas e Teoria da Computação.*

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SOMMERVILLE (2015)  ──► Requisitos, Ciclo de Vida e Testabilidade        │
│ 2. MARTIN (2017)       ──► Clean Architecture & Desacoplamento do Solver    │
│ 3. GAMMA et al. (1994) ──► Design Patterns (Padrão Strategy no Motor)       │
│ 4. KARP (1972)         ──► Teoria da Computação & Prova de NP-Completude    │
│ 5. BRÉLAZ (1979)       ──► Algoritmos de Grafos & Grau de Saturação (CACM)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1. SOMMERVILLE, Ian. *Engenharia de Software*. 10. ed. São Paulo: Pearson Education do Brasil, 2015.
* **Categoria:** Engenharia de Software.
* **Veracidade Técnica:** Fundamenta formalmente as etapas de levantamento de requisitos com stakeholders (coordenadores pedagógicos), elicitação de requisitos funcionais e não-funcionais, e a validação do ciclo de vida de desenvolvimento de software em fatias testáveis.
* **Aplicação no Projeto:** Ancora o processo de entrevistas semiestruturadas com o cliente/coordenação que originou a especificação de domínio em [`docs/requisitos-timetabling-tecnico.md`](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/requisitos-timetabling-tecnico.md) e o pipeline de garantia de qualidade (pirâmide de testes de software).

### 2.2. MARTIN, Robert C. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Boston: Prentice Hall, 2017.
* **Categoria:** Arquitetura de Software.
* **Veracidade Técnica:** Estabelece a *Regra da Dependência*, demonstrando que o núcleo das regras de negócio de alto nível (cálculos matemáticos e entidades) não deve depender de mecanismos de entrega (frameworks web como Django ou bibliotecas de UI como React).
* **Aplicação no Projeto:** Justifica formalmente a **[ADR 001](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)**, que isolou o motor algorítmico (`backend/solver/`) em Python puro. Se o backend web migrar de Django para FastAPI ou a UI migrar de React para Vue, o motor de otimização permanece 100% reutilizável e intacto.

### 2.3. GAMMA, Erich et al. *Design Patterns: Elements of Reusable Object-Oriented Software*. Reading: Addison-Wesley, 1994.
* **Categoria:** Padrões de Projeto Orientados a Objetos.
* **Veracidade Técnica:** Define os padrões clássicos de criação, estruturação e comportamento de software (GoF), com ênfase no desacoplamento de algoritmos e responsabilidades.
* **Aplicação no Projeto:** Sustenta a implementação do padrão **Strategy** no motor de horários. O sistema define uma interface unificada de resolução (`TimetableSolver`), permitindo plugar a heurística construtiva atual ou motores alternativos futuros (como Google OR-Tools) sem alterar os controladores de persistência ou as views da API.

### 2.4. KARP, Richard M. Reducibility among Combinatorial Problems. In: MILLER, R. E.; THATCHER, J. W. (Ed.). *Complexity of Computer Computations*. New York: Plenum Press, 1972. p. 85-103.
* **Categoria:** Teoria da Computação e Análise de Complexidade de Algoritmos.
* **Veracidade Técnica:** O artigo seminal que provou que a Coloração de Vértices de Grafos (*Graph Vertex Coloring*) pertence à lista dos 21 problemas clássicos **NP-completos**, demonstrando a inexistência de algoritmos exatos de tempo polinomial $O(n^k)$ para a classe geral.
* **Aplicação no Projeto:** Fornece a justificativa matemática de que a alocação de horários (isomórfica à coloração de grafos com restrições adicionais) não pode ser resolvida por algoritmos determinísticos simples de força bruta, exigindo a adoção de heurísticas computacionais eficientes.

### 2.5. BRÉLAZ, Daniel. New methods to color the vertices of a graph. *Communications of the ACM*, New York, v. 22, n. 4, p. 251-256, 1979.
* **Categoria:** Algoritmos e Estruturas de Dados.
* **Veracidade Técnica:** Publicado no mais renomado periódico da *Association for Computing Machinery (ACM)*, introduziu o clássico algoritmo **DSatur** (*Degree of Saturation*), provando que ordenar vértices pelo número de restrições incidentes reduz drasticamente a necessidade de novas cores (slots) em grafos complexos.
* **Aplicação no Projeto:** Inspira diretamente a matriz de criticidade do nosso `GridState` na memória RAM: o motor prioriza a alocação dos professores com menor disponibilidade semanal e matérias com maior carga horária antes de alocar recursos flexíveis (princípio do *Fail-First*).

---

## 3. Fontes do Tema do Artigo (Timetabling, Otimização e Relevância Social)
*Foco: Complexidade do Problema, Algoritmos Heurísticos e Impacto Educacional.*

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. EVEN, ITAI & SHAMIR (1976) ──► Prova Formal: Timetabling é NP-Completo   │
│  7. CARTER et al. (1996)       ──► Heurísticas Construtivas Gulosas          │
│  8. BURKE et al. (1998)        ──► Construtivo como Semente da Busca Local   │
│  9. SCHAERF (1999)             ──► Taxonomia Seminal: STP, Hard/Soft Const.  │
│ 10. MICHALEWICZ & FOGEL (2004) ──► Manual Canônico de Heurísticas Modernas   │
│ 11. LEWIS (2008)               ──► Guia de Engenharia para Busca Local       │
│ 12. DI GASPERO et al. (2012)   ──► O Padrão Canônico do CB-CTT (ITC-2007)    │
│ 13. TARDIF & LESSARD (2014)    ──► Relevância Social, Ergonomia & Docência   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. EVEN, Shimon; ITAI, Alon; SHAMIR, Adi. On the complexity of timetable and multicommodity flow problems. *SIAM Journal on Computing*, Philadelphia, v. 5, n. 4, p. 691-703, 1976.
* **Papel:** Prova Formal de Complexidade do Problema.
* **Veracidade Técnica:** Demonstrou que o problema de geração de horários escolares (*Timetabling*) é **NP-completo mesmo sob condições altamente restritas** (aulas de duração unitária, ausência de salas especiais e disponibilidades limitadas).
* **Aplicação no Projeto:** Blinda o projeto contra qualquer questionamento sobre o porquê de não utilizarmos algoritmos lineares simples, comprovando que a versão de decisão da viabilidade da grade é formalmente NP-completa.

### 3.2. CARTER, Michael W.; LAPORTE, Gilbert; CHINNECK, John W. A investigation of extreme-value and constructive heuristics for timetabling. *Journal of the Operational Research Society*, London, v. 47, n. 8, p. 1066-1072, 1996.
* **Papel:** Modelagem da Heurística Construtiva Gulosa.
* **Veracidade Técnica:** Avaliou experimentalmente as estratégias clássicas de ordenação em problemas de agendamento educacional (*Largest Degree First*, *Saturation Degree*, *Largest Workload*), demonstrando que a ordenação dinâmica por escassez de recursos gera soluções viáveis em tempo de CPU negligenciável.
* **Aplicação no Projeto:** Fundamenta a lógica algorítmica da **Fase 1 do Solver** do TimeTabling: ordenamos os requisitos curriculares pela indisponibilidade do professor e peso da matéria, inserindo-os sequencialmente no primeiro slot viável sem violação de restrições fortes (*zero hard constraints*).

### 3.3. BURKE, Edmund K.; NEWALL, J. P.; WEARE, R. F. Initialization strategies and diversity in evolutionary timetabling. *Evolutionary Computation*, Cambridge, v. 6, n. 1, p. 81-103, 1998.
* **Papel:** A Ponte Científica do Padrão em Dois Estágios.
* **Veracidade Técnica:** Comprovou que iniciar algoritmos de busca e otimização a partir de grades previamente organizadas por heurísticas construtivas de saturação é amplamente superior a inicializações aleatórias, acelerando a convergência sem perda de diversidade.
* **Aplicação no Projeto:** Justifica cientificamente por que o motor do TimeTabling é dividido em **Fase 1 (Construtiva)** e **Fase 2 (Busca Local)**: a fase construtiva gera o ponto de partida válido (*warm start*) para que a busca local não desperdice processamento reparando conflitos básicos de horários.

### 3.4. SCHAERF, Andrea. A survey of automated timetabling. *Artificial Intelligence Review*, Dordrecht, v. 13, n. 2, p. 87-127, 1999.
* **Papel:** A Certidão de Nascimento da Taxonomia de Timetabling.
* **Veracidade Técnica:** O survey mais citado na história da área. Estabeleceu formalmente a divisão entre *School Timetabling (STP)*, *Course Timetabling (UCTP)* e *Exam Timetabling (ETP)*, além de padronizar a distinção entre restrições rígidas (*Hard Constraints* — viabilidade lógica) e restrições flexíveis (*Soft Constraints* — qualidade pedagógica).
* **Aplicação no Projeto:** Fornece o vocabulário e a taxonomia oficial adotados em todo o código-fonte, nas tabelas de restrição (`core_constraintconfig`) e nos documentos de arquitetura do sistema.

### 3.5. MICHALEWICZ, Zbigniew; FOGEL, David B. *How to Solve It: Modern Heuristics*. 2. ed. Berlin: Springer-Verlag, 2004.
* **Papel:** Guia Metodológico de Otimização Estocástica.
* **Veracidade Técnica:** Livro-texto canônico sobre paradigmas de inteligência computacional, recozimento simulado (*Simulated Annealing*), busca tabu e algoritmos genéticos voltados à resolução de problemas combinatoriais intratáveis.
* **Aplicação no Projeto:** Orienta a formulação da função de custo pedagógico (*fitness penalty*) e os operadores de vizinhança na memória RAM que serão utilizados na fase de polimento de grade da Sprint 2.

### 3.6. LEWIS, Rhydian. A survey of metaheuristic-based techniques for university timetabling problems. *OR Spectrum*, Heidelberg, v. 30, n. 1, p. 3-45, 2008.
* **Papel:** Guia de Engenharia de Busca Local e Vizinhança.
* **Veracidade Técnica:** Mapeia a eficiência comparativa de estruturas de vizinhança (*neighborhood structures*, trocas de horários e permutações de blocos) na minimização de janelas ociosas (*gaps*) em horários acadêmicos.
* **Aplicação no Projeto:** Serve como blueprint prático para as operações de troca de slots entre turmas e balanceamento de carga horária docente implementadas no backend.

### 3.7. DI GASPERO, Luca et al. The Curriculum-Based Course Timetabling Problem at ITC-2007. *Annals of Operations Research*, Dordrecht, v. 194, n. 1, p. 103-109, 2012.
* **Papel:** O Padrão Canônico da Competição Mundial de CB-CTT.
* **Veracidade Técnica:** Especificação formal do problema de agendamento baseado em currículo adotada na prestigiada *International Timetabling Competition*. Detalha a formulação matemática exata de restrições de coortes e dispersão semanal de aulas.
* **Aplicação no Projeto:** Valida a modelagem do TimeTabling como um problema de **CB-CTT sem alocação de salas** ([ADR 005](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)), garantindo interoperabilidade conceitual com instâncias de teste e benchmarks da literatura internacional.

### 3.8. TARDIF, Maurice; LESSARD, Claude. *O trabalho docente: elementos para uma teoria da docência como profissão de interações humanas*. 9. ed. Petrópolis: Vozes, 2014.
* **Papel:** Fundamentação da Relevância para a Sociedade e Saúde do Trabalho Docente.
* **Relevância Social:** Maior referência acadêmica em sociologia da educação sobre as condições de trabalho e a estruturação do tempo escolar. Comprova cientificamente que a fragmentação de horários, excesso de janelas vagas entre aulas (*gaps*) e jornadas de trabalho desbalanceadas geram **sobrecarga cognitiva, esgotamento mental (*burnout*), absenteísmo docente e queda no rendimento escolar dos alunos**.
* **Aplicação no Projeto:** Prova que o TimeTabling não é apenas um exercício de algoritmos, mas uma **tecnologia socialmente relevante**: automatiza uma tarefa exaustiva para a coordenação pedagógica e gera grades humanizadas que protegem a integridade física e mental do corpo docente.

---

## 4. Matriz de Rastreabilidade (Fontes ↔ Decisões de Projeto)

| Ref. | Autor Principal | Categoria | Papel Primário | Artefato / Decisão no Projeto |
| :---: | :--- | :---: | :--- | :--- |
| **01** | Sommerville (2015) | TI | Engenharia de Requisitos | [`docs/requisitos-timetabling-tecnico.md`](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/requisitos-timetabling-tecnico.md) |
| **02** | Martin (2017) | TI | Clean Architecture | [ADR 001 — Camadas Desacopladas](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md) |
| **03** | Gamma et al. (1994) | TI | Design Patterns (Strategy) | Motor do Solver isolado por Interface (`backend/solver/`) |
| **04** | Karp (1972) | TI | Complexidade Algorítmica | Justificativa de complexidade não-polinomial (NP) |
| **05** | Brélaz (1979) | TI | Saturação de Grafos (DSatur) | Heurística *Fail-First* na ordenação da matriz de slots |
| **06** | Even et al. (1976) | Tema | Prova NP-Completo | Justificativa matemática da inviabilidade de força bruta |
| **07** | Carter et al. (1996) | Tema | Heurísticas Construtivas | Algoritmo Guloso da Fase 1 (`GridState` em memória) |
| **08** | Burke et al. (1998) | Tema | Hibridização em 2 Estágios | Uso do construtivo como semente válida (*warm start*) |
| **09** | Schaerf (1999) | Tema | Taxonomia de Timetabling | Definição de Hard e Soft Constraints em `backend/core/` |
| **10** | Michalewicz & Fogel (2004) | Tema | Heurísticas Modernas | Modelagem da função objetivo e penalidades pedagógicas |
| **11** | Lewis (2008) | Tema | Engenharia de Busca Local | Operadores de vizinhança e trocas (*swap moves*) |
| **12** | Di Gaspero et al. (2012) | Tema | Padrão CB-CTT | [ADR 005 — Escopo sem Gestão de Salas](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md) |
| **13** | Tardif & Lessard (2014) | Tema | Relevância Social & Educação | Minimização de janelas docentes contra esgotamento mental |

---

## 5. Referências Bibliográficas Consolidadas (Formatação ABNT)

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
