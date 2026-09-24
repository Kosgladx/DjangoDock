# 🚀 Guia de Onboarding e Setup — Equipe EduSchedule (Timetabling)

Bem-vindos ao projeto! Este guia foi feito para que qualquer membro da equipe (Kauê, Lucas, Pedro) consiga clonar o repositório e colocar o sistema para rodar em **menos de 3 minutos**, sem dor de cabeça com configurações manuais.

---

## 📋 Pré-requisitos Mínimos

Antes de rodar, garanta que você tem instalado no seu computador:

1. **Python 3.11 ou 3.12** ([Download oficial](https://www.python.org/downloads/))
   - ⚠️ **MUITO IMPORTANTE:** Na primeira tela do instalador do Python no Windows, marque a caixinha **`Add Python to PATH`** antes de clicar em Install.
2. **Node.js LTS (v18+)** ([Download oficial](https://nodejs.org/))
   - Necessário para a interface visual React/Vite.
3. **Git** ([Download oficial](https://git-scm.com/))

---

## ⚡ Opção 1: Setup Automático em 1 Clique (Recomendado)

Criamos um script que faz absolutamente tudo sozinho (cria o ambiente virtual, instala dependências do Python, gera o `.env`, roda as migrações do banco, popula com dados reais de teste e instala os pacotes do React).

### Passo a Passo:
1. Abra a pasta do projeto no Windows Explorer.
2. Dê **duplo clique** no arquivo **`setup_dev.bat`**.
3. Aguarde o terminal concluir (leva cerca de 1 a 2 minutos na primeira vez).
4. Quando aparecer `TUDO PRONTO!`, pressione qualquer tecla para fechar.

### O que o `setup_dev.bat` faz por você (sob o capô):
- **Detecta o Python:** Localiza o executável no seu computador e valida o PATH.
- **Cria o ambiente virtual (.venv):** Isola todas as dependências do projeto para não sujar o seu computador.
- **Configura o arquivo `.env`:** Cria automaticamente o `backend\.env` baseado no modelo de exemplo (`.env.example`).
- **Instala dependências do Python:** Baixa e instala todos os pacotes necessários de uma vez via `requirements.txt`.
- **Prepara o banco de dados:** Executa as migrações estruturais do Django (`manage.py migrate`).
- **Popula dados reais de teste (Seed):** Executa `manage.py seed_data`, cadastrando turnos, horários, disciplinas, professores com disponibilidades e turmas.
- **Prepara a interface React:** Verifica se o Node.js está presente e instala as dependências da pasta `frontend/` (`npm install`).

### Como rodar no dia a dia:
Depois do setup feito, para trabalhar no projeto você só precisa abrir dois terminais (ou dar 2 cliques nos atalhos):
* **Backend (API Django):** Duplo clique em **`run_backend.bat`** (disponível em `http://127.0.0.1:8000`)
* **Frontend (React UI):** Duplo clique em **`run_frontend.bat`** (disponível em `http://localhost:5173`)

---

## 🤖 Opção 2: "Deixe a IA Configurar para Você" (Cursor / Copilot / Claude)

Se você estiver usando o **Cursor**, **VS Code com Claude Dev/Roo Code**, ou o próprio **Antigravity**, basta abrir o chat da IA na raiz do projeto e colar o prompt abaixo:

```text
Olá! Acabei de clonar o repositório EduSchedule Timetabling. Por favor, configure o ambiente para mim executando as seguintes etapas no terminal:
1. Execute o script `setup_dev.bat` localizado na raiz do projeto.
2. Caso prefira rodar os comandos diretamente:
   - Crie o ambiente virtual `.venv` na raiz.
   - Instale as dependências com `.\.venv\Scripts\pip install -r backend\requirements.txt`.
   - Garanta que `backend\.env` exista copiando de `backend\.env.example`.
   - Execute as migrações: `.\.venv\Scripts\python backend\manage.py migrate`.
   - Popule os dados iniciais: `.\.venv\Scripts\python backend\manage.py seed_data`.
   - Na pasta `frontend/`, instale os pacotes com `npm install`.
Me avise quando tudo estiver pronto para eu iniciar o backend e o frontend!
```

---

## 💻 Opção 3: Setup Manual pelo Terminal (PowerShell / CMD)

Se você prefere controlar cada comando manualmente:

```powershell
# 1. Crie e ative o ambiente virtual na raiz do projeto
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Configure o arquivo de variáveis de ambiente
copy backend\.env.example backend\.env

# 3. Instale as dependências do Python
pip install -r backend\requirements.txt

# 4. Aplique as migrações no banco SQLite
python backend\manage.py migrate

# 5. Popule o banco com dados de exemplo (turmas, matérias, professores, restrições)
python backend\manage.py seed_data

# 6. Instale as dependências da interface React
cd frontend
npm install
cd ..
```

---

## 🔄 Como Vamos Lidar com Mudanças Futuras?

Em um projeto em equipe, o código evolui semanalmente. Veja como lidar com cada tipo de atualização sem quebrar sua máquina:

### 1. Quando alguém subir novidades no GitHub (`git pull`)
Sempre que você puxar atualizações dos seus colegas:
```powershell
git pull origin main
```
**Basta dar duplo clique novamente no `setup_dev.bat`!**
O script é **idempotente** (seguro para rodar várias vezes):
- Ele não recria o que já existe.
- Instala novas dependências do `requirements.txt` se alguém adicionou uma biblioteca.
- Roda novas migrações (`manage.py migrate`) se a estrutura de tabelas mudou.
- Instala novos pacotes do `package.json` no React.

---

### 2. Mudanças no Banco de Dados (Novos campos ou tabelas)
Se você ou um colega alterar os modelos em `backend/core/models.py`:
1. Quem alterou gera a migração:
   ```powershell
   python backend\manage.py makemigrations
   ```
2. Commita o novo arquivo gerado na pasta `backend/core/migrations/`.
3. Quando os outros colegas derem `git pull`, o `setup_dev.bat` (ou `python backend\manage.py migrate`) atualiza o banco deles automaticamente sem perder dados.

---

### 3. "Socorro! Meu banco de dados de teste bagunçou!" (Botão de Pânico / Reset Rápido)
Se durante testes manuais os dados ficarem inconsistentes ou você quiser começar do zero absoluto:
1. Apague o arquivo `backend\db.sqlite3`.
2. Dê duplo clique em **`setup_dev.bat`**.
3. Em 5 segundos o banco renasce zerado, com todas as tabelas criadas e com os dados padrão (professores, turmas, matérias e restrições) 100% populados!

---

### 4. Novas Variáveis de Configuração (`.env`)
Se adicionarmos uma nova configuração no projeto (ex: chave de API ou porta diferente):
- Ela será adicionada no arquivo modelo `backend\.env.example`.
- Avisaremos no grupo do WhatsApp/Discord: *"Galera, adicionamos a variável X no `.env`, confiram lá!"*.
- Seu arquivo `backend\.env` pessoal nunca é sobrescrito pelo Git.

---

### 5. Boas Práticas para Evitar Conflitos de Git
- **Trabalhem em fatias separadas:** Por exemplo, enquanto um mexe nas telas do frontend (`frontend/src/`), outro mexe na lógica do backend (`backend/core/`) ou no algoritmo do solver (`backend/solver/`).
- **Sempre puxe antes de começar o dia:** `git pull` antes de começar a codar.
- **Commits atômicos:** Commitem alterações pequenas com mensagens claras, em vez de um "commit gigante de domingo à noite".

---

## 📦 Guia e Catálogo da Massa de Dados (`seed_data.py`)

O comando `seed_data.py` é o gerador oficial de massa de dados do projeto. Ele serve para que você não precise cadastrar dezenas de matérias, turmas e professores na mão toda vez que o banco de dados for reiniciado.

### Como Executar no Terminal
O `setup_dev.bat` já roda esse comando sozinho, mas você pode chamá-lo manualmente a qualquer momento:

```powershell
# 1. Modo Normal: cadastra todas as matérias, professores, disponibilidades e turmas
.\.venv\Scripts\python.exe backend\manage.py seed_data

# 2. Modo com Solver: além de cadastrar, já executa o algoritmo e gera uma grade alocada
.\.venv\Scripts\python.exe backend\manage.py seed_data --with-solver
```
> **Nota de Segurança:** O comando é **100% idempotente**. Você pode rodá-lo quantas vezes quiser sem risco de duplicar professores ou turmas no banco.

---

### Catálogo Completo dos Dados de Teste

#### 1. Turno e Períodos de Aula (Matutino)
- **Turno:** Matutino (07:15 às 12:00)
- **Slots:**
  - `1º Período`: 07:15 – 08:05 (50 min)
  - `2º Período`: 08:05 – 08:55 (50 min)
  - `Intervalo / Recreio`: 08:55 – 09:15 (20 min — intervalo pedagógico)
  - `3º Período`: 09:15 – 10:05 (50 min)
  - `4º Período`: 10:05 – 10:55 (50 min)
  - `5º Período`: 10:55 – 11:45 (50 min)

#### 2. Disciplinas Cadastradas (12 Matérias)
| Código | Disciplina | Exige Laboratório? | Cor na Interface (Hex) |
| :---: | :--- | :---: | :---: |
| `MAT` | Matemática I & II | Não | `#3B82F6` (Azul) |
| `FIS` | Física | Sim | `#8B5CF6` (Roxo) |
| `QUI` | Química Orgânica & Geral | Sim | `#F43F5E` (Rosa Carmim) |
| `BIO` | Biologia | Sim | `#10B981` (Verde Esmeralda) |
| `POR` | Língua Portuguesa & Literatura | Não | `#6366F1` (Índigo) |
| `HIS` | História | Não | `#F59E0B` (Âmbar) |
| `GEO` | Geografia | Não | `#D97706` (Laranja Escuro) |
| `ING` | Inglês Instrumental | Não | `#06B6D4` (Ciano) |
| `EDF` | Educação Física | Não | `#F97316` (Laranja) |
| `SOC` | Sociologia | Não | `#EC4899` (Rosa Pink) |
| `FIL` | Filosofia | Não | `#14B8A6` (Turquesa) |
| `ART` | Artes Visuais | Não | `#A855F7` (Púrpura) |

#### 3. Corpo Docente (11 Professores)
| Professor(a) | Iniciais | Limite Semanal | Regra de Disponibilidade Específica |
| :--- | :---: | :---: | :--- |
| **Prof. Roberto Silva** | RS | 20 horas | **Bloqueado às sextas-feiras**; Preferência por segundas e quartas |
| **Profª. Mariana Costa** | MC | 16 horas | Livre todos os dias |
| **Prof. Carlos Eduardo** | CE | 14 horas | Livre todos os dias |
| **Profª. Beatriz Lima** | BL | 22 horas | Livre todos os dias |
| **Profª. Aline Mendes** | AM | 18 horas | Livre todos os dias |
| **Prof. Fernando Dias** | FD | 16 horas | Livre todos os dias |
| **Prof. Lucas Ribeiro** | LR | 12 horas | Livre todos os dias |
| **Profª. Julia Smith** | JS | 10 horas | Livre todos os dias |
| **Prof. Marcos Paulo** | MP | 10 horas | Livre todos os dias |
| **Profª. Helena Ramos** | HR | 12 horas | Livre todos os dias |
| **Profª. Laura Meireles** | LM | 8 horas | Livre todos os dias |

#### 4. Turmas e Carga Curricular (3º Ano A)
- **Turmas:** `3º Ano A` (35 alunos) e `3º Ano B` (32 alunos)
- **Demandas Curriculares Vinculadas ao 3º Ano A:**
  - Matemática (Prof. Roberto): 4 aulas/semana (com permissão para aulas geminadas)
  - Língua Portuguesa (Profª. Beatriz): 4 aulas/semana
  - Física (Profª. Mariana): 3 aulas/semana
  - Química (Prof. Carlos): 3 aulas/semana
  - Biologia (Profª. Aline): 3 aulas/semana
  - História (Prof. Fernando): 2 aulas/semana
  - Geografia (Prof. Lucas): 2 aulas/semana
  - Inglês (Profª. Julia): 1 aula/semana
  - Educação Física (Prof. Marcos): 1 aula/semana
  - Sociologia (Profª. Helena): 1 aula/semana
  - Artes Visuais (Profª. Laura): 1 aula/semana

#### 5. Parâmetros e Pesos do Solver (Constraints)
- `teacher_clash` (Hard — Peso 100): Inviolável — 1 professor em apenas 1 turma simultânea.
- `teacher_blocked` (Hard — Peso 100): Respeito estrito aos dias bloqueados pelo docente.
- `min_gap_weight` (Soft — Peso 85): Penaliza janelas ociosas entre aulas do professor.
- `double_lesson_weight` (Soft — Peso 90): Favorece blocos contínuos de 2 aulas para matérias de 3+ créditos.
- `daily_balance_weight` (Soft — Peso 70): Evita sobrecarga de aulas da mesma matéria em um único dia.
- `day_concentration_weight` (Soft — Peso 60): Concentra os dias letivos do professor para evitar deslocamentos desnecessários.

---

### Como Adicionar Novos Dados no Seed?
Se você quiser cadastrar um novo professor ou matéria nos dados de teste:
1. Abra o arquivo [`backend/core/management/commands/seed_data.py`](file:///c:/Users/Kauê/Documents/TimeTabling/backend/core/management/commands/seed_data.py).
2. Adicione uma linha na lista correspondente (`subjects_data`, `teachers_data` ou `curric_3a`).
3. Rode `python backend/manage.py seed_data` no terminal para atualizar o banco!

---

## 🛠️ Solução de Problemas Comuns (FAQ)

### ❓ "O PowerShell dá erro dizendo que a execução de scripts está desabilitada"
Abra o PowerShell como Administrador e execute uma única vez:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Isso permite que o Windows execute scripts de ativação de ambiente virtual (`.venv\Scripts\Activate.ps1`).

### ❓ "Python não é reconhecido como um comando interno ou externo"
O instalador do Python foi executado sem marcar "Add Python to PATH".
**Solução:** Baixe o instalador novamente, clique em **Modify** e marque a caixa **Add Python to PATH**.

### ❓ "Erro: That port is already in use (porta 8000 ocupada)"
Algum processo antigo do Django ficou aberto em segundo plano.
**Solução:** Feche os terminais antigos ou execute no PowerShell:
```powershell
Get-Process python | Stop-Process -Force
```

---

Qualquer dúvida ou problema, mande no grupo da equipe! 🚀
