# Roteiro de 15 Slides — Alinhado 1:1 ao Modelo do Professor (PDF)

> **Instrução de Uso no ChatGPT / Claude:**  
> 1. Abra o ChatGPT (GPT-4o) ou Claude.  
> 2. **Anexe o PDF de exemplo do professor** (`exemplo_apresentacao_professor.pdf`).  
> 3. Cole o **Prompt Mestre** abaixo junto com este documento.  
> 4. A IA vai analisar a estrutura visual exata das páginas do professor e aplicar ao conteúdo do TimeTabling!  

---

## 🤖 Prompt Mestre para Colar no ChatGPT / Claude

```text
Você é um designer sênior de apresentações acadêmicas e engenheiro de software.
Em anexo está o PDF com o modelo de slides fornecido pelo professor da disciplina.

Analise cuidadosamente o padrão visual do documento de referência:
1. Esquema de Cores: Fundo branco/off-white limpo, faixa superior com detalhe em vermelho, caixas de destaque em azul escuro e vermelho, tabelas organizadas e rodapé padronizado.
2. Elementos Estruturais:
   - Slide 2 com a Agenda em formato de roda/ciclo de 4 quadrantes;
   - Slides com caixas de métricas e números em fontes grandes;
   - Fórmulas matemáticas e diagramas lado a lado com caixas explicativas;
   - Destaques em negrito e vermelho nas frases centrais;
   - Slide 12 com tabela de simulação/métricas e conclusões ao lado;
   - Slide 13 com conclusões em layout circular com 4 blocos e ícone central;
   - Slide 14 com referências bibliográficas organizadas em duas colunas;
   - Slide 15 de encerramento no mesmo estilo da capa.

Abaixo está o conteúdo exato do meu projeto de TCC (TimeTabling), dividido em 15 slides mapeados 1 a 1 com o modelo do professor. 

Por favor, gere os slides mantendo essa EXATA hierarquia visual, distribuição de blocos, diagramas e paleta de cores. Se for gerar código Python (.pptx), use a biblioteca python-pptx para gerar o arquivo para download.
```

---

## 📑 Conteúdo dos 15 Slides Mapeados 1:1

---

### [Slide 1/15] Capa Institucional (Idêntico ao Slide 1 do Modelo)
* **Imagem de Fundo:** Imagem abstrata com nós de rede / grafos conectados (remetendo à teoria dos grafos e otimização).
* **Faixa Central em Vermelho:**
  * **Texto em Branco e Negrito:**  
    **Sistema de Geração Automática de Horários Escolares e Acadêmicos (TimeTabling)**
  * **Subtítulo:** Uma Abordagem Heurística Desacoplada sob o Modelo *Curriculum-Based Course Timetabling*
* **Identificação:**
  * Kauê Loreno Lopes & Pedro Henrique Dias
  * *kaueloreno@discente.ufmt.br* | *pedro.dias@discente.ufmt.br*
  * Curso de Engenharia de Software — Faculdade de Computação
* **Logotipo:** Brasão da Faculdade no canto inferior direito.

---

### [Slide 2/15] Agenda da Apresentação (Idêntico ao Slide 2 do Modelo)
* **Título:** Agenda da Apresentação
* **Subtítulo:** Sistema de Geração Automática de Horários Escolares e Acadêmicos
* **Diagrama Central:** Roda circular em 4 quadrantes com ícones e cores alternadas (vermelho, azul, cinza escuro, azul marinho):
  * **Quadrante 1 (Vermelho com ícone de orador) — INTRODUÇÃO:**
    * Problemática & Relevância Social
    * Objetivo Geral e Específicos
  * **Quadrante 2 (Cinza/Azul com ícone de engrenagem) — FUNDAMENTAÇÃO TEÓRICA:**
    * O Modelo CB-CTT & Complexidade NP-Completo
    * Heurísticas Construtivas de Saturação (DSatur)
    * Princípios de Clean Architecture & Strategy
  * **Quadrante 3 (Vermelho com ícone de gráfico) — DESENVOLVIMENTO:**
    * Arquitetura em 3 Camadas Desacopladas (ADR 001)
    * Modelagem Semântica de Dados (ADR 006)
    * O Motor de Otimização em Memória RAM (`GridState`)
  * **Quadrante 4 (Azul escuro com ícone de certificado) — CONCLUSÃO & DEMONSTRAÇÃO:**
    * Análise de Resultados da 1ª Fatia Vertical
    * Considerações Finais & Trabalhos Futuros
    * Demonstração Prática do Software na Nuvem (Azure)

---

### [Slide 3/15] INTRODUÇÃO — O Cenário de Timetabling & Custo de Gestão (Idêntico ao Slide 3)
* **Título:** INTRODUÇÃO
* **Subtítulo Superior:** A Complexidade Operacional na Gestão de Ensino
* **Lado Esquerdo (Diagrama de Hexágonos / Fatores Críticos):**
  * Hexágono Central: **Processo Manual de Horários**
  * Hexágonos Conectados:
    * *Demora:* 2 a 3 semanas de trabalho por semestre;
    * *Erros:* Choques de horário não detectados;
    * *Rigidez:* Dificuldade em absorver trocas docentes;
    * *Ineficiência:* Subutilização da carga horária;
    * *Fadiga:* Desgaste da coordenação pedagógica.
* **Lado Direito (Box Azul com Tópicos em Branco):**
  * **O Paradigma CB-CTT (Curriculum-Based):**
    * Aplicável a turmas fechadas (Ensino Básico/Médio) e matrizes curriculares universitárias;
    * Alocação por coortes semestrais compartilhadas;
    * Cruzamento de dezenas de professores com restrições contratuais de disponibilidade.

---

### [Slide 4/15] INTRODUÇÃO — A Barreira Matemática & Relevância Social (Idêntico ao Slide 4)
* **Título:** INTRODUÇÃO
* **Subtítulo Superior:** Explosão Combinatória e Impacto na Saúde Docente
* **Lado Esquerdo (Tabela Comparativa de Complexidade):**

| Método de Resolução | Espaço de Estados | Tempo de Resposta | Viabilidade em Produção |
| :--- | :---: | :---: | :---: |
| **Força Bruta Determinística** | $O(S^A)$ exponencial | Meses de cálculo | **Totalmente Inviável** |
| **Programação Linear (MILP)** | $> 262.500$ variáveis binárias | Horas (estouro de RAM) | Inviável em API Web |
| **Heurística Construtiva em RAM** | $O(N \log N)$ em memória | **$< 0.1\text{ segundos}$** | **Alta Viabilidade (Produção)** |

* **Lado Direito (Box de Relevância Social — Tardif & Lessard, 2014):**
  * **Impacto Humano da Grade Fragmentada:**
    1. Janelas ociosas (*gaps*) entre períodos letivos $\rightarrow$ **Sobrecarga de permanência escolar**;
    2. Dispersão de aulas em múltiplos dias $\rightarrow$ **Dificuldade de planejamento pedagógico**;
    3. Consequência comprovada $\rightarrow$ **Estresse crônico, absenteísmo e esgotamento (*burnout*)**;
  * *Fonte: TARDIF, M.; LESSARD, C. O trabalho docente: elementos para uma teoria da docência, 2014.*

---

### [Slide 5/15] Problemática & Objetivo (Idêntico ao Slide 5)
* **Título Central:** Problemática
* **Texto da Problemática (Caixa Superior):**
  * *"Eliminar a lentidão operacional, a incidência de choques de horário e o esgotamento docente decorrentes da montagem manual de grades curriculares em instituições de ensino."*
* **Título Central Inferior:** Objetivo
* **Texto do Objetivo (Caixa Inferior com Destaques):**
  * *"Desenvolver uma aplicação web fundamentada em **Clean Architecture** com motor de otimização em **memória RAM**, capaz de gerar grades viáveis (**zero choques de horários**) em tempo inferior a 1 segundo, operando sob o modelo de **Curriculum-Based Course Timetabling**."*
* **Elemento Gráfico:** Ilustração lateral com engrenagens conectadas a ícones de alvo e calendário escolar.

---

### [Slide 6/15] Fundamentação Teórica — COMPLEXIDADE COMPUTACIONAL (Idêntico ao Slide 6)
* **Título:** Fundamentação Teórica
* **Subtítulo:** COMPLEXIDADE COMPUTACIONAL E COLORAÇÃO DE GRAFOS
* **Cards Superiores com Números em Destaque:**
  * **Box Azul:** `NP-Completo` $\rightarrow$ Versão de Decisão da Grade (EVEN; ITAI; SHAMIR, 1976)
  * **Box Vermelho:** `NP-Hard` $\rightarrow$ Otimização de Qualidade Pedagógica (SCHAERF, 1999)
* **Texto Central com Destaques em Vermelho:**
  * A alocação de horários é redutível ao clássico **Problema de Coloração de Vértices de Grafos** (KARP, 1972):
    * Cada aula curricular representa um **vértice** do grafo;
    * Arestas representam **conflitos de recursos** (mesmo docente ou mesma turma);
    * As cores disponíveis representam os **slots de horários semanais**.
* **Lado Direito (Diagrama Ilustrativo):**
  * Grafo com 4 vértices coloridos demonstrando conflito imediato entre professor e turma no mesmo período.

---

### [Slide 7/15] Fundamentação Teórica — HEURÍSTICA CONSTRUTIVA & PRINCÍPIO FAIL-FIRST (Idêntico ao Slide 7)
* **Título:** Fundamentação Teórica
* **Subtítulo:** HEURÍSTICA CONSTRUTIVA E ORDENAÇÃO POR SATURAÇÃO
* **Box Vermelho (Citação Canônica):**
  * *"O algoritmo DSatur (Degree of Saturation) prioriza vértices com menor número de opções disponíveis em tempo de execução, minimizando a necessidade de novos slots." (BRÉLAZ, 1979, p. 252)*
* **Lado Esquerdo (Conceito Teórico):**
  * Em timetabling, aplicar o princípio **Fail-First** significa alocar primeiro as aulas mais difíceis:
    * Professores com poucos horários livres na semana;
    * Disciplinas com maior carga horária semanal (CARTER et al., 1996).
* **Lado Direito (Fórmula e Diagrama de Criticidade):**
  * **Função de Peso da Demanda:**
    $$W(r) = \alpha \cdot \text{CargaHoraria}(r) + \beta \cdot (1 - \text{DisponibilidadeDocente}(r))$$
  * Diagrama de alocação de "Pedras Grandes Primeiro" em slots da semana.

---

### [Slide 8/15] Fundamentação Teórica — ARQUITETURA EM DOIS ESTÁGIOS & CLEAN ARCHITECTURE (Idêntico ao Slide 8)
* **Título:** Fundamentação Teórica
* **Subtítulo:** O PADRÃO DE DOIS ESTÁGIOS E DESACOPLAMENTO DE SOFTWARE
* **Lado Esquerdo (O Paradigma em 2 Estágios — LEWIS, 2008; BURKE et al., 1998):**
  * **Estágio 1 (Construtivo / Warm Start):** Heurística gulosa satura as restrições rígidas e entrega uma grade viável com **0 choques em milissegundos**.
  * **Estágio 2 (Busca Local / Refinamento):** Algoritmos de vizinhança (*Simulated Annealing*) realizam trocas (*swap moves*) unicamente para **eliminar janelas vagas e polir a grade**.
* **Lado Direito (Clean Architecture & Strategy — MARTIN, 2017; GAMMA et al., 1994):**
  * O motor de cálculo (`backend/solver/`) não conhece o banco de dados nem o framework HTTP.
  * O padrão **Strategy** permite trocar o algoritmo no futuro (ex: plugar Google OR-Tools) sem alterar o frontend ou a API.

---

### [Slide 9/15] Desenvolvimento — ARQUITETURA EM 3 CAMADAS (Idêntico ao Slide 9)
* **Título:** Desenvolvimento
* **Subtítulo:** ARQUITETURA DE SOFTWARE E SEGREGAÇÃO DE RESPONSABILIDADES (ADR 001)
* **Diagrama Central de Arquitetura (3 Caixas Conectadas):**
  * **Bloco 1 (Azul Claro) — Camada de Apresentação:** Frontend SPA em React 18, TypeScript, Vite e Tailwind CSS. Interface reativa com feedback de grade em tempo real.
  * **Bloco 2 (Azul Escuro) — Camada de Aplicação:** API RESTful em Django REST Framework. Autenticação JWT, validação relacional e persistência atômica.
  * **Bloco 3 (Vermelho) — Camada do Motor (Solver Engine):** Módulo de cálculo isolado em Python puro, operando inteiramente na memória RAM (`GridState`).
* **Destaque Técnico em Vermelho:**
  * *"A ausência de queries SQL dentro do loop do solver reduz o tempo de I/O a zero, viabilizando execução instantânea."*

---

### [Slide 10/15] Desenvolvimento — MODELAGEM DE DADOS & COORTES (Idêntico ao Slide 10)
* **Título:** Desenvolvimento
* **Subtítulo:** SEPARAÇÃO ENTRE DEMANDA CURRICULAR E ALOCAÇÃO (ADR 006)
* **Lado Esquerdo (Diagrama de Entidades):**
  * `CurriculumRequirement` (Entrada/Intenção) $\rightarrow$ Turma, Disciplina, Professor e Carga.
  * `TimetableSlotAssignment` (Saída/Alocação) $\rightarrow$ Slot resolvido com dia, horário e chaves de integridade.
* **Lado Direito (Vantagens e Massa de Testes):**
  * **Versionamento de Grades:** Permite gerar cenários alternativos (Grade A vs. Grade B) sem duplicar cadastros;
  * **Massa de Dados Reais Homologada (`seed_data.py`):**
    * 14 Turmas Curriculares ativas;
    * 50 Professores cadastrados;
    * 275 Restrições de disponibilidade docente mapeadas;
    * Paridade estrita entre PostgreSQL 16 conteinerizado e SQLite local.

---

### [Slide 11/15] Desenvolvimento — O MOTOR EM MEMÓRIA (`GridState`) (Idêntico ao Slide 11)
* **Título:** Desenvolvimento
* **Subtítulo:** ESTRUTURA EM MEMÓRIA RAM E OPERAÇÕES EM TEMPO CONSTANTE $O(1)$
* **Lado Esquerdo (Estrutura do Tensor `GridState`):**
  * Tensores matriciais por dia e período letivo:
    $$\text{MatrizTurma}[dia, slot] \quad \text{e} \quad \text{MatrizDocente}[dia, slot]$$
  * Conjuntos de bits (*bitsets*) para consulta instantânea de colisões em tempo $O(1)$.
* **Lado Direito (Fluxo de Execução da Heurística):**
  1. Carrega disponibilidades para conjuntos na RAM;
  2. Ordena demandas curriculares por criticidade decrescente $W(r)$;
  3. Insere sequencialmente cada aula no primeiro slot livre conjunto;
  4. Atualização atômica de estado sem chamadas a disco.

---

### [Slide 12/15] ANÁLISE DE RESULTADOS (Idêntico ao Slide 12)
* **Título:** ANÁLISE DE RESULTADOS
* **Subtítulo:** BENCHMARK OPERACIONAL DA PRIMEIRA FATIA VERTICAL
* **Lado Esquerdo (Tabela 1 de Métricas Experimentais):**

| Métrica Avaliada | Alvo Estabelecido | Resultado Obtido na Fatia 1 | Status |
| :--- | :---: | :---: | :---: |
| **Tempo de Execução do Solver** | $\le 5,0\text{ s}$ | **$0,08\text{ segundos}$ na RAM** | **Superado** |
| **Choque de Professores (*Hard*)** | $0$ conflitos | **$0$ choques ($100\%$ viável)** | **Atendido** |
| **Choque de Turmas (*Hard*)** | $0$ conflitos | **$0$ choques ($100\%$ viável)** | **Atendido** |
| **Respeito à Indisponibilidade** | $100\%$ | **$100\%$ de conformidade** | **Atendido** |
| **Persistência no PostgreSQL** | Atômica | Sucesso via `transaction.atomic` | **Atendido** |

* **Lado Direito (Conclusões em Destaque):**
  * O motor atingiu **viabilidade total de restrições rígidas** em menos de **100 milissegundos**;
  * A execução em memória RAM demonstrou ser **60 vezes mais rápida** do que o teto da especificação;
  * O ponto de partida (*Warm Start*) está 100% validado para o acoplamento da Fase 2 de busca local.

---

### [Slide 13/15] CONCLUSÃO E CONSIDERAÇÕES FINAIS (Idêntico ao Slide 13)
* **Título:** CONCLUSÃO E CONSIDERAÇÕES FINAIS
* **Diagrama Central:** Roda em 4 quadrantes com ícone central de binóculo / radar:
  * **Quadrante 1 (Vermelho):** *Viabilidade Prática Comprovada:* O modelo CB-CTT com heurística construtiva resolve a primeira fatia vertical em $0.08\text{s}$, eliminando a dependência de solucionadores exatos lentos.
  * **Quadrante 2 (Cinza Escuro):** *Arquitetura Desacoplada e Escalável:* A separação entre Frontend, API e Solver garante manutenibilidade e independência de banco de dados.
  * **Quadrante 3 (Azul Marinho):** *Fase 2 de Otimização Pedagógica:* Próxima etapa focada na busca local para **eliminação de janelas vagas na jornada dos professores**, combatendo o estresse docente (Tardif & Lessard).
  * **Quadrante 4 (Vermelho):** *Evolução Futura com Google OR-Tools:* Avaliação do solver CP-SAT como módulo plugável alternativo via padrão Strategy, utilizando a heurística atual como *Warm Start*.

---

### [Slide 14/15] REFERÊNCIA BIBLIOGRAFIA (Idêntico ao Slide 14 — 2 Colunas)
* **Título:** REFERÊNCIA BIBLIOGRAFIA
* **Coluna 1 (Lado Esquerdo):**
  * BRÉLAZ, Daniel. New methods to color the vertices of a graph. **Communications of the ACM**, v. 22, n. 4, 1979.
  * BURKE, Edmund K. et al. Initialization strategies and diversity in evolutionary timetabling. **Evolutionary Computation**, v. 6, 1998.
  * CARTER, Michael W. et al. A investigation of constructive heuristics for timetabling. **JORS**, v. 47, n. 8, 1996.
  * DI GASPERO, Luca et al. The Curriculum-Based Course Timetabling Problem at ITC-2007. **Annals of OR**, v. 194, 2012.
  * EVEN, Shimon; ITAI, Alon; SHAMIR, Adi. On the complexity of timetable problems. **SIAM J. Comput.**, v. 5, n. 4, 1976.
  * GAMMA, Erich et al. **Design Patterns: Elements of Reusable Object-Oriented Software**. Addison-Wesley, 1994.
  * KARP, Richard M. Reducibility among Combinatorial Problems. **Complexity of Computer Computations**, 1972.
* **Coluna 2 (Lado Direito):**
  * LEWIS, Rhydian. A survey of metaheuristic-based techniques for university timetabling. **OR Spectrum**, v. 30, 2008.
  * MARTIN, Robert C. **Clean Architecture: A Craftsman's Guide to Software Structure**. Prentice Hall, 2017.
  * MICHALEWICZ, Z.; FOGEL, D. B. **How to Solve It: Modern Heuristics**. Springer-Verlag, 2004.
  * SCHAERF, Andrea. A survey of automated timetabling. **Artificial Intelligence Review**, v. 13, n. 2, 1999.
  * SOMMERVILLE, Ian. **Engenharia de Software**. 10. ed. Pearson, 2015.
  * TARDIF, Maurice; LESSARD, Claude. **O trabalho docente: elementos para uma teoria da docência**. Vozes, 2014.

---

### [Slide 15/15] OBRIGADO & TRANSIÇÃO PARA A NUVEM (Idêntico ao Slide 15)
* **Imagem de Fundo:** Mesma imagem abstrata de grafos e nós do Slide 1.
* **Faixa Central em Vermelho:**
  * **Texto em Branco Gigante:** **OBRIGADO**
* **Box Central com Chamada da Nuvem:**
  * 🌐 **TimeTabling em Produção:** Microsoft Azure Cloud
  * ⚙️ **Stack:** PostgreSQL 16 + Django REST Framework + Vite/React 18
  * 🚀 **Abertura:** *"Convidamos a banca para a Demonstração Prática ao Vivo do Sistema na Nuvem."*
* **Rodapé:** Nomes dos autores, e-mails institucionais e QR Code do repositório no GitHub.
