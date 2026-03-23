# ViaLivre AI 🚦

Aplicação web full stack desenvolvida para simular condições de trânsito e recomendar o melhor horário para sair com base em rota, clima, transporte e risco estimado de atraso.

O projeto foi criado com foco em mobilidade inteligente e demonstra integração entre frontend, backend, API REST, banco de dados, mapa interativo, gráfico de histórico e consumo de APIs externas.

---

## Preview

O sistema oferece uma interface moderna e intuitiva para:

- simular trajetos
- gerar recomendações inteligentes
- visualizar nível de risco
- acompanhar histórico das análises
- consultar gráfico de tempo estimado
- visualizar origem e destino no mapa

---

## Problema resolvido

Na rotina urbana, muitas pessoas saem de casa sem saber:

- quanto tempo o trajeto realmente vai levar
- se haverá trânsito intenso
- se o clima vai piorar a situação
- qual o melhor horário para sair
- qual o risco de chegar atrasado

O ViaLivre AI reduz essa incerteza ao transformar dados simples em uma recomendação prática e objetiva.

---

## Funcionalidades

### Simulação inteligente de trajeto
O usuário informa:

- origem
- destino
- horário
- clima
- transporte

A aplicação gera:

- distância estimada da rota
- tempo previsto de deslocamento
- nível de trânsito
- pontuação de risco
- chance de trânsito leve
- melhor horário sugerido
- mensagem de recomendação

### Histórico de análises
As análises são registradas e exibidas em lista com:

- origem e destino
- horário
- clima
- transporte
- tempo estimado
- risco
- nível de trânsito

### Gráfico de tempo estimado
O sistema apresenta um gráfico com a variação do tempo previsto ao longo das análises realizadas.

### Medidor visual de risco
A aplicação exibe um medidor com escala de risco de 0 a 100:

- verde → baixo risco
- amarelo → risco moderado
- vermelho → alto risco

### Comparação de horários
O sistema compara horários próximos ao informado e sugere a opção mais favorável.

### Mapa interativo
A aplicação usa Leaflet com OpenStreetMap para mostrar origem, destino e rota estimada no mapa.

### Integração com clima
A aplicação pode utilizar clima manual e também consultar previsão meteorológica e condições atuais.

---

## Diferenciais do projeto

- análise de risco baseada em regras de negócio
- integração com APIs externas de rota e clima
- persistência em banco SQLite
- frontend dinâmico com atualização em tempo real
- visualização gráfica e geográfica
- arquitetura backend organizada em camadas
- projeto orientado a portfólio profissional

---

## Tecnologias utilizadas

### Frontend
- HTML
- CSS
- JavaScript
- Chart.js
- Leaflet.js

### Backend
- Node.js
- Express
- SQLite

### APIs e recursos externos
- OpenStreetMap / Nominatim
- OSRM
- Open-Meteo

### Outros
- JSON
- Git
- GitHub
- API REST

---

## Arquitetura do projeto

```bash
vialivre-ai
src
 └── backend
     ├── controllers
     │   └── analysisController.js
     │
     ├── services
     │   └── analysisService.js
     │
     ├── models
     │   └── analysisModel.js
     │
     ├── routes
     │   └── analysisRoutes.js
     │
     ├── middlewares
     │   ├── errorHandler.js
     │   └── notFoundHandler.js
     │
     ├── utils
     │   ├── logger.js
     │   └── response.js
     │
     ├── database
     │   ├── db.js
     │   ├── init.js
     │   └── schema.sql
     │
     ├── app.js
     ├── server.js
     ├── package.json
     └── package-lock.json

Padrão de arquitetura

O backend segue separação por responsabilidades:

controllers → recebem requisições e devolvem respostas
services → aplicam regras de negócio
repositories → acessam o banco de dados
middlewares → validação e tratamento de erros
database → conexão e inicialização do SQLite

Essa estrutura melhora manutenção, legibilidade e escalabilidade do projeto.

Como executar o projeto
1. Clonar o repositório
git clone https://github.com/RobersonCodes/vialivre-ai.git

2. Entrar na pasta do backend
cd vialivre-ai/backend

3. Instalar as dependências
npm install

4. Iniciar o servidor
node server.js

Servidor disponível em:

http://localhost:3000
5. Executar o frontend

Abra o arquivo:

frontend/index.html

ou utilize a extensão Live Server no VS Code.

Endpoints da API
Método	Endpoint	Descrição
GET	/api/v1/analises	Lista análises
POST	/api/v1/analises	Cria nova análise
DELETE	/api/v1/analises	Limpa histórico
GET	/api/v1/analises/stats	Retorna estatísticas
Exemplo de requisição
POST /api/v1/analises
{
  "origem": "São Leopoldo",
  "destino": "Porto Alegre",
  "horario": "08:00",
  "clima": "chuva",
  "transporte": "onibus"
}
Exemplo de resposta
{
  "success": true,
  "message": "Análise criada com sucesso.",
  "data": {
    "origem": "São Leopoldo",
    "destino": "Porto Alegre",
    "horario": "08:00",
    "clima": "chuva",
    "transporte": "onibus",
    "tempoBase": 55,
    "trafego": "intenso",
    "risco": 82,
    "chanceLeve": 18,
    "classificacaoIA": "Cenário crítico",
    "melhorHorario": "06:30"
  }
}
Objetivo do projeto

Este projeto foi desenvolvido para demonstrar conhecimentos em:

lógica de programação
desenvolvimento full stack
arquitetura backend em camadas
criação e consumo de APIs
manipulação de dados em JSON
integração com mapas
integração com clima
visualização de dados em gráficos
persistência em banco de dados
organização profissional de código
versionamento com Git e GitHub
Roadmap técnico

Próximas evoluções planejadas:

autenticação de usuários
histórico por usuário
deploy completo da aplicação
dashboard com métricas avançadas
exportação de histórico
integração com banco relacional
previsões mais sofisticadas com IA ou machine learning
melhoria na precisão da recomendação com mais variáveis
Autor

Roberson de Oliveira

Desenvolvedor em formação com foco em backend, APIs REST e projetos práticos para portfólio.

Profissional em transição de carreira, com experiência anterior na área industrial e dedicação ao desenvolvimento de soluções reais para fortalecer sua trajetória em tecnologia.

Status do projeto

Em desenvolvimento 🚧

Projeto em evolução contínua, com foco em aprendizado prático, arquitetura profissional e fortalecimento de portfólio.
