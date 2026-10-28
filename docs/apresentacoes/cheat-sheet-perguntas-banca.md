# 🤫 Cheat Sheet Confidencial — Perguntas & Defesas de Banca (TCC)

> **Documento Interno de Preparação da Dupla (Kauê Loreno & Pedro Henrique)**  
> **Aviso:** Guardar este documento para estudo prévio. **NÃO projetar nem incluir no slide final**.  
> **Propósito:** Blindar a apresentação de sexta-feira contra os questionamentos mais difíceis da banca examinadora.

---

### 🎯 Pergunta 1: *"Por que vocês optaram por uma heurística construtiva gulosa e não usaram ferramentas mais modernas pós-2010 como o Google OR-Tools (CP-SAT) ou Hiper-heurísticas?"*

#### 🎙️ Como responder na lata (30 segundos):
> *"Professor, optamos por essa abordagem por dois motivos de engenharia e maturidade acadêmica:  
> Primeiro, **pelo valor formativo do TCC**: usar o Google OR-Tools tornaria o trabalho uma mera configuração de biblioteca externa como caixa-preta. Como futuros Engenheiros de Software, nosso objetivo foi implementar e dominar os fundamentos — modelando as matrizes de memória (`GridState`), analisando a complexidade assintótica e aplicando na prática os princípios clássicos de saturação de grafos de Brélaz e Carter.  
> Segundo, **pela nossa arquitetura desacoplada**: graças ao padrão Strategy da nossa Clean Architecture ([ADR 001](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md)), o motor do solver é totalmente isolado. Se no futuro a instituição crescer para 500 turmas e decidirmos plugar o Google OR-Tools, faremos isso com custo quase zero, usando inclusive a nossa heurística construtiva atual como solução inicial (**Warm Start**) para acelerar o solver do Google."*

---

### 🎯 Pergunta 2: *"Qual a real relevância social deste software? Por que a sociedade deveria se importar com mais um gerador de horários?"*

#### 🎙️ Como responder na lata (O "Xeque-Mate" de Relevância Social):
> *"Professor, nosso projeto não é apenas um exercício de algoritmos de computação. Como fundamentado na literatura sociológica da educação por **Tardif e Lessard (2014)**, a organização do tempo escolar tem impacto direto na saúde pública e na qualidade do ensino. Grades horárias fragmentadas com excesso de janelas vagas entre aulas são uma das principais causas comprovadas de **estresse crônico, esgotamento mental (*burnout*) e absenteísmo docente**.  
> O TimeTabling é uma tecnologia socialmente relevante porque atua em duas pontas: devolve centenas de horas de trabalho burocrático para a coordenação pedagógica focar nos alunos e gera grades humanizadas que protegem a integridade e a permanência dos professores em sala de aula."*

---

### 🎯 Pergunta 3: *"Vocês falaram que o problema é NP-Completo, mas também falaram em NP-Hard (NP-difícil). Afinal, o Timetabling é qual dos dois?"*

#### 🎙️ Como responder na lata (Domínio da Teoria da Computação):
> *"Excelente pergunta, professor. O Timetabling engloba os dois conceitos dependendo da formulação:  
> 1. A **versão de decisão** (*'Existe uma grade válida com zero choques de horários dentro de 25 slots semanais?'*) é formalmente **NP-Completa**, conforme provado por Even, Itai e Shamir em 1976. Se alguém nos entregar uma grade pronta, conseguimos verificar em tempo polinomial $O(N)$ se houve choque ou não.  
> 2. A **versão de otimização pedagógica** (*'Qual é a melhor grade dentre todas, que minimiza janelas vagas e equilibra a carga docente?'*) é **NP-Difícil (NP-Hard)**, pois busca o mínimo global em um espaço de busca exponencial.  
> No TimeTabling, nossa **Fase 1 (Construtiva)** ataca o problema NP-completo encontrando viabilidade física, e a nossa **Fase 2 (Busca Local)** ataca o problema NP-difícil refinando as restrições flexíveis."*

---

### 🎯 Pergunta 4: *"Por que a alocação de salas físicas de aula foi mantida fora de escopo ([ADR 005](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md))?"*

#### 🎙️ Como responder na lata (Defesa de Escopo e Realidade Prática):
> *"Adotamos essa limitação deliberada após o levantamento de requisitos com coordenadores reais. No modelo curricular de ensino básico, técnico e na maioria das faculdades brasileiras, **as turmas possuem salas cativas fixas** (os alunos do 3º Ano ou do 4º Semestre ficam sempre na mesma sala e os professores é que se deslocam).  
> Incluir alocação dinâmica de salas na primeira fatia vertical traria uma dimensionalidade extra sem benefício real para o cliente de referência, configurando *overengineering*. Documentamos formalmente na ADR 005 que a gestão de salas especializadas (como laboratórios de química ou informática) fica reservada para uma extensão futura modular do sistema."*

---

### 🎯 Pergunta 5: *"O que impede o sistema de travar ou ficar lento se o número de turmas quadruplicar?"*

#### 🎙️ Como responder na lata (Engenharia de Performance e Memória):
> *"O segredo da performance está na estrutura do nosso `GridState` na memória RAM. Em vez de realizarmos queries no PostgreSQL dentro do loop do algoritmo, carregamos os dados uma única vez para tensores matriciais e conjuntos de bits em Python puro.  
> A verificação de choque de um professor ou turma executa em **tempo constante $O(1)$** por operação de bitmask. A única etapa que escala com o volume é a ordenação inicial por criticidade, que opera em complexidade assintótica **$O(N \log N)$**. Mesmo quadruplicando o volume de turmas, o tempo estimado de execução permanece em frações de segundo, sem sobrecarregar o banco de dados."*

---

### 🎯 Pergunta 6: *"Por que separar Demanda Curricular de Alocação de Horário no banco de dados ([ADR 006](file:///c:/Users/Kauê/Documents/02_Programacao_e_Tech/Projetos/TimeTabling/docs/decisoes-arquiteturais.md))?"*

#### 🎙️ Como responder na lata (Modelagem de Dados e Usabilidade):
> *"Se salvássemos o horário diretamente na tabela de matérias, cairíamos em duas armadilhas: teríamos dezenas de campos nulos antes de rodar o solver e o coordenador só poderia ter uma única versão da grade.  
> Separando a **Demanda Curricular** (`CurriculumRequirement` — a intenção) da **Alocação de Horário** (`TimetableSlotAssignment` — o resultado calculado), ganhamos a capacidade de gerar múltiplos cenários de grades (Versão A, Versão B, Versão C) para a mesma turma, permitindo que a coordenação compare opções pedagógicas antes de homologar a definitiva."*
