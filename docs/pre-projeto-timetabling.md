# Pré-Projeto: Sistema de Geração Automática de Horário Escolar (Timetabling)

## Sumário

- 1. Introdução – Tema e Problematização
- 2. Justificativa
- 3. Objetivos
  - 3.1 Geral
  - 3.2 Específicos
- 4. Metodologia da Pesquisa
- 5. Cronograma
- Referências

---

## 1. Introdução – Tema e Problematização

A montagem de horários escolares e acadêmicos é um problema clássico de alocação de recursos, presente em praticamente toda instituição de ensino — desde escolas de educação básica até universidades. Apesar de sua aparente simplicidade operacional, o problema de timetabling é computacionalmente complexo: envolve a combinação de múltiplas restrições simultâneas (disponibilidade de professores, carga horária de disciplinas, capacidade de turmas, ausência de conflitos de horário) em um espaço de possibilidades que cresce de forma exponencial conforme aumentam o número de professores, turmas e disciplinas envolvidos.

Na prática, essa tarefa costuma ser realizada manualmente por coordenadores pedagógicos, consumindo tempo considerável e sendo propensa a erros — como conflitos de horário não percebidos, subaproveitamento de disponibilidade docente ou distribuição desigual da carga horária. Ferramentas comerciais existem para automatizar esse processo, mas frequentemente são pagas, fechadas (sem possibilidade de adaptação ao contexto específico de cada instituição) ou tecnicamente defasadas em termos de experiência de uso.

Este projeto propõe o desenvolvimento de um sistema web para geração automática de horários escolares, fundamentado em técnicas de Pesquisa Operacional — especificamente Programação Linear Inteira Mista (MILP) — capaz de alocar automaticamente os horários das aulas a partir de dados previamente definidos por um coordenador (professores, disciplinas, turmas e suas respectivas alocações), respeitando restrições obrigatórias (como a impossibilidade de um professor ou turma estar em dois lugares ao mesmo tempo) e buscando minimizar violações de restrições desejáveis (como janelas vagas na grade de horários).

A problematização que orienta esta pesquisa pode ser formulada da seguinte forma: **é possível desenvolver um sistema automatizado, fundamentado em modelagem matemática de otimização, que gere horários escolares válidos e de qualidade satisfatória em tempo computacional viável, para instituições de ensino de médio porte, sem depender de alocação manual de salas ou verificação de habilitação docente?**

---

## 2. Justificativa

A escolha deste tema justifica-se por razões de ordem prática, acadêmica e pessoal.

Do ponto de vista **prático**, a geração manual de horários escolares é uma atividade recorrente, sujeita a erro humano e consumidora de tempo significativo da equipe de coordenação pedagógica em qualquer instituição de ensino. Um sistema automatizado que resolva esse problema de forma confiável representa ganho real de eficiência operacional, especialmente em instituições que não possuem orçamento para adquirir soluções comerciais fechadas.

Do ponto de vista **acadêmico**, o problema de timetabling é amplamente estudado na literatura de Pesquisa Operacional e Ciência da Computação, sendo classificado como um problema de otimização combinatória de complexidade NP-difícil. Sua resolução exige a aplicação prática de conceitos centrais da Engenharia de Software — como modelagem de dados, arquitetura de sistemas web e design de banco de dados relacional — em conjunto com fundamentos de Programação Linear Inteira, área da Pesquisa Operacional pouco explorada na maioria dos projetos de graduação em Engenharia de Software, que tendem a se concentrar em sistemas convencionais de CRUD. Este projeto, portanto, contribui para a formação do autor em uma área de aplicação mais técnica e matematicamente fundamentada, além de gerar um artefato de portfólio com maior diferenciação técnica.

Do ponto de vista **pessoal**, o tema foi escolhido por alinhar-se ao interesse do autor em algoritmos de otimização e busca — área de conhecimento que também possui aplicação direta em outros domínios de interesse, como inteligência artificial aplicada a jogos digitais.

Espera-se, ao final deste estudo, contribuir com um artefato funcional que sirva tanto como solução prática ao problema proposto quanto como demonstração de competência técnica na aplicação de métodos de Pesquisa Operacional a um problema real de engenharia de software.

---

## 3. Objetivos

### 3.1 Geral

Desenvolver um sistema web para geração automática de horários escolares, fundamentado em técnicas de Programação Linear Inteira Mista, capaz de alocar automaticamente aulas em slots de horário a partir de dados previamente cadastrados por um coordenador, respeitando restrições obrigatórias de conflito de horário.

### 3.2 Específicos

- Levantar os requisitos funcionais e não-funcionais do sistema por meio de entrevistas estruturadas com o cliente/professor responsável;
- Modelar as entidades de dados do sistema (professor, curso, turma, disciplina, slot de horário, aula) e seus relacionamentos, por meio de Diagrama Entidade-Relacionamento (DER) e Diagrama de Classes;
- Projetar e implementar o esquema de banco de dados relacional em PostgreSQL, observando princípios de normalização;
- Formular matematicamente o problema de alocação de horários como um modelo de Programação Linear Inteira Mista (MILP), identificando variáveis de decisão, restrições fortes (hard constraints) e restrições fracas (soft constraints);
- Implementar o motor de resolução (solver) do sistema utilizando bibliotecas de otimização em Python (PuLP);
- Desenvolver a aplicação web (backend e frontend) que permita o cadastro de dados pelo coordenador, a declaração de disponibilidade pelo professor, e a execução e visualização do horário gerado;
- Validar o sistema desenvolvido por meio de testes com instâncias de dados de complexidade crescente, avaliando viabilidade computacional e qualidade da solução gerada.

---

## 4. Metodologia da Pesquisa

**Tipo de pesquisa:** Trata-se de uma pesquisa de natureza **aplicada**, de abordagem **qualitativa e quantitativa combinada**, com objetivos **exploratórios e descritivos**. É aplicada porque tem como fim a produção de um artefato de software funcional que resolve um problema prático concreto; é qualitativa na etapa de levantamento de requisitos (compreensão do problema junto ao cliente) e quantitativa na etapa de validação (mensuração de tempo de execução, viabilidade de solução e qualidade dos horários gerados frente a instâncias de teste).

Do ponto de vista dos procedimentos técnicos, caracteriza-se como uma **pesquisa-ação aplicada ao desenvolvimento de software**, seguindo etapas iterativas de levantamento de requisitos, modelagem, implementação e validação.

**Universo e amostra:** O universo do estudo compreende instituições de ensino técnico/médio de porte médio. Como amostra para validação do sistema, será utilizado um conjunto de dados fornecido pelo cliente/professor, baseado em uma instituição real de referência, contendo aproximadamente 50 professores e entre 11 e 14 turmas, distribuídas nos turnos matutino e noturno.

**Instrumentos de coleta de dados:** O levantamento de requisitos foi conduzido por meio de **entrevistas semiestruturadas** com o cliente/professor responsável pela definição do escopo do sistema, gravadas e posteriormente transcritas e consolidadas em documento de requisitos. Complementarmente, foi realizada **revisão bibliográfica** em livros-texto de Pesquisa Operacional e Heurísticas Modernas, artigos científicos sobre o problema de timetabling universitário/escolar (University Course Timetabling Problem), e análise de soluções de referência de mercado no cenário nacional (como os softwares Urânia e PowerCubus).

**Método de análise:** Os dados levantados nas entrevistas foram analisados de forma qualitativa, por meio de consolidação temática dos requisitos em categorias (papéis de usuário, entidades de dados, restrições fortes e fracas, requisitos não-funcionais). A validação do sistema desenvolvido será realizada de forma quantitativa, por meio da execução do solver sobre instâncias de teste de complexidade crescente, medindo-se tempo de execução, viabilidade da solução encontrada e número de restrições fracas violadas na solução final.

---

## 5. Cronograma

| Atividade | Ago/26 | Set/26 | Out/26 | Nov/26 | Dez/26 | Jan/27 | Fev/27 | Mar/27 | Abr/27 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Pesquisa do tema | X | X | | | | | | | |
| Pesquisa bibliográfica | X | X | X | X | | | | | |
| Levantamento de requisitos (entrevistas) | | X | X | | | | | | |
| Modelagem de dados (DER, Diagrama de Classes) | | | X | X | | | | | |
| Formulação matemática do problema (MILP) | | | | X | X | | | | |
| Implementação do banco de dados (PostgreSQL) | | | | | X | X | | | |
| Implementação do solver (PuLP) | | | | | | X | X | | |
| Desenvolvimento da aplicação web | | | | | | | X | X | |
| Coleta e validação de dados de teste | | | | | | | | X | X |
| Apresentação e discussão dos resultados | | | | | | | | X | X |
| Elaboração do trabalho final | | | | | | | | | X |
| Entrega do trabalho | | | | | | | | | X |

---

## Referências

HILLIER, Frederick S.; LIEBERMAN, Gerald J. **Introduction to Operations Research**. Nova York: McGraw-Hill Education.

MASSACHUSETTS INSTITUTE OF TECHNOLOGY. **15.083J — Integer Programming and Combinatorial Optimization**. MIT OpenCourseWare. Disponível em: https://ocw.mit.edu/. Acesso em: 2026.

MICHALEWICZ, Zbigniew; FOGEL, David B. **How to Solve It: Modern Heuristics**. 2. ed. Berlim: Springer-Verlag, 2004.

POWERCUBUS. **Software de Criação de Horários Escolares**. Disponível em: https://www.powercubus.com.br/. Acesso em: 2026.

URÂNIA. **Sistema de Elaboração de Horários Escolares**. Disponível em: https://www.urania.com.br/. Acesso em: 2026.

PULP — Python Linear Programming Library. Documentação oficial. Disponível em: https://coin-or.github.io/pulp/. Acesso em: 2026.

UNITIME — University Course Timetabling and Student Scheduling Solution. Disponível em: https://www.unitime.org/. Acesso em: 2026.

WINSTON, Wayne L. **Operations Research: Applications and Algorithms**. Boston: Cengage Learning.

*[Nota: as referências dos papers/surveys específicos de University Course Timetabling Problem (UCTP) e do artigo de especificação formal do ITC-2007 devem ser complementadas com os dados bibliográficos completos (autor, título exato, periódico/conferência, ano) no momento em que forem efetivamente utilizados na redação final, para manter conformidade com normas de citação acadêmica.]*
