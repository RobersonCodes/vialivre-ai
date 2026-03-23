# 🚦 ViaLivre AI

Sistema inteligente de previsão de mobilidade urbana utilizando **Inteligência Artificial**, análise de rota e dados climáticos para recomendar o melhor horário de deslocamento.

O projeto combina **backend Node.js**, **microserviço de IA em Python**, **frontend moderno** e integração com APIs externas para gerar análises de risco de atraso em tempo real.

---

## 🧠 Visão Geral

O **ViaLivre AI** analisa:

- distância da rota
- previsão do clima
- horário do deslocamento
- tipo de transporte
- padrão histórico de trânsito

Com base nesses dados, a IA calcula:

- risco de atraso
- tempo estimado
- melhor horário de saída
- nível de trânsito esperado

---

## ✨ Funcionalidades

✔️ Simulação de trajeto com IA  
✔️ Previsão de risco de atraso  
✔️ Integração com mapa interativo  
✔️ Análise baseada em clima real  
✔️ Histórico de análises  
✔️ Dashboard com métricas  
✔️ Gráfico de tempo estimado  
✔️ API REST estruturada  
✔️ Arquitetura profissional (backend + microserviço IA)

---

## 🏗️ Arquitetura do Projeto
vialivre-ai
│
├── src
│ └── backend
│ ├── app
│ ├── controllers
│ ├── services
│ ├── repositories
│ ├── middlewares
│ ├── routes
│ ├── utils
│ └── database
│
├── ai-service
│ ├── model
│ ├── data
│ ├── main.py
│ ├── train_model.py
│ └── requirements.txt
│
└── frontend
├── index.html
├── style.css
└── script.js


---

## 🧩 Tecnologias Utilizadas

### Backend
- Node.js
- Express
- SQLite
- Axios
- Arquitetura em camadas

### IA
- Python
- FastAPI
- Scikit-learn
- Pandas
- Joblib

### Frontend
- HTML5
- CSS moderno
- JavaScript
- Chart.js
- Leaflet.js

### APIs externas
- OpenStreetMap
- OSRM Routing API
- Open-Meteo Weather API

---

## 🚀 Como Executar o Projeto

### 1. Clonar repositório

```bash
git clone https://github.com/RobersonCodes/vialivre-ai.git
cd vialivre-ai

2. Instalar dependências do backend
npm install
3. Executar backend
npm run dev

Servidor disponível em:

http://localhost:3000
4. Executar microserviço de IA

Entrar na pasta:

cd ai-service

Instalar dependências:

uv pip install -r requirements.txt

Rodar IA:

uv run uvicorn main:app --reload --port 8000

API de IA disponível em:

http://localhost:8000
5. Abrir frontend

Abrir arquivo:

frontend/index.html

ou usar extensão Live Server no VSCode.

📊 Exemplo de análise gerada

A IA retorna:

tempo estimado de deslocamento
risco de atraso
classificação do trânsito
melhor horário alternativo
recomendação inteligente
🎯 Objetivo do Projeto

Demonstrar conhecimentos em:

arquitetura backend profissional
integração entre Node.js e Python
criação de APIs REST
consumo de APIs externas
desenvolvimento frontend moderno
uso de Machine Learning em aplicações reais
👨‍💻 Autor

Roberson de Oliveira

Projeto desenvolvido para portfólio profissional na área de tecnologia.

📌 Melhorias Futuras
autenticação de usuário
dashboard em React
deploy na nuvem
banco de dados PostgreSQL
modelo de IA mais avançado
análise preditiva com histórico maior
⭐ Se este projeto te ajudou, deixe uma estrela no repositório!

---

## Como atualizar no GitHub

No terminal:

```bash
git add README.md
git commit -m "docs: README premium profissional"
git push