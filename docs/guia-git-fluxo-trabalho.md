# 🌿 Guia Didático de Git e Fluxo de Trabalho (GitHub Flow)

> **Público:** Kauê, Lucas e Pedro (Equipe EduSchedule)  
> **Objetivo:** Ter uma "receita de bolo" simples e à prova de erros para trabalhar no projeto sem medo de quebrar o código dos colegas.

---

## 🎯 Por que usamos o GitHub Flow?

No início, trabalhar com Git assusta porque ninguém quer sobrescrever o código de ninguém.
A regra de ouro do nosso time é muito simples:

> **Regra nº 1:** A branch `main` é sagrada. Ninguém programa direto na `main`.  
> **Regra nº 2:** Cada tarefa é feita em uma "ramificação" separada (branch).  
> **Regra nº 3:** O código só entra na `main` depois que outro colega der uma olhada no site do GitHub (Pull Request).

Dessa forma, é **impossível você apagar o código do seu colega por engano**.

---

## 🧭 O Ciclo do Dia a Dia em 5 Passos (Receita de Bolo)

Sempre que você for começar uma tarefa (seja uma tela no React, uma rota no Django ou um ajuste no solver), siga estes 5 passos:

### Passo 1: Atualize sua máquina com a versão mais recente
Antes de começar qualquer coisa, garanta que você está na `main` atualizada:
```powershell
git checkout main
git pull origin main
```

---

### Passo 2: Crie a sua branch para a tarefa
Crie uma ramificação com um nome que descreva o que você vai fazer:
```powershell
# Formato: git checkout -b tipo/nome-da-tarefa
# Exemplos:
git checkout -b feat/tela-cadastro-professores
git checkout -b feat/algoritmo-heuristica-slots
git checkout -b fix/conflito-horario-sexta
```
*(O comando `-b` cria a branch e já muda você para dentro dela. Tudo o que você fizer agora fica isolado no seu mundinho!)*

---

### Passo 3: Faça o seu código e salve os commits
Enquanto programa, vá salvando suas alterações com mensagens claras:
```powershell
# 1. Veja o que você alterou
git status

# 2. Adicione os arquivos que quer salvar
git add .

# 3. Salve o commit com uma mensagem curta
git commit -m "feat(professores): cria formulario de cadastro de docentes"
```
> 💡 **Dica de Ouro:** Não precisa esperar a tarefa inteira terminar para commitar. Faça commits pequenos ao longo do dia!

---

### Passo 4: Envie sua branch para o GitHub
Quando a sua funcionalidade estiver pronta e testada:
```powershell
# Envia a sua branch para o site do GitHub
git push -u origin NOME-DA-SUA-BRANCH
```
*(Exemplo: `git push -u origin feat/tela-cadastro-professores`)*

---

### Passo 5: Abra o Pull Request (PR) no site do GitHub
1. Abra o repositório no seu navegador (no GitHub).
2. O GitHub vai mostrar uma caixinha amarela dizendo: **"Compare & pull request"**. Clique nela!
3. Escreva um resumo rápido:
   - *O que foi feito?* (ex: "Criei a tela de cadastro e conectei com o backend").
   - *Como testar?* (ex: "Abra a rota /professores e teste clicar em salvar").
4. Marque seus colegas (Lucas ou Pedro) como **Reviewers**.
5. O colega entra no link, clica em **Review changes** $\rightarrow$ **Approve** $\rightarrow$ **Merge pull request**.
6. **Pronto!** O código foi integrado à `main` com segurança total!

Depois que o PR for aprovado, você volta para a sua `main` local e puxa as novidades:
```powershell
git checkout main
git pull origin main
```

---

## 🗓️ O Ritual de Homologação Semanal

Para a equipe não virar um caos e garantir que o projeto esteja sempre pronto para apresentar ao professor, adotamos a **Homologação Semanal**:

### Como funciona?
- **Durante a semana (Segunda a Sexta):** Cada um trabalha nas suas branches e vai abrindo os Pull Requests conforme termina as fatias.
- **No dia da Homologação (ex: Domingo à tarde ou Segunda-feira):**
  Um responsável da equipe (pode ser o Kauê ou fazer um rodízio semanal entre os três) faz o papel de **Tech Lead de Homologação**:

### Checklist do Responsável da Semana (Leva 5 minutos):
1. **Merge dos PRs:** Garante que todos os Pull Requests aprovados foram integrados na `main`.
2. **Atualiza a máquina:** Roda `git checkout main` e `git pull origin main`.
3. **Teste no SQLite (Dia a Dia):**
   - Dá duplo clique em `setup_dev.bat`.
   - Confere se as migrações passaram e se o seed rodou liso.
4. **Teste no PostgreSQL (Docker - Homologação Real):**
   - Executa no terminal:
     ```bash
     docker compose up --build
     ```
   - Abre o navegador em `http://localhost:8000/api/classes/` e verifica se os dados subiram no banco oficial.
   - Pressiona `Ctrl + C` para desligar os containers.
5. **Carimbo da Versão (Git Tag):**
   Se estiver tudo 100%, o responsável cria uma tag oficial da semana:
   ```powershell
   git tag -a v0.1-semana-1 -m "Versao homologada da Semana 1"
   git push origin v0.1-semana-1
   ```
6. **Aviso no Grupo:** *"Galera, a versão da Semana 1 foi homologada e está 100% no Docker e no SQLite. Podem puxar a main!"*.

---

## 🆘 Botão de Pânico do Git (Socorro, me perdi!)

Se você digitou algum comando errado ou o Git começar a reclamar, **calma! Não delete a pasta do projeto!** Use estes comandos seguros:

### 1. "Quero ver em qual branch eu estou agora"
```powershell
git branch
```
*(A branch com um `*` verde é onde você está).*

### 2. "Fiz besteira no código e quero voltar ao que estava no último commit"
```powershell
git restore .
```
*(Desfaz todas as alterações não salvas nos arquivos).*

### 3. "Quero cancelar o que estava fazendo e voltar em segurança para a main"
```powershell
git checkout main
```

### 4. "O Git está dizendo que há conflito de merge (merge conflict)"
Não se desespere! Abra o arquivo indicado no VS Code / IDE. O Git vai mostrar exatamente:
```text
<<<<<<< HEAD (o que está na main)
código da main
=======
seu código da branch
>>>>>>> feat/sua-branch
```
Basta escolher qual código fica (ou combinar os dois), salvar o arquivo, e rodar:
```powershell
git add .
git commit -m "fix: resolve conflito de merge"
```

---

Qualquer dúvida durante o dia, mande o print do terminal no grupo antes de tentar comandos perigosos! 🚀
