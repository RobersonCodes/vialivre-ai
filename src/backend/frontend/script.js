const API_BASE_URL = "http://localhost:3000/api/v1";

let historico = [];
let graficoTempo = null;
let mapa = null;
let camadaRota = null;
let camadaMarcadores = null;
let carregando = false;

let debounceOrigem = null;
let debounceDestino = null;

let criterioRankingAtual = "equilibrio";

let ultimoContextoComparacao = {
  horarios: null,
  transportes: null
};

const autocompleteState = {
  origem: {
    sugestoes: [],
    indiceAtivo: -1
  },
  destino: {
    sugestoes: [],
    indiceAtivo: -1
  }
};

/* =========================
   MAPA
========================= */
function inicializarMapa() {
  if (mapa) return;

  mapa = L.map("mapa", {
    zoomControl: true
  }).setView([-29.754994, -51.149445], 8);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(mapa);

  camadaRota = L.layerGroup().addTo(mapa);
  camadaMarcadores = L.layerGroup().addTo(mapa);
}

function desenharRotaNoMapa(origemCoords, destinoCoords, rota) {
  inicializarMapa();

  camadaRota.clearLayers();
  camadaMarcadores.clearLayers();

  const marcadorOrigem = L.marker([origemCoords.lat, origemCoords.lon])
    .addTo(camadaMarcadores)
    .bindPopup(`Origem: ${origemCoords.nome}`);

  const marcadorDestino = L.marker([destinoCoords.lat, destinoCoords.lon])
    .addTo(camadaMarcadores)
    .bindPopup(`Destino: ${destinoCoords.nome}`);

  const coordenadasLinha = rota.geometria.map(([lon, lat]) => [lat, lon]);

  const linha = L.polyline(coordenadasLinha, {
    weight: 5
  }).addTo(camadaRota);

  const grupo = L.featureGroup([marcadorOrigem, marcadorDestino, linha]);
  mapa.fitBounds(grupo.getBounds(), { padding: [30, 30] });
}

/* =========================
   FORMATADORES / UTILS
========================= */
function formatarTempo(minutos) {
  const valor = Number(minutos || 0);
  const horas = Math.floor(valor / 60);
  const mins = valor % 60;

  if (horas === 0) return `${mins} min`;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
}

function capitalizarTexto(texto) {
  if (!texto) return "--";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarHora(hora) {
  return `${String(hora).padStart(2, "0")}:00`;
}

function obterDataBaseLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function normalizarClimaManual(valor) {
  if (valor === "sol") return "limpo";
  if (valor === "chuva") return "chuva";
  if (valor === "garoa") return "garoa";
  if (valor === "tempestade") return "tempestade";
  return "nublado";
}

function obterClasseBadgeTrafego(trafego) {
  if (trafego === "intenso") return "alto";
  if (trafego === "moderado") return "medio";
  return "baixo";
}

function calcularMediaTempo() {
  if (historico.length === 0) return 0;

  const soma = historico.reduce((acc, item) => {
    return acc + Number(item.tempoBase || 0);
  }, 0);

  return Math.round(soma / historico.length);
}

function gerarSeveridade(risco) {
  if (risco >= 80) return "Extrema";
  if (risco >= 60) return "Alta";
  if (risco >= 40) return "Média";
  return "Baixa";
}

function classificarRisco(risco) {
  if (risco <= 30) return "Baixo";
  if (risco <= 60) return "Médio";
  if (risco <= 80) return "Alto";
  return "Muito alto";
}

function calcularConfiabilidade(risco, distanciaKm) {
  let confianca = 100;

  if (risco > 70) confianca -= 15;
  if (distanciaKm > 30) confianca -= 10;
  if (distanciaKm > 80) confianca -= 20;

  return Math.max(60, confianca);
}

function normalizarClasseTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escolherIndiceHoraMaisProxima(listaHoras, dataHoraAlvo) {
  if (!Array.isArray(listaHoras) || listaHoras.length === 0) return -1;

  const alvoMs = new Date(dataHoraAlvo).getTime();
  let melhorIndice = 0;
  let menorDiferenca = Infinity;

  listaHoras.forEach((horaIso, indice) => {
    const ms = new Date(horaIso).getTime();
    const diferenca = Math.abs(ms - alvoMs);

    if (diferenca < menorDiferenca) {
      menorDiferenca = diferenca;
      melhorIndice = indice;
    }
  });

  return melhorIndice;
}

function obterPerfilRota(transporte) {
  if (transporte === "bicicleta") return "cycling";
  if (transporte === "caminhar") return "walking";
  return "driving";
}

function calcularFaixaHorario(hora) {
  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) return "pico";

  if (
    (hora >= 6 && hora < 7) ||
    (hora > 9 && hora <= 10) ||
    (hora >= 16 && hora < 17) ||
    (hora > 19 && hora <= 20)
  ) {
    return "atencao";
  }

  return "livre";
}

function determinarTrafegoPorFaixa(faixaHorario) {
  if (faixaHorario === "pico") return "intenso";
  if (faixaHorario === "atencao") return "moderado";
  return "leve";
}

function calcularRisco(clima, transporte, tempo, faixaHorario = "livre") {
  let risco = 20;

  if (clima === "garoa") risco += 10;
  else if (clima === "chuva") risco += 20;
  else if (clima === "tempestade") risco += 35;
  else if (clima === "nublado" || clima === "parcialmente nublado") risco += 5;

  if (transporte === "moto") risco += 15;
  else if (transporte === "onibus") risco += 8;
  else if (transporte === "bicicleta") risco += 12;
  else if (transporte === "caminhar") risco += 6;

  if (faixaHorario === "pico") risco += 20;
  else if (faixaHorario === "atencao") risco += 10;

  if (tempo > 20) risco += 8;
  if (tempo > 40) risco += 10;
  if (tempo > 60) risco += 12;

  return Math.min(risco, 100);
}

function calcularTempoBase(rotaOuDuracao, clima, transporte, distanciaKmParam = null) {
  let distanciaKm = 0;

  if (typeof distanciaKmParam === "number" && !Number.isNaN(distanciaKmParam)) {
    distanciaKm = distanciaKmParam;
  } else if (rotaOuDuracao && typeof rotaOuDuracao.distanciaMetros === "number") {
    distanciaKm = rotaOuDuracao.distanciaMetros / 1000;
  } else {
    return 0;
  }

  const velocidadesMedias = {
    carro: 42,
    moto: 48,
    onibus: 24,
    bicicleta: 16,
    caminhar: 5
  };

  let tempoBase = (distanciaKm / (velocidadesMedias[transporte] || 40)) * 60;

  if (clima === "tempestade") tempoBase *= 1.35;
  else if (clima === "chuva") tempoBase *= 1.22;
  else if (clima === "garoa") tempoBase *= 1.1;
  else if (clima === "nublado" || clima === "parcialmente nublado") tempoBase *= 1.05;

  if (transporte === "onibus") tempoBase *= 1.15;
  if (transporte === "moto") tempoBase *= 0.92;

  return Math.max(1, Math.round(tempoBase));
}

function calcularScoreEquilibrio(tempo, risco) {
  return tempo * 0.45 + risco * 0.55;
}

function ordenarComparativo(lista, criterio) {
  const itens = [...lista];

  if (criterio === "tempo") {
    itens.sort((a, b) => {
      const tempoA = a.tempoBase ?? a.tempo ?? 0;
      const tempoB = b.tempoBase ?? b.tempo ?? 0;
      if (tempoA !== tempoB) return tempoA - tempoB;
      return a.risco - b.risco;
    });
    return itens;
  }

  if (criterio === "risco") {
    itens.sort((a, b) => {
      if (a.risco !== b.risco) return a.risco - b.risco;
      const tempoA = a.tempoBase ?? a.tempo ?? 0;
      const tempoB = b.tempoBase ?? b.tempo ?? 0;
      return tempoA - tempoB;
    });
    return itens;
  }

  itens.sort((a, b) => {
    const tempoA = a.tempoBase ?? a.tempo ?? 0;
    const tempoB = b.tempoBase ?? b.tempo ?? 0;
    const scoreA = calcularScoreEquilibrio(tempoA, a.risco);
    const scoreB = calcularScoreEquilibrio(tempoB, b.risco);

    if (scoreA !== scoreB) return scoreA - scoreB;
    return tempoA - tempoB;
  });

  return itens;
}

function obterTituloRanking(index) {
  if (index === 0) return "TOP 1";
  if (index === 1) return "TOP 2";
  if (index === 2) return "TOP 3";
  return "Boa alternativa";
}

/* =========================
   STATUS / UI
========================= */
function mostrarStatus(mensagem, tipo = "info") {
  const status = document.getElementById("mensagem-status");
  if (!status) return;

  if (!mensagem) {
    status.textContent = "";
    status.className = "status-msg hidden";
    return;
  }

  status.textContent = mensagem;
  status.className = `status-msg ${tipo}`;
}

function definirBotaoLoading(ativo, texto = "Analisar trajeto") {
  const botao = document.getElementById("btn-analisar");
  if (!botao) return;

  if (ativo) {
    botao.disabled = true;
    botao.innerHTML = `<span>IA analisando rota...</span>`;
  } else {
    botao.disabled = false;
    botao.innerHTML = `<span>${texto}</span>`;
  }
}

function animarEntradaResultado() {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  resultado.style.transform = "translateY(8px)";
  resultado.style.opacity = "0.55";

  requestAnimationFrame(() => {
    resultado.style.transition = "all 0.35s ease";
    resultado.style.transform = "translateY(0)";
    resultado.style.opacity = "1";
  });
}

function atualizarMedidorRisco(risco) {
  const fill = document.getElementById("risk-fill");
  const label = document.getElementById("risk-label");
  const percent = document.getElementById("risk-percent");

  if (!fill || !label || !percent) return;

  fill.style.width = `${risco}%`;
  fill.className = "risk-fill";

  if (risco >= 75) {
    fill.classList.add("alto");
    label.textContent = "Alto";
  } else if (risco >= 40) {
    fill.classList.add("medio");
    label.textContent = "Médio";
  } else {
    fill.classList.add("baixo");
    label.textContent = "Baixo";
  }

  percent.textContent = `${risco}%`;
}

/* =========================
   INSIGHTS / TABS
========================= */
function atualizarInsightsTopo({ melhorHorario, melhorModal, risco, status }) {
  const bestTime = document.getElementById("insight-best-time");
  const bestMode = document.getElementById("insight-best-mode");
  const riskAvg = document.getElementById("insight-risk-avg");
  const statusEl = document.getElementById("insight-status");

  if (bestTime) bestTime.textContent = melhorHorario || "--";
  if (bestMode) bestMode.textContent = melhorModal || "--";
  if (riskAvg) riskAvg.textContent = typeof risco === "number" ? `${risco}/100` : "--";
  if (statusEl) statusEl.textContent = status || "--";
}

function atualizarQuickInsights({ foco, modal, janela }) {
  const focus = document.getElementById("insight-focus");
  const modalEl = document.getElementById("insight-modal");
  const windowEl = document.getElementById("insight-window");

  if (focus) focus.textContent = foco || "--";
  if (modalEl) modalEl.textContent = modal || "--";
  if (windowEl) windowEl.textContent = janela || "--";
}

function configurarTabsResultado() {
  const tabs = document.querySelectorAll(".result-tab");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
    });
  });
}

/* =========================
   AUTOCOMPLETE
========================= */
function limparSugestoes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  container.classList.remove("show");

  if (containerId === "origem-sugestoes") {
    autocompleteState.origem.sugestoes = [];
    autocompleteState.origem.indiceAtivo = -1;
  }

  if (containerId === "destino-sugestoes") {
    autocompleteState.destino.sugestoes = [];
    autocompleteState.destino.indiceAtivo = -1;
  }
}

function destacarTrecho(texto, termo) {
  if (!termo) return texto;

  const escaped = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");

  return texto.replace(regex, "<strong>$1</strong>");
}

function obterEstadoAutocomplete(inputId) {
  return inputId === "origem" ? autocompleteState.origem : autocompleteState.destino;
}

function aplicarSugestao(inputId, containerId, index) {
  const input = document.getElementById(inputId);
  const estado = obterEstadoAutocomplete(inputId);

  if (!input) return;
  if (!estado.sugestoes[index]) return;

  input.value = estado.sugestoes[index].nome;
  limparSugestoes(containerId);
}

function atualizarItemAtivoVisual(containerId, indiceAtivo) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const itens = container.querySelectorAll(".autocomplete-item");

  itens.forEach((item, indice) => {
    if (indice === indiceAtivo) {
      item.classList.add("active");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("active");
    }
  });
}

function renderizarSugestoes(inputId, containerId, sugestoes) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  const estado = obterEstadoAutocomplete(inputId);

  if (!input || !container) return;

  const termo = input.value.trim();
  estado.sugestoes = sugestoes;
  estado.indiceAtivo = -1;

  if (!sugestoes.length) {
    limparSugestoes(containerId);
    return;
  }

  container.innerHTML = sugestoes.map((item, index) => {
    const texto = destacarTrecho(item.nome, termo);

    return `
      <div class="autocomplete-item" data-index="${index}">
        ${texto}
        <small>Lat: ${item.lat.toFixed(4)} | Lon: ${item.lon.toFixed(4)}</small>
      </div>
    `;
  }).join("");

  container.classList.add("show");

  container.querySelectorAll(".autocomplete-item").forEach((itemEl) => {
    itemEl.addEventListener("mouseenter", () => {
      const index = Number(itemEl.getAttribute("data-index"));
      estado.indiceAtivo = index;
      atualizarItemAtivoVisual(containerId, estado.indiceAtivo);
    });

    itemEl.addEventListener("click", () => {
      const index = Number(itemEl.getAttribute("data-index"));
      aplicarSugestao(inputId, containerId, index);
    });
  });
}

function moverSelecaoAutocomplete(inputId, containerId, direcao) {
  const estado = obterEstadoAutocomplete(inputId);
  if (!estado.sugestoes.length) return;

  if (direcao === "baixo") {
    estado.indiceAtivo++;
    if (estado.indiceAtivo >= estado.sugestoes.length) estado.indiceAtivo = 0;
  }

  if (direcao === "cima") {
    estado.indiceAtivo--;
    if (estado.indiceAtivo < 0) estado.indiceAtivo = estado.sugestoes.length - 1;
  }

  atualizarItemAtivoVisual(containerId, estado.indiceAtivo);
}

function selecionarItemAtivo(inputId, containerId) {
  const estado = obterEstadoAutocomplete(inputId);
  if (estado.indiceAtivo < 0 || !estado.sugestoes.length) return false;

  aplicarSugestao(inputId, containerId, estado.indiceAtivo);
  return true;
}

async function buscarSugestoesEndereco(termo) {
  if (!termo || termo.trim().length < 3) return [];

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1` +
    `&limit=5&q=${encodeURIComponent(termo)}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) throw new Error("Erro ao buscar sugestões.");

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    nome: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon)
  }));
}

async function carregarSugestoesComDebounce(inputId, containerId, valor) {
  if (valor.length < 3) {
    limparSugestoes(containerId);
    return;
  }

  try {
    const sugestoes = await buscarSugestoesEndereco(valor);
    renderizarSugestoes(inputId, containerId, sugestoes);
  } catch (error) {
    console.error(`Erro no autocomplete de ${inputId}:`, error);
    limparSugestoes(containerId);
  }
}

function configurarAutocomplete(inputId, containerId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener("input", () => {
    const valor = input.value.trim();

    if (inputId === "origem") {
      clearTimeout(debounceOrigem);
      debounceOrigem = setTimeout(() => {
        carregarSugestoesComDebounce(inputId, containerId, valor);
      }, 350);
    }

    if (inputId === "destino") {
      clearTimeout(debounceDestino);
      debounceDestino = setTimeout(() => {
        carregarSugestoesComDebounce(inputId, containerId, valor);
      }, 350);
    }
  });

  input.addEventListener("focus", async () => {
    const valor = input.value.trim();
    if (valor.length < 3) return;

    try {
      const sugestoes = await buscarSugestoesEndereco(valor);
      renderizarSugestoes(inputId, containerId, sugestoes);
    } catch (error) {
      console.error(`Erro ao reabrir sugestões de ${inputId}:`, error);
    }
  });

  input.addEventListener("keydown", (event) => {
    const estado = obterEstadoAutocomplete(inputId);
    const listaAberta = estado.sugestoes.length > 0;
    if (!listaAberta) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moverSelecaoAutocomplete(inputId, containerId, "baixo");
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moverSelecaoAutocomplete(inputId, containerId, "cima");
    }

    if (event.key === "Enter" && estado.indiceAtivo >= 0) {
      event.preventDefault();
      selecionarItemAtivo(inputId, containerId);
    }

    if (event.key === "Escape") limparSugestoes(containerId);
  });
}

function configurarFechamentoAutocomplete() {
  document.addEventListener("click", (event) => {
    const origemGroup = document.querySelector("#origem")?.closest(".autocomplete-group");
    const destinoGroup = document.querySelector("#destino")?.closest(".autocomplete-group");

    if (origemGroup && !origemGroup.contains(event.target)) limparSugestoes("origem-sugestoes");
    if (destinoGroup && !destinoGroup.contains(event.target)) limparSugestoes("destino-sugestoes");
  });
}

/* =========================
   APIS EXTERNAS
========================= */
async function buscarCoordenadas(local) {
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(local)}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) throw new Error("Erro ao buscar coordenadas.");

  const data = await response.json();
  if (!data || data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    nome: data[0].display_name
  };
}

async function calcularRotaReal(origemCoords, destinoCoords, transporte) {
  const profile = obterPerfilRota(transporte);

  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${origemCoords.lon},${origemCoords.lat};${destinoCoords.lon},${destinoCoords.lat}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro ao calcular rota.");

  const data = await response.json();
  if (!data.routes || data.routes.length === 0) return null;

  return {
    distanciaMetros: data.routes[0].distance,
    duracaoSegundos: data.routes[0].duration,
    geometria: data.routes[0].geometry.coordinates,
    profile
  };
}

function traduzirWeatherCode(codigo) {
  if (codigo === 0) return "limpo";
  if ([1, 2].includes(codigo)) return "parcialmente nublado";
  if ([3, 45, 48].includes(codigo)) return "nublado";
  if ([51, 53, 55].includes(codigo)) return "garoa";
  if ([56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return "chuva";
  if ([95, 96, 99].includes(codigo)) return "tempestade";
  return "nublado";
}

async function buscarClimaReal(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro ao buscar clima atual.");

  const data = await response.json();
  if (!data || !data.current) return null;

  const weatherCode = data.current.weather_code;

  return {
    temperatura: data.current.temperature_2m,
    codigo: weatherCode,
    condicao: traduzirWeatherCode(weatherCode)
  };
}

async function buscarClimaPrevistoPorHorario(lat, lon, horarioSelecionado) {
  const dataBase = obterDataBaseLocal();
  const dataHoraAlvo = `${dataBase}T${horarioSelecionado}:00`;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weather_code&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro ao buscar previsão por horário.");

  const data = await response.json();

  if (
    !data ||
    !data.hourly ||
    !Array.isArray(data.hourly.time) ||
    !Array.isArray(data.hourly.weather_code) ||
    !Array.isArray(data.hourly.temperature_2m)
  ) {
    return null;
  }

  const indice = escolherIndiceHoraMaisProxima(data.hourly.time, dataHoraAlvo);
  if (indice < 0) return null;

  const codigo = data.hourly.weather_code[indice];
  const temperatura = data.hourly.temperature_2m[indice];
  const horarioReferencia = data.hourly.time[indice];

  return {
    temperatura,
    codigo,
    condicao: traduzirWeatherCode(codigo),
    horarioReferencia
  };
}

/* =========================
   BACKEND / HISTÓRICO
========================= */
async function carregarHistorico() {
  try {
    const response = await fetch(`${API_BASE_URL}/analises`);
    if (!response.ok) throw new Error("Erro ao carregar histórico.");

    const data = await response.json();

    if (data?.data?.items && Array.isArray(data.data.items)) {
      historico = data.data.items;
    } else if (Array.isArray(data?.data)) {
      historico = data.data;
    } else if (Array.isArray(data)) {
      historico = data;
    } else {
      historico = [];
    }

    mostrarHistorico();
    atualizarEstatisticas();
    atualizarInsightsHistorico();
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    historico = [];
    mostrarHistorico();
    atualizarEstatisticas();
    atualizarInsightsHistorico();
  }
}

async function carregarStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/analises/stats`);
    if (!response.ok) return;

    const data = await response.json();
    if (!data?.data) return;

    const media = document.getElementById("stat-media");
    if (media && typeof data.data.riscoMedio === "number") {
      media.textContent = `${data.data.riscoMedio}%`;
    }
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error);
  }
}

function atualizarEstatisticas() {
  const total = document.getElementById("stat-total");
  const tempo = document.getElementById("stat-tempo");
  const trafego = document.getElementById("stat-trafego");
  const media = document.getElementById("stat-media");

  if (!total || !tempo || !trafego || !media) return;

  total.textContent = historico.length;

  if (historico.length === 0) {
    tempo.textContent = "--";
    trafego.textContent = "--";
    media.textContent = "--";
    return;
  }

  tempo.textContent = formatarTempo(Number(historico[0].tempoBase || 0));
  trafego.textContent = capitalizarTexto(historico[0].trafego || "--");
  media.textContent = formatarTempo(calcularMediaTempo());
}

function atualizarInsightsHistorico() {
  if (historico.length === 0) {
    atualizarInsightsTopo({
      melhorHorario: "--",
      melhorModal: "--",
      risco: null,
      status: "--"
    });
    return;
  }

  const ultimo = historico[0];
  atualizarInsightsTopo({
    melhorHorario: ultimo.melhorHorario || ultimo.horario || "--",
    melhorModal: capitalizarTexto(ultimo.transporte || "--"),
    risco: typeof ultimo.risco === "number" ? ultimo.risco : null,
    status: ultimo.classificacaoIA || classificarRisco(Number(ultimo.risco || 0))
  });
}

function mostrarHistorico() {
  const lista = document.getElementById("lista");
  if (!lista) return;

  lista.innerHTML = "";

  if (historico.length === 0) {
    lista.innerHTML = "<li>Nenhuma análise realizada ainda.</li>";
    gerarGrafico();
    return;
  }

  historico.forEach((item) => {
    const badgeClass = obterClasseBadgeTrafego(item.trafego);

    lista.innerHTML += `
      <li>
        <div class="historico-item-top">
          <strong>📍 ${item.origem} → ${item.destino}</strong>
          <span class="traffic-badge ${badgeClass}">${capitalizarTexto(item.trafego)}</span>
        </div>
        ⏰ Horário: ${item.horario} | 🌤️ Clima: ${item.clima} | 🚘 Transporte: ${item.transporte}<br>
        ${item.distanciaKm ? `📏 Distância: ${item.distanciaKm} km | ` : ""}
        🕒 Tempo: ${formatarTempo(Number(item.tempoBase || 0))} | 📉 Risco: ${item.risco ?? "--"}/100
      </li>
    `;
  });

  gerarGrafico();
}

function gerarGrafico() {
  const canvas = document.getElementById("grafico");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  const dados = historico.map((item) => Number(item.tempoBase || 0)).reverse();
  const labels = historico.map((_, i) => `Análise ${i + 1}`).reverse();

  if (graficoTempo) graficoTempo.destroy();

  graficoTempo = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Tempo estimado (min)",
          data: dados,
          borderWidth: 2,
          tension: 0.35,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/* =========================
   TOGGLE DE RANKING
========================= */
function configurarRankingToggle() {
  const botoes = document.querySelectorAll(".ranking-btn");
  if (!botoes.length) return;

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const criterio = botao.dataset.ranking;
      if (!criterio) return;

      criterioRankingAtual = criterio;

      document.querySelectorAll(".ranking-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.ranking === criterio);
      });

      if (ultimoContextoComparacao.horarios) {
        gerarComparacaoHorarios(
          ultimoContextoComparacao.horarios.horaBase,
          ultimoContextoComparacao.horarios.clima,
          ultimoContextoComparacao.horarios.transporte,
          ultimoContextoComparacao.horarios.duracaoSegundos,
          ultimoContextoComparacao.horarios.distanciaKm
        );
      }

      if (ultimoContextoComparacao.transportes) {
        gerarComparacaoTransportes(
          ultimoContextoComparacao.transportes.distanciaKm,
          ultimoContextoComparacao.transportes.clima,
          ultimoContextoComparacao.transportes.faixaHorario
        );
      }
    });
  });
}

/* =========================
   COMPARAÇÃO DE HORÁRIOS
========================= */
function gerarPontosMiniGraficoHorario(tempo, risco, faixaHorario) {
  const base = 34 - Math.min(18, tempo / 2.8);

  const variacoesPorFaixa = {
    pico: [6, 2, 8, 3, 6],
    atencao: [4, 1, 5, 2, 4],
    livre: [2, -1, 3, -1, 2]
  };

  const variacoes = variacoesPorFaixa[faixaHorario] || [3, 0, 4, 1, 3];
  const xs = [5, 30, 55, 80, 110];

  return xs.map((x, i) => {
    const y = Math.max(6, Math.min(36, base + variacoes[i] + risco / 18));
    return `${x},${y}`;
  }).join(" ");
}

function gerarComparacaoHorarios(horaBase, clima, transporte, duracaoSegundos, distanciaKm) {
  const container = document.getElementById("comparacao-horarios");
  if (!container) return;

  ultimoContextoComparacao.horarios = {
    horaBase,
    clima,
    transporte,
    duracaoSegundos,
    distanciaKm
  };

  const horarios = [
    Math.max(0, horaBase - 2),
    Math.max(0, horaBase - 1),
    horaBase,
    Math.min(23, horaBase + 1),
    Math.min(23, horaBase + 2)
  ];

  const unicos = [...new Set(horarios)];

  const cenarios = unicos.map((hora) => {
    const faixaHorario = calcularFaixaHorario(hora);
    const trafego = determinarTrafegoPorFaixa(faixaHorario);

    const tempoBase = calcularTempoBase(
      { distanciaMetros: distanciaKm * 1000, duracaoSegundos },
      clima,
      transporte,
      distanciaKm
    );

    const risco = calcularRisco(clima, transporte, tempoBase, faixaHorario);
    const confiabilidade = calcularConfiabilidade(risco, distanciaKm);

    return {
      hora,
      horario: formatarHora(hora),
      tempoBase,
      trafego,
      risco,
      confiabilidade,
      severidade: gerarSeveridade(risco),
      classificacao: classificarRisco(risco),
      faixaHorario
    };
  });

  const ordenados = ordenarComparativo(cenarios, criterioRankingAtual);
  const melhor = ordenados[0];
  const menorTempo = Math.min(...ordenados.map((c) => c.tempoBase));
  const menorRisco = Math.min(...ordenados.map((c) => c.risco));

  container.className = "schedule-grid";

  container.innerHTML = ordenados.map((item, index) => {
    let badge = obterTituloRanking(index);

    if (index > 2) {
      if (criterioRankingAtual === "tempo" && item.tempoBase === menorTempo) {
        badge = "Mais rápido";
      } else if (criterioRankingAtual === "risco" && item.risco === menorRisco) {
        badge = "Mais seguro";
      } else if (criterioRankingAtual === "equilibrio") {
        badge = "Melhor balanço";
      }
    }

    const pontos = gerarPontosMiniGraficoHorario(
      item.tempoBase,
      item.risco,
      item.faixaHorario
    );

    return `
      <article
        class="schedule-card schedule-${item.trafego} ${item.horario === melhor.horario ? "recommended" : ""}"
        style="animation-delay:${index * 120}ms"
      >
        <div class="schedule-glow"></div>

        <div class="schedule-top">
          <div class="schedule-hour">${item.horario}</div>

          <div class="schedule-meta">
            <h3>${badge}</h3>
            <span class="schedule-badge">${capitalizarTexto(item.trafego)}</span>
          </div>
        </div>

        <div class="schedule-main">
          <div class="schedule-time">${formatarTempo(item.tempoBase)}</div>

          <div class="schedule-risk-row">
            <span>Risco</span>
            <strong>${item.risco}/100</strong>
          </div>

          <div class="severity severity-${normalizarClasseTexto(item.severidade)}">
            ${item.severidade}
          </div>
        </div>

        <div class="schedule-chart">
          <svg viewBox="0 0 120 40">
            <polyline
              points="${pontos}"
              fill="none"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="schedule-footer">
          <span>🌤️ ${capitalizarTexto(clima)}</span>
          <span>🧠 ${item.confiabilidade}%</span>
          <span>📊 ${item.classificacao}</span>
        </div>
      </article>
    `;
  }).join("");
}

function obterMelhorModalParaDistancia(distanciaKm, clima, faixaHorario) {
  const transportes = ["carro", "moto", "onibus", "bicicleta", "caminhar"];

  const calculados = transportes.map((transporte) => {
    const tempoBase = calcularTempoBase(
      { distanciaMetros: distanciaKm * 1000 },
      clima,
      transporte,
      distanciaKm
    );
    const risco = calcularRisco(clima, transporte, tempoBase, faixaHorario);
    return { transporte, tempoBase, risco };
  });

  const ordenados = ordenarComparativo(calculados, criterioRankingAtual);
  return capitalizarTexto(ordenados[0]?.transporte || "--");
}

/* =========================
   COMPARAÇÃO DE TRANSPORTES
========================= */
function gerarPontosMiniGrafico(tempoBase, risco, tipo) {
  const variacaoPorTipo = {
    carro: [4, -2, 5, -1, 2],
    moto: [3, -4, 4, -2, 1],
    onibus: [6, 2, 7, 1, 3],
    bicicleta: [2, -1, 3, -2, 1],
    caminhar: [1, 0, 2, 0, 1]
  };

  const baseY = Math.max(10, 36 - Math.min(24, Math.round(tempoBase / 3)));
  const ajusteRisco = Math.min(10, Math.round(risco / 12));
  const variacoes = variacaoPorTipo[tipo] || [2, 0, 3, 1, 2];

  const ys = variacoes.map((v, i) => {
    const y = baseY + ajusteRisco + v + (i % 2 === 0 ? -2 : 2);
    return Math.max(8, Math.min(38, y));
  });

  const xs = [6, 30, 54, 78, 102];
  return xs.map((x, i) => `${x},${ys[i]}`).join(" ");
}

function obterSvgTransporte(tipo) {
  const icones = {
    carro: `
      <svg class="transport-svg icon-float" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 38l4-12c1.3-3.8 2.3-5 6-5h12c3.7 0 4.7 1.2 6 5l4 12" />
          <path d="M12 38h40v10a4 4 0 0 1-4 4h-4v-6H20v6h-4a4 4 0 0 1-4-4V38z" />
          <circle class="wheel wheel-left" cx="21" cy="47" r="4" />
          <circle class="wheel wheel-right" cx="43" cy="47" r="4" />
          <path d="M22 28h20" />
        </g>
      </svg>
    `,
    moto: `
      <svg class="transport-svg icon-float" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <circle class="wheel wheel-left" cx="20" cy="45" r="7" />
          <circle class="wheel wheel-right" cx="46" cy="45" r="7" />
          <path d="M20 45l10-12h8l8 12" />
          <path d="M33 24l5 9" />
          <path d="M27 30h14" />
          <path d="M39 24h8" />
        </g>
      </svg>
    `,
    onibus: `
      <svg class="transport-svg icon-float" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="16" y="16" width="32" height="28" rx="6" />
          <path d="M22 24h20" />
          <path d="M22 30h20" />
          <path d="M22 36h8" />
          <circle class="wheel wheel-left" cx="24" cy="48" r="4" />
          <circle class="wheel wheel-right" cx="40" cy="48" r="4" />
        </g>
      </svg>
    `,
    bicicleta: `
      <svg class="transport-svg icon-float" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <circle class="wheel wheel-left" cx="19" cy="45" r="8" />
          <circle class="wheel wheel-right" cx="45" cy="45" r="8" />
          <path d="M19 45l10-14h7l9 14" />
          <path d="M29 31l5 14" />
          <path d="M33 24h8" />
          <path d="M28 31h-6" />
        </g>
      </svg>
    `,
    caminhar: `
      <svg class="transport-svg icon-float" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="34" cy="14" r="5" />
          <path d="M34 20l-5 10 6 6" />
          <path d="M29 30l-8 10" />
          <path d="M35 26l10 6" />
          <path d="M35 36l-4 14" />
          <path d="M36 36l10 12" />
        </g>
      </svg>
    `
  };

  return icones[tipo] || "";
}

function gerarComparacaoTransportes(distanciaKm, clima, faixaHorario) {
  const container = document.getElementById("comparacao-transportes");
  if (!container) return;

  ultimoContextoComparacao.transportes = {
    distanciaKm,
    clima,
    faixaHorario
  };

  const transportes = [
    { chave: "carro", label: "Carro" },
    { chave: "moto", label: "Moto" },
    { chave: "onibus", label: "Ônibus" },
    { chave: "bicicleta", label: "Bicicleta" },
    { chave: "caminhar", label: "Caminhar" }
  ];

  const velocidadesMedias = {
    carro: 42,
    moto: 48,
    onibus: 24,
    bicicleta: 16,
    caminhar: 5
  };

  const comparativo = transportes.map((item) => {
    let tempoBase = (distanciaKm / velocidadesMedias[item.chave]) * 60;

    if (clima === "tempestade") tempoBase *= 1.35;
    else if (clima === "chuva") tempoBase *= 1.22;
    else if (clima === "garoa") tempoBase *= 1.1;
    else if (clima === "nublado" || clima === "parcialmente nublado") tempoBase *= 1.05;

    if (item.chave === "onibus") tempoBase *= 1.15;
    if (item.chave === "moto") tempoBase *= 0.92;

    tempoBase = Math.max(1, Math.round(tempoBase));

    const risco = calcularRisco(clima, item.chave, tempoBase, faixaHorario);
    const classificacao = classificarRisco(risco);
    const severidade = gerarSeveridade(risco);
    const confiabilidade = calcularConfiabilidade(risco, distanciaKm);

    return {
      ...item,
      tempoBase,
      risco,
      classificacao,
      severidade,
      confiabilidade
    };
  });

  const ordenados = ordenarComparativo(comparativo, criterioRankingAtual);
  const melhor = ordenados[0];
  const menorTempo = Math.min(...ordenados.map((item) => item.tempoBase));
  const menorRisco = Math.min(...ordenados.map((item) => item.risco));

  container.className = "transport-grid";

  container.innerHTML = `
    ${ordenados.map((item, index) => {
      let destaque = obterTituloRanking(index);

      if (index > 2) {
        if (criterioRankingAtual === "tempo" && item.tempoBase === menorTempo) {
          destaque = "Mais rápido";
        } else if (criterioRankingAtual === "risco" && item.risco === menorRisco) {
          destaque = "Mais seguro";
        } else if (criterioRankingAtual === "equilibrio") {
          destaque = "Melhor balanço";
        }
      }

      const pontosMini = gerarPontosMiniGrafico(item.tempoBase, item.risco, item.chave);

      return `
        <article
          class="transport-card transport-${item.chave} ${item.chave === melhor.chave ? "recommended" : ""}"
          style="animation-delay: ${index * 120}ms"
        >
          <div class="transport-glow"></div>

          <div class="transport-top">
            <div class="transport-icon-wrap">
              ${obterSvgTransporte(item.chave)}
            </div>

            <div class="transport-top-content">
              <h3>${item.label}</h3>
              <span class="transport-badge">${destaque}</span>
            </div>
          </div>

          <div class="transport-main">
            <div class="transport-time">${formatarTempo(item.tempoBase)}</div>
            <div class="transport-risk">
              <span>Risco</span>
              <strong>${item.risco}/100</strong>
            </div>
            <div class="transport-severity severity-${normalizarClasseTexto(item.severidade)}">
              ${item.severidade}
            </div>
          </div>

          <div class="transport-chart">
            <div class="transport-chart-header">
              <span>Tendência estimada</span>
              <small>${item.classificacao}</small>
            </div>

            <svg viewBox="0 0 120 44" class="mini-chart" aria-hidden="true">
              <defs>
                <linearGradient id="line-${item.chave}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
                  <stop offset="100%" stop-color="rgba(255,255,255,0.95)" />
                </linearGradient>
              </defs>
              <polyline
                points="${pontosMini}"
                fill="none"
                stroke="url(#line-${item.chave})"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="transport-footer">
            <span>🌤️ ${capitalizarTexto(clima)}</span>
            <span>🧠 ${item.confiabilidade}% de confiança</span>
          </div>
        </article>
      `;
    }).join("")}
  `;
}

/* =========================
   RESULTADO PRINCIPAL
========================= */
function mostrarResultado(analysis, meta = {}) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  const distanciaKm = Number(analysis.distanciaKm || 0);
  const confiancaIA = calcularConfiabilidade(analysis.risco, distanciaKm);
  const severidade = gerarSeveridade(analysis.risco);

  const descricaoFonteClima =
    meta.origemClima === "previsao"
      ? "Previsão para o horário selecionado"
      : meta.origemClima === "atual"
      ? "Clima atual da origem"
      : "Seleção manual";

  resultado.className = `resultado ${analysis.trafego || "neutro"}`;
  resultado.innerHTML = `
    <strong>📍 Origem:</strong> ${analysis.origem}<br>
    <strong>🎯 Destino:</strong> ${analysis.destino}<br>
    <strong>📏 Distância estimada:</strong> ${distanciaKm} km<br>
    <strong>⏰ Horário informado:</strong> ${analysis.horario}<br>
    <strong>🌤️ Clima considerado:</strong> ${analysis.clima}${meta.temperatura !== undefined ? ` (${meta.temperatura}°C)` : ""}<br>
    <strong>🧭 Fonte do clima:</strong> ${descricaoFonteClima}<br>
    ${
      meta.horarioReferencia
        ? `<strong>🕓 Horário da previsão:</strong> ${new Date(meta.horarioReferencia).toLocaleString("pt-BR")}<br>`
        : ""
    }
    <strong>🚘 Transporte:</strong> ${analysis.transporte}<br>
    <strong>🚦 Nível de trânsito:</strong> ${capitalizarTexto(analysis.trafego)}<br>
    <strong>🕒 Tempo estimado:</strong> ${formatarTempo(Number(analysis.tempoBase || 0))}<br>
    <strong>📉 Pontuação de risco:</strong> ${analysis.risco}/100<br>
    <strong>⚠️ Severidade:</strong> ${severidade}<br>
    <strong>🧠 Classificação da IA:</strong> ${analysis.classificacaoIA || classificarRisco(Number(analysis.risco || 0))}<br>
    <strong>📊 Confiabilidade estimada:</strong> ${confiancaIA}%<br>
    <strong>✅ Chance de trânsito leve:</strong> ${analysis.chanceLeve ?? "--"}%<br>
    <strong>⏳ Melhor horário sugerido:</strong> ${analysis.melhorHorario || "Horário atual adequado"}<br><br>
    <strong>📢 Recomendação:</strong> ${analysis.mensagem || "Análise concluída."}
  `;

  animarEntradaResultado();
  atualizarMedidorRisco(Number(analysis.risco || 0));

  const statTempo = document.getElementById("stat-tempo");
  const statTrafego = document.getElementById("stat-trafego");

  if (statTempo) statTempo.textContent = formatarTempo(Number(analysis.tempoBase || 0));
  if (statTrafego) statTrafego.textContent = capitalizarTexto(analysis.trafego || "--");

  const melhorModal = obterMelhorModalParaDistancia(
    distanciaKm,
    analysis.clima,
    calcularFaixaHorario(parseInt(analysis.horario.split(":")[0], 10))
  );

  atualizarQuickInsights({
    foco:
      analysis.risco >= 70
        ? "Antecipar saída"
        : analysis.risco >= 40
        ? "Monitorar trânsito"
        : "Seguir plano",
    modal: melhorModal,
    janela: analysis.melhorHorario || analysis.horario
  });

  atualizarInsightsTopo({
    melhorHorario: analysis.melhorHorario || analysis.horario,
    melhorModal,
    risco: Number(analysis.risco || 0),
    status: analysis.classificacaoIA || classificarRisco(Number(analysis.risco || 0))
  });
}

/* =========================
   FLUXO PRINCIPAL
========================= */
async function analisar() {
  if (carregando) return;

  limparSugestoes("origem-sugestoes");
  limparSugestoes("destino-sugestoes");

  const origem = document.getElementById("origem")?.value.trim();
  const destino = document.getElementById("destino")?.value.trim();
  const horario = document.getElementById("horario")?.value;
  const transporte = document.getElementById("transporte")?.value;
  const climaManual = document.getElementById("clima")?.value;
  const resultado = document.getElementById("resultado");

  if (!resultado) return;

  if (!origem || !destino || !horario || !transporte) {
    resultado.className = "resultado neutro";
    resultado.innerHTML = "Preencha origem, destino, horário e transporte para fazer a análise.";
    mostrarStatus("Campos obrigatórios não preenchidos.", "erro");
    return;
  }

  try {
    carregando = true;
    definirBotaoLoading(true);
    mostrarStatus("IA analisando rota, clima e risco de atraso...", "info");

    resultado.className = "resultado neutro";
    resultado.innerHTML = "Calculando rota, previsão climática e score inteligente de risco...";

    const origemCoords = await buscarCoordenadas(origem);
    const destinoCoords = await buscarCoordenadas(destino);

    if (!origemCoords || !destinoCoords) {
      resultado.innerHTML = "Não foi possível localizar a origem ou o destino informado.";
      mostrarStatus("Localização não encontrada.", "erro");
      return;
    }

    const rota = await calcularRotaReal(origemCoords, destinoCoords, transporte);

    if (!rota) {
      resultado.innerHTML = "Não foi possível calcular a rota real.";
      mostrarStatus("Falha ao calcular rota.", "erro");
      return;
    }

    let clima = normalizarClimaManual(climaManual || "nublado");
    let climaInfo = null;
    let origemClima = "manual";

    try {
      climaInfo = await buscarClimaPrevistoPorHorario(
        origemCoords.lat,
        origemCoords.lon,
        horario
      );

      if (climaInfo?.condicao) {
        clima = climaInfo.condicao;
        origemClima = "previsao";
      }
    } catch (error) {
      console.warn("Não foi possível obter previsão por horário:", error);
    }

    if (origemClima === "manual") {
      try {
        const climaAtual = await buscarClimaReal(origemCoords.lat, origemCoords.lon);
        if (climaAtual?.condicao) {
          clima = climaAtual.condicao;
          climaInfo = climaAtual;
          origemClima = "atual";
        }
      } catch (error) {
        console.warn("Não foi possível obter clima atual:", error);
      }
    }

    const hora = parseInt(horario.split(":")[0], 10);
    const faixaHorario = calcularFaixaHorario(hora);
    const trafego = determinarTrafegoPorFaixa(faixaHorario);
    const distanciaKm = Number((rota.distanciaMetros / 1000).toFixed(1));
    const tempoBase = calcularTempoBase(rota, clima, transporte, distanciaKm);
    const risco = calcularRisco(clima, transporte, tempoBase, faixaHorario);
    const classificacaoIA = classificarRisco(risco);

    const chanceLeve =
      trafego === "leve" ? 85 :
      trafego === "moderado" ? 55 : 25;

    const melhorHorario =
      faixaHorario === "pico"
        ? hora + 1 <= 23
          ? `${formatarHora(hora + 1)}`
          : "Aguarde redução do pico"
        : "Horário atual adequado";

    let mensagem = "Rota analisada com sucesso.";

    if (risco >= 80) {
      mensagem = "Risco muito alto de atraso. Considere sair antes ou mudar o trajeto.";
    } else if (risco >= 60) {
      mensagem = "Atenção: há risco elevado de lentidão no percurso.";
    } else if (risco >= 40) {
      mensagem = "Trajeto razoável, mas com pontos de atenção.";
    } else {
      mensagem = "Boa condição para seguir no horário informado.";
    }

    const payload = {
      origem,
      destino,
      horario,
      clima,
      transporte,
      distanciaKm,
      tempoBase,
      trafego,
      risco,
      classificacaoIA,
      chanceLeve,
      melhorHorario,
      mensagem
    };

    const salvarResponse = await fetch(`${API_BASE_URL}/analises`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const salvarJson = await salvarResponse.json();

    if (!salvarResponse.ok) {
      throw new Error(salvarJson?.message || "Erro ao salvar análise.");
    }

    const analysis = salvarJson?.data || payload;

    mostrarResultado(analysis, {
      origemClima,
      temperatura: climaInfo?.temperatura,
      horarioReferencia: climaInfo?.horarioReferencia
    });

    desenharRotaNoMapa(origemCoords, destinoCoords, rota);
    gerarComparacaoHorarios(hora, clima, transporte, rota.duracaoSegundos, distanciaKm);
    gerarComparacaoTransportes(distanciaKm, clima, faixaHorario);

    await carregarHistorico();
    await carregarStats();

    mostrarStatus("Análise concluída com sucesso.", "sucesso");
  } catch (error) {
    console.error("Erro na análise:", error);
    resultado.className = "resultado neutro";
    resultado.innerHTML = "Ocorreu um erro ao realizar a análise. Tente novamente.";
    mostrarStatus(error.message || "Erro ao processar análise.", "erro");
  } finally {
    carregando = false;
    definirBotaoLoading(false);
  }
}

async function limparHistorico() {
  try {
    const response = await fetch(`${API_BASE_URL}/analises`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Erro ao limpar histórico.");

    await carregarHistorico();
    await carregarStats();
    atualizarMedidorRisco(0);
    mostrarStatus("Histórico limpo com sucesso.", "sucesso");

    ultimoContextoComparacao.horarios = null;
    ultimoContextoComparacao.transportes = null;

    const comparacao = document.getElementById("comparacao-horarios");
    if (comparacao) {
      comparacao.className = "resultado neutro";
      comparacao.innerHTML = "A comparação automática aparecerá aqui.";
    }

    const comparacaoTransportes = document.getElementById("comparacao-transportes");
    if (comparacaoTransportes) {
      comparacaoTransportes.className = "resultado neutro";
      comparacaoTransportes.innerHTML = "A comparação entre transportes aparecerá aqui.";
    }

    const resultado = document.getElementById("resultado");
    if (resultado) {
      resultado.className = "resultado neutro";
      resultado.innerHTML = "A recomendação aparecerá aqui.";
    }

    atualizarQuickInsights({
      foco: "--",
      modal: "--",
      janela: "--"
    });

    atualizarInsightsTopo({
      melhorHorario: "--",
      melhorModal: "--",
      risco: null,
      status: "--"
    });

    const statTempo = document.getElementById("stat-tempo");
    const statTrafego = document.getElementById("stat-trafego");
    const statMedia = document.getElementById("stat-media");

    if (statTempo) statTempo.textContent = "--";
    if (statTrafego) statTrafego.textContent = "--";
    if (statMedia) statMedia.textContent = "--";

    if (camadaRota) camadaRota.clearLayers();
    if (camadaMarcadores) camadaMarcadores.clearLayers();
  } catch (error) {
    console.error("Erro ao limpar histórico:", error);
    mostrarStatus("Erro ao limpar histórico.", "erro");
  }
}
/* =========================
   GPS - MINHA LOCALIZAÇÃO
========================= */
async function obterEnderecoPorCoordenadas(lat, lon) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("Erro ao converter localização em endereço.");
  }

  const data = await response.json();

  return {
    nome: data.display_name || `${lat}, ${lon}`,
    lat: parseFloat(lat),
    lon: parseFloat(lon)
  };
}

function definirEstadoBotaoMinhaLocalizacao(carregando = false) {
  const botao = document.getElementById("btn-minha-localizacao");
  if (!botao) return;

  if (carregando) {
    botao.disabled = true;
    botao.innerHTML = `
      <span class="btn-location-icon">⏳</span>
      <span class="btn-location-text">Localizando...</span>
    `;
    return;
  }

  botao.disabled = false;
  botao.innerHTML = `
    <span class="btn-location-icon">📍</span>
    <span class="btn-location-text">Minha localização</span>
  `;
}

async function usarMinhaLocalizacaoComoOrigem() {
  const inputOrigem = document.getElementById("origem");
  const inputDestino = document.getElementById("destino");

  if (!inputOrigem) return;

  if (!navigator.geolocation) {
    mostrarStatus("Seu navegador não suporta geolocalização.", "erro");
    return;
  }

  definirEstadoBotaoMinhaLocalizacao(true);
  mostrarStatus("Obtendo sua localização atual...", "info");

  navigator.geolocation.getCurrentPosition(
    async (posicao) => {
      try {
        const lat = posicao.coords.latitude;
        const lon = posicao.coords.longitude;

        const endereco = await obterEnderecoPorCoordenadas(lat, lon);

        inputOrigem.value = endereco.nome;

        limparSugestoes("origem-sugestoes");

        inicializarMapa();

        if (camadaMarcadores) camadaMarcadores.clearLayers();
        if (camadaRota) camadaRota.clearLayers();

        L.marker([lat, lon])
          .addTo(camadaMarcadores)
          .bindPopup(`Origem atual: ${endereco.nome}`)
          .openPopup();

        mapa.setView([lat, lon], 15);

        mostrarStatus("Origem preenchida com sua localização atual.", "sucesso");

        if (inputDestino && inputDestino.value.trim()) {
          mostrarStatus("Origem preenchida. Gerando análise automática...", "info");
          await analisar();
        }
      } catch (erro) {
        console.error("Erro ao converter localização:", erro);
        mostrarStatus("Não foi possível preencher a origem automaticamente.", "erro");
      } finally {
        definirEstadoBotaoMinhaLocalizacao(false);
      }
    },
    (erro) => {
      console.error("Erro de geolocalização:", erro);

      let mensagem = "Não foi possível acessar sua localização.";

      if (erro.code === 1) {
        mensagem = "Permissão de localização negada.";
      } else if (erro.code === 2) {
        mensagem = "Localização indisponível no momento.";
      } else if (erro.code === 3) {
        mensagem = "Tempo esgotado ao tentar obter sua localização.";
      }

      mostrarStatus(mensagem, "erro");
      definirEstadoBotaoMinhaLocalizacao(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function configurarBotaoMinhaLocalizacao() {
  const botao = document.getElementById("btn-minha-localizacao");
  if (!botao) return;

  botao.addEventListener("click", usarMinhaLocalizacaoComoOrigem);
}
function obterModoGoogleMaps(transporte) {
  if (transporte === "caminhar") return "walking";
  if (transporte === "bicicleta") return "bicycling";
  if (transporte === "onibus") return "transit";
  return "driving";
}

function abrirNavegacaoGoogleMaps(latOrigem, lonOrigem, destinoTexto, transporte) {
  const modo = obterModoGoogleMaps(transporte);

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(`${latOrigem},${lonOrigem}`)}` +
    `&destination=${encodeURIComponent(destinoTexto)}` +
    `&travelmode=${encodeURIComponent(modo)}`;

  window.open(url, "_blank");
}

function configurarBotaoNavegarGps() {
  const botao = document.getElementById("btn-navegar-gps");
  const destinoInput = document.getElementById("destino");
  const transporteSelect = document.getElementById("transporte");

  if (!botao || !destinoInput || !transporteSelect) return;

  botao.addEventListener("click", () => {
    const destino = destinoInput.value.trim();
    const transporte = transporteSelect.value;

    if (!destino) {
      mostrarStatus("Informe o destino para iniciar a navegação com GPS.", "erro");
      return;
    }

    if (!navigator.geolocation) {
      mostrarStatus("Seu navegador não suporta geolocalização.", "erro");
      return;
    }

    botao.disabled = true;
    botao.innerHTML = "<span>Localizando para navegar...</span>";
    mostrarStatus("Obtendo sua localização para iniciar a navegação...", "info");

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const lat = posicao.coords.latitude;
        const lon = posicao.coords.longitude;

        abrirNavegacaoGoogleMaps(lat, lon, destino, transporte);

        mostrarStatus("Navegação aberta com sua localização atual.", "sucesso");
        botao.disabled = false;
        botao.innerHTML = "<span>🧭 Navegar com GPS</span>";
      },
      (erro) => {
        console.error("Erro ao obter GPS para navegação:", erro);

        let mensagem = "Não foi possível obter sua localização para navegação.";

        if (erro.code === 1) mensagem = "Permissão de localização negada.";
        if (erro.code === 2) mensagem = "Localização indisponível.";
        if (erro.code === 3) mensagem = "Tempo esgotado ao obter localização.";

        mostrarStatus(mensagem, "erro");
        botao.disabled = false;
        botao.innerHTML = "<span>🧭 Navegar com GPS</span>";
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-analise");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await analisar();
    });
  }

  configurarAutocomplete("origem", "origem-sugestoes");
  configurarAutocomplete("destino", "destino-sugestoes");
  configurarFechamentoAutocomplete();
  configurarRankingToggle();
  configurarTabsResultado();
  configurarBotaoMinhaLocalizacao();
  configurarBotaoNavegarGps();

  carregarHistorico();
  carregarStats();
  atualizarMedidorRisco(0);

  atualizarQuickInsights({
    foco: "--",
    modal: "--",
    janela: "--"
  });

  atualizarInsightsTopo({
    melhorHorario: "--",
    melhorModal: "--",
    risco: null,
    status: "--"
  });

  inicializarMapa();
});