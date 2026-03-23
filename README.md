# 🚦 ViaLivre AI
### Inteligência Artificial para prever atrasos antes mesmo de você sair de casa

<p align="center">

Aplicação **Full Stack** que combina **IA**, **GPS**, **mapas interativos** e **dados climáticos**
para recomendar o melhor horário de deslocamento com base em risco de atraso.

</p>

---

<p align="center">

<img src="https://img.shields.io/badge/status-active-success?style=for-the-badge"/>
<img src="https://img.shields.io/badge/version-2.0-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/node.js-backend-green?style=for-the-badge"/>
<img src="https://img.shields.io/badge/frontend-modern-purple?style=for-the-badge"/>
<img src="https://img.shields.io/badge/maps-leaflet-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge"/>

</p>

---

## 🧠 Sobre o Projeto

O **ViaLivre AI** é um sistema inteligente que analisa múltiplos fatores de mobilidade urbana para prever o risco de atraso em um deslocamento.

A aplicação utiliza:

- geolocalização em tempo real (GPS)
- cálculo de rota
- previsão do clima
- horário selecionado
- tipo de transporte
- heurística de risco baseada em IA

para gerar recomendações inteligentes.

---

## ✨ Funcionalidades

### Mobilidade inteligente
- 🧠 cálculo de risco de atraso
- 📍 GPS automático como origem
- 🧭 navegação integrada com Google Maps
- 🗺️ mapa interativo com rota
- 🌦️ previsão do clima integrada
- 🚗 comparação entre transportes
- ⏱️ comparação de horários alternativos

### Experiência do usuário
- interface moderna estilo app
- feedback visual de risco
- gráfico de tempo estimado
- histórico de análises
- dashboard de métricas
- autocomplete de localização

### Arquitetura profissional
- backend estruturado em camadas
- API REST organizada
- separação frontend/backend
- integração com APIs externas
- código modular e escalável

---

## 🖼️ Preview da aplicação

### Página inicial
![Hero](./assets/images/banner.png)

---

![Hero](./assets/images/preview-hero.png)

---

### Dashboard inteligente

![Dashboard](./assets/images/preview-dashboard.png)

---

### Resultado da análise inteligente

![Resultado](./assets/images/preview-resultado.png)

---

### Visualização da rota no mapa

![Mapa](./assets/images/preview-mapa.png)

---

### Comparação inteligente de horários

![Comparações](./assets/images/preview-comparacoes.png)

---

### Comparação de modais de transporte

![Transportes](./assets/images/preview-transportes.png)
---

## ⚙️ Como funciona

O sistema realiza:

1. captura da localização via GPS
2. cálculo da distância entre origem e destino
3. obtenção da previsão do clima
4. análise do horário informado
5. avaliação do tipo de transporte
6. cálculo heurístico de risco
7. geração da recomendação inteligente

Resultado:

- tempo estimado de deslocamento
- nível de risco
- recomendação de horário
- comparação entre cenários
- rota exibida no mapa

---

## 🏗️ Arquitetura

vialivre-ai
│
├── src
│ └── backend
│ ├── controllers
│ ├── routes
│ ├── services
│ ├── config
│ ├── data
│ ├── database
│ ├── server.js
│ │
│ └── frontend
│ ├── index.html
│ ├── style.css
│ └── script.js
│
├── package.json
└── README.md


---

## 🧩 Tecnologias

### Backend
- Node.js
- Express
- SQLite
- arquitetura em camadas

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
- Geolocation API

---

## 🚀 Executar localmente

### clonar repositório

```bash
git clone https://github.com/RobersonCodes/vialivre-ai.git
cd vialivre-ai

instalar dependências
npm install
iniciar servidor
npm run dev
acessar aplicação
http://localhost:3000
📊 Exemplo de análise

Entrada:

origem: São Leopoldo
destino: Novo Hamburgo
horário: 11:00
transporte: carro
clima: parcialmente nublado

Saída:

tempo estimado: 7 minutos
risco de atraso: baixo
nível de trânsito: leve
recomendação: horário adequado

🎯 Objetivo

Demonstrar habilidades em:

desenvolvimento full stack
criação de APIs REST
arquitetura de software
integração com APIs externas
manipulação de mapas
geolocalização em aplicações web
lógica de previsão de risco
organização de código profissional
📌 Roadmap
autenticação de usuário
salvar casa e trabalho
dashboard em React
versão mobile PWA
deploy em nuvem
banco de dados PostgreSQL
previsão de trânsito em tempo real
machine learning avançado
👨‍💻 Autor

Roberson de Oliveira

Projeto desenvolvido para portfólio profissional na área de tecnologia.

⭐ Apoie o projeto

Se este projeto te ajudou, deixe uma estrela no repositório.