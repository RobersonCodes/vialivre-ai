ViaLivre AI 🚦

Aplicação web que utiliza lógica analítica para estimar condições de trânsito e sugerir o melhor horário para sair de casa.

O objetivo é ajudar pessoas a planejarem seus deslocamentos diários considerando:

horário de pico
condições climáticas
tipo de transporte
risco de atraso
tempo estimado de trajeto

O projeto demonstra habilidades de desenvolvimento full stack, organização de código e construção de APIs.

Demonstração

Interface moderna com:

simulação de trajeto
recomendação inteligente
histórico de análises
gráfico de tempo estimado
medidor visual de risco
mapa interativo
Problema

Muitas pessoas enfrentam dificuldades para prever:

quanto tempo levará o trajeto
se haverá congestionamento
qual o melhor horário para sair
impacto do clima no trânsito
risco de atraso

O ViaLivre AI busca fornecer uma estimativa simples baseada em regras de decisão.

Funcionalidades
Simulação de trajeto

Usuário informa:

origem
destino
horário
clima
tipo de transporte

O sistema calcula:

tempo estimado
nível de trânsito
recomendação de saída
pontuação de risco
melhor horário sugerido
Análise inteligente

O sistema considera:

horários de pico
impacto da chuva
impacto do transporte público
variação de tempo conforme cenário
classificação de risco

Exemplo:

Cenário crítico
Chance de trânsito leve: 22%
Melhor horário sugerido: 06:00

Histórico de análises

As últimas análises ficam salvas e exibidas:

origem
destino
horário
clima
transporte
tempo estimado
nível de trânsito
Visualização gráfica

Gráfico mostra evolução do tempo estimado ao longo das análises realizadas.

Permite visualizar padrões de variação.

Medidor visual de risco

Barra de risco baseada em pontuação de 0 a 100:

verde → baixo risco
amarelo → risco moderado
vermelho → alto risco
Mapa interativo

Exibe origem e destino no mapa.

Utiliza OpenStreetMap via Leaflet.

O zoom é ajustado automaticamente para visualizar os pontos.

Tecnologias utilizadas

Frontend

HTML
CSS
JavaScript
Chart.js
Leaflet.js

Backend

Node.js
Express

Outros

Git
GitHub
API REST
JSON
Arquitetura do projeto
vialivre-ai
│
├── backend
│   ├── routes
│   ├── controllers
│   ├── services
│   ├── config
│   └── server.js
│
├── frontend
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── database
│   └── schema.sql
│
└── README.md

Como executar o projeto

1. clonar o repositório
git clone https://github.com/RobersonCodes/vialivre-ai.git
2. acessar pasta do backend
cd vialivre-ai/backend
3. instalar dependências
npm install
4. iniciar servidor
node server.js

Servidor disponível em:

http://localhost:3000
5. abrir frontend

Abra o arquivo:

frontend/index.html

ou utilize extensão Live Server no VS Code.

Endpoints da API
listar análises

GET

/api/analises
criar nova análise

POST

/api/analises

exemplo de body:

{
  "origem": "São Leopoldo",
  "destino": "Porto Alegre",
  "horario": "08:00",
  "clima": "chuva",
  "transporte": "onibus"
}
limpar histórico

DELETE

/api/analises
Objetivo do projeto

Demonstrar conhecimento em:

lógica de programação
criação de APIs
integração frontend e backend
organização de código
manipulação de JSON
consumo de API externa
visualização de dados
versionamento com Git
boas práticas de estruturação
Melhorias futuras
integração com API de clima real
cálculo de rota real
autenticação de usuários
dashboard de análises
previsão baseada em histórico
deploy completo online
banco de dados relacional
Autor

Roberson de Oliveira

Desenvolvedor em formação com foco em backend.

Experiência anterior na área industrial e atualmente em transição para tecnologia.

Status do projeto

Em desenvolvimento

Projeto evoluindo continuamente como parte do portfólio profissional.
