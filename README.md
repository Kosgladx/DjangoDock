# EduSchedule AI — Sistema de Resolução de Horários Escolares (Timetabling Problem)

Sistema Full-Stack desenvolvido com **Django REST Framework**, **React (Vite + TypeScript + Tailwind CSS)** e **MySQL / SQLite**, baseado nos wireframes desenhados no **Penpot**.

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
* **Python 3.10+**
* **Node.js 18+**
* **MySQL** (opcional: caso o MySQL não esteja em execução, o Django automaticamente utilizará o SQLite local).

---

### 2. Executando o Backend (Django)

1. Abra um terminal na pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   pip install django djangorestframework django-cors-headers pymysql cryptography
   ```
3. Execute as migrações:
   ```bash
   python manage.py migrate
   ```
4. Inicie o servidor da API:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   *(Ou execute diretamente o arquivo `run_backend.bat` na raiz do projeto)*

---

### 3. Executando o Frontend (React + Vite)

1. Abra outro terminal na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *(Ou execute diretamente o arquivo `run_frontend.bat` na raiz do projeto)*
4. Acesse no navegador: **`http://localhost:3000`** ou a porta indicada pelo Vite.

---

## 🎨 Módulos e Telas (Conforme Wireframes do Penpot)

| Tela | Wireframe Penpot | Descrição |
| :--- | :--- | :--- |
| **Page 1: Matriz de Horários & Solver** | `Page 1` | Grade semanal (Seg a Sex x 50 min), filtros dinâmicos (*Por Turma*, *Por Professor*, *Por Sala*), badges de conflito em tempo real, painel de restrições rígidas/flexíveis com sliders de pesos e acionador do Solver de IA. |
| **Page 2: Professores & Disponibilidade** | `Page 2` | Tabela de docentes com cargas horárias alocadas (`20/20h`) e editor da matriz semanal de disponibilidade com marcação rápida de horários *Livres*, *Preferenciais* ou *Bloqueio Absoluto (Hard Constraint)*. |
| **Page 3: Slots & Grade Temporal** | `Page 3` | Abas de turnos (*Matutino*, *Vespertino*, *Noturno*), linha do tempo de slots de 50 min e intervalos obrigatórios de 20 min, dias letivos semanais e balanço de capacidade. |

---

## 🧠 Algoritmo de Resolução (*Timetabling Problem Solver*)

Localizado em `backend/solver/`:
* **`engine.py`**: Algoritmo híbrido construtivo guloso com busca local e propagação de restrições.
* **`constraints.py`**: Avaliador matemático de restrições rígidas (sem choques de professor ou sala, respeito a bloqueios docentes) e restrições flexíveis (minimização de janelas vagas, geminação contígua, equilíbrio das disciplinas na semana).