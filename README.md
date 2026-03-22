# ViaLivre AI 🚦

Aplicação web full stack desenvolvida para simular condições de trânsito e recomendar o melhor horário para sair de casa com base em análise de cenário.

O sistema considera fatores como horário, clima e tipo de transporte para estimar tempo de trajeto, nível de trânsito e risco de atraso, ajudando o usuário a planejar melhor seus deslocamentos diários.

---

## Visão geral

O **ViaLivre AI** foi criado para resolver um problema comum da rotina urbana: a dificuldade de prever o melhor momento para sair de casa e evitar atrasos.

A aplicação utiliza uma lógica baseada em regras de decisão para gerar recomendações inteligentes a partir de variáveis informadas pelo usuário, como:

- origem
- destino
- horário
- clima
- meio de transporte

Com isso, o sistema apresenta uma estimativa prática e visual do cenário do trajeto.

---

## Demonstração

A interface foi planejada para oferecer uma experiência moderna, intuitiva e visual, incluindo:

- simulação de trajeto
- recomendação inteligente de saída
- histórico das análises realizadas
- gráfico de tempo estimado
- indicador visual de risco
- mapa interativo com origem e destino

---

## Problema resolvido

No dia a dia, muitas pessoas enfrentam incertezas como:

- quanto tempo o trajeto realmente vai levar
- se haverá trânsito intenso
- qual o melhor horário para sair
- como a chuva pode impactar o deslocamento
- qual o risco de chegar atrasado

O **ViaLivre AI** busca reduzir essa incerteza por meio de uma análise automatizada de cenário, transformando informações simples em uma recomendação objetiva e útil.

---

## Funcionalidades

### Simulação de trajeto

O usuário informa:

- origem
- destino
- horário
- clima
- tipo de transporte

Com base nesses dados, o sistema calcula:

- tempo estimado de trajeto
- nível de trânsito
- recomendação de saída
- pontuação de risco
- melhor horário sugerido

---

### Análise inteligente

A lógica da aplicação considera fatores como:

- horários de pico
- impacto da chuva no trânsito
- influência do transporte público no tempo de trajeto
- variação de cenário conforme horário e condições
- classificação de risco de atraso

#### Exemplo de análise

**Cenário crítico**
- Chance de atraso: **82%**
- Melhor horário sugerido: **06:00**
- Nível de trânsito: **intenso**

---

### Histórico de análises

As análises realizadas ficam registradas e podem ser consultadas rapidamente, exibindo:

- origem
- destino
- horário
- clima
- transporte
- tempo estimado
- nível de trânsito

---

### Visualização gráfica

A aplicação exibe um gráfico com a evolução do tempo estimado ao longo das análises realizadas, permitindo identificar padrões e comparar cenários de deslocamento.

---

### Medidor visual de risco

O sistema apresenta uma barra de risco com pontuação de **0 a 100**, facilitando a leitura da análise:

- **verde** → baixo risco
- **amarelo** → risco moderado
- **vermelho** → alto risco

---

### Mapa interativo

A aplicação utiliza **OpenStreetMap** com **Leaflet.js** para exibir visualmente a origem e o destino informados pelo usuário.

O zoom é ajustado automaticamente para melhorar a visualização dos pontos no mapa.

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

### Outros recursos
- API REST
- JSON
- Git
- GitHub

---

## Arquitetura do projeto

```bash
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

1. Clonar o repositório
git clone https://github.com/RobersonCodes/vialivre-ai.git
2. Acessar a pasta do backend
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

Ou utilize a extensão Live Server no VS Code.

Endpoints da API
Listar análises
GET /api/analises
Criar nova análise
POST /api/analises
Exemplo de body
{
  "origem": "São Leopoldo",
  "destino": "Porto Alegre",
  "horario": "08:00",
  "clima": "chuva",
  "transporte": "onibus"
}
Limpar histórico
DELETE /api/analises
Objetivos do projeto

Este projeto foi desenvolvido para demonstrar conhecimentos em:

lógica de programação
desenvolvimento full stack
criação e consumo de APIs
integração entre frontend e backend
organização profissional de código
manipulação de dados em JSON
visualização de informações em gráficos
integração com mapas
versionamento com Git e GitHub
boas práticas de estruturação de projetos
Melhorias futuras

Evoluções planejadas para as próximas versões:

integração com API de clima em tempo real
cálculo de rota real com API de mapas
autenticação de usuários
dashboard com métricas de uso
previsões baseadas em histórico
persistência em banco de dados relacional
deploy completo da aplicação
Autor

Roberson de Oliveira
Desenvolvedor em formação com foco em backend.

Profissional em transição de carreira, com experiência anterior na área industrial e dedicação ao desenvolvimento de projetos práticos para fortalecimento do portfólio em tecnologia.
