const API_BASE_URL = "http://localhost:3000/api/v1";

let historico = [];
let graficoTempo = null;
let mapa = null;
let camadaRota = null;
let camadaMarcadores = null;
let carregando = false;

/* =========================
   MAPA
========================= */
function inicializarMapa() {
  if (mapa) return;

  mapa = L.map("mapa").setView([-29.754994, -51.149445], 7);

  L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(mapa);

  camadaRota = L.layerGroup().addTo(mapa);
  camadaMarcadores = L.layerGroup().addTo(mapa);
}

/* =========================
   FORMATADORES
========================= */
function formatarTempo(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (horas === 0) return `${mins} min`;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
}

function formatarHora(hora) {
  return `${String(hora).padStart(2, "0")}:00`;
}

function capitalizarTexto(texto) {
  if (!texto) return "--";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* =========================
   STATUS
========================= */
function mostrarStatus(mensagem, tipo = "info") {
  const status = document.getElementById("mensagem-status");
  if (!status) return;

  status.textContent = mensagem;
  status.className = `status-msg ${tipo}`;

  if (!mensagem) {
    status.classList.add("hidden");
  } else {
    status.classList.remove("hidden");
  }
}

/* =========================
   UTILITÁRIOS
========================= */
function normalizarClimaManual(valor) {
  if (valor === "sol") return "limpo";
  if (valor === "chuva") return "chuva";
  return "nublado";
}

function gerarSeveridade(risco) {
  if (risco >= 80) return "Extrema";
  if (risco >= 60) return "Alta";
  if (risco >= 40) return "Média";
  return "Baixa";
}

function calcularConfiabilidade(risco, distanciaKm) {
  let confianca = 100;

  if (risco > 70) confianca -= 15;
  if (distanciaKm > 30) confianca -= 10;
  if (distanciaKm > 80) confianca -= 20;

  return Math.max(60, confianca);
}

function calcularMediaTempo() {
  if (historico.length === 0) return 0;

  const soma = historico.reduce(
    (acc, item) => acc + Number(item.tempoBase || 0),
    0
  );

  return Math.round(soma / historico.length);
}

function obterClasseBadgeTrafego(trafego) {
  if (trafego === "intenso") return "alto";
  if (trafego === "moderado") return "medio";
  return "baixo";
}

function obterDataBaseLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
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

/* =========================
   APIS EXTERNAS
========================= */
async function buscarCoordenadas(local) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(local)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar coordenadas.");
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    nome: data[0].display_name
  };
}

async function calcularRotaReal(origemCoords, destinoCoords) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origemCoords.lon},${origemCoords.lat};${destinoCoords.lon},${destinoCoords.lat}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao calcular rota.");
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    return null;
  }

  return {
    distanciaMetros: data.routes[0].distance,
    duracaoSegundos: data.routes[0].duration,
    geometria: data.routes[0].geometry.coordinates
  };
}

async function buscarClimaReal(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar clima atual.");
  }

  const data = await response.json();

  if (!data || !data.current) {
    return null;
  }

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

  if (!response.ok) {
    throw new Error("Erro ao buscar previsão por horário.");
  }

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

  if (indice < 0) {
    return null;
  }

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

function traduzirWeatherCode(codigo) {
  if (codigo === 0) return "limpo";
  if ([1, 2].includes(codigo)) return "parcialmente nublado";
  if ([3, 45, 48].includes(codigo)) return "nublado";
  if ([51, 53, 55].includes(codigo)) return "garoa";
  if ([56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return "chuva";
  if ([95, 96, 99].includes(codigo)) return "tempestade";
  return "nublado";
}

/* =========================
   MAPA
========================= */
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
   BACKEND / HISTÓRICO
========================= */
async function carregarHistorico() {
  try {
    const response = await fetch(`${API_BASE_URL}/analises`);

    if (!response.ok) {
      throw new Error("Erro ao carregar histórico.");
    }

    const data = await response.json();

    if (data?.data?.items && Array.isArray(data.data.items)) {
      historico = data.data.items;
    } else if (data?.data && Array.isArray(data.data)) {
      historico = data.data;
    } else if (Array.isArray(data)) {
      historico = data;
    } else {
      historico = [];
    }

    mostrarHistorico();
    atualizarEstatisticas();
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    historico = [];
    mostrarHistorico();
    atualizarEstatisticas();
  }
}

async function carregarStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/analises/stats`);

    if (!response.ok) {
      return;
    }

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

/* =========================
   IA DE TRÁFEGO
========================= */
function calcularFaixaHorario(hora) {
  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) {
    return "pico";
  }

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

function calcularRisco(clima, transporte, faixaHorario) {
  let risco = 15;

  const pesosHorario = {
    pico: 50,
    atencao: 25,
    livre: 5
  };

  const pesosClima = {
    limpo: 0,
    nublado: 8,
    "parcialmente nublado": 5,
    garoa: 12,
    chuva: 20,
    tempestade: 35
  };

  const pesosTransporte = {
    carro: 8,
    onibus: 15,
    moto: -5
  };

  risco += pesosHorario[faixaHorario] || 0;
  risco += pesosClima[clima] || 10;
  risco += pesosTransporte[transporte] || 5;

  return Math.max(0, Math.min(100, Math.round(risco)));
}

function gerarChanceLeve(risco) {
  const chance = 100 - risco;
  return chance < 5 ? 5 : chance;
}

function gerarClassificacaoIA(risco) {
  if (risco >= 75) return "Cenário crítico";
  if (risco >= 50) return "Cenário de atenção";
  if (risco >= 30) return "Cenário moderado";
  return "Cenário favorável";
}

function sugerirMelhorHorario(hora, faixaHorario, clima, risco) {
  let ajuste = 0;

  if (faixaHorario === "pico") {
    ajuste -= 1;
  } else if (faixaHorario === "atencao") {
    ajuste -= 0.5;
  }

  if (clima === "chuva") {
    ajuste -= 0.5;
  }

  if (clima === "tempestade") {
    ajuste -= 1;
  }

  if (risco >= 80) {
    ajuste -= 0.5;
  }

  const novaHora = Math.max(0, Math.min(23, hora + ajuste));

  if (novaHora === hora) {
    return "Horário atual adequado";
  }

  const minutos = ajuste % 1 !== 0 ? 30 : 0;

  return `${String(Math.floor(novaHora)).padStart(2, "0")}:${minutos === 0 ? "00" : "30"}`;
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

function calcularTempoBase(duracaoSegundos, clima, transporte) {
  let tempoBase = Math.round(duracaoSegundos / 60);

  if (clima === "tempestade") {
    tempoBase += 20;
  } else if (clima === "chuva") {
    tempoBase += 15;
  } else if (clima === "garoa") {
    tempoBase += 10;
  } else if (clima === "nublado" || clima === "parcialmente nublado") {
    tempoBase += 5;
  }

  if (transporte === "moto") {
    tempoBase -= 5;
  } else if (transporte === "onibus") {
    tempoBase += 10;
  }

  if (tempoBase < 10) {
    tempoBase = 10;
  }

  return tempoBase;
}

function calcularCenario(hora, clima, transporte, duracaoSegundos) {
  const faixaHorario = calcularFaixaHorario(hora);

  let trafego = "";
  if (faixaHorario === "pico") {
    trafego = "intenso";
  } else if (faixaHorario === "atencao") {
    trafego = "moderado";
  } else {
    trafego = "leve";
  }

  const tempoBase = calcularTempoBase(duracaoSegundos, clima, transporte);
  const risco = calcularRisco(clima, transporte, faixaHorario);
  const classificacaoIA = gerarClassificacaoIA(risco);

  return {
    hora,
    horario: formatarHora(hora),
    tempoBase,
    trafego,
    risco,
    classificacaoIA
  };
}

function gerarComparacaoHorarios(horaBase, clima, transporte, duracaoSegundos) {
  const container = document.getElementById("comparacao-horarios");
  if (!container) return;

  const horarios = [
    Math.max(0, horaBase - 2),
    Math.max(0, horaBase - 1),
    horaBase,
    Math.min(23, horaBase + 1),
    Math.min(23, horaBase + 2)
  ];

  const unicos = [...new Set(horarios)];

  const cenarios = unicos.map((hora) =>
    calcularCenario(hora, clima, transporte, duracaoSegundos)
  );

  cenarios.sort((a, b) => {
    if (a.risco !== b.risco) return a.risco - b.risco;
    return a.tempoBase - b.tempoBase;
  });

  const melhor = cenarios[0];

  container.className = "resultado neutro";
  container.innerHTML = `
    <strong>Melhor opção encontrada:</strong> ${melhor.horario}<br>
    <strong>Risco:</strong> ${melhor.risco}/100<br>
    <strong>Tempo estimado:</strong> ${formatarTempo(melhor.tempoBase)}<br>
    <strong>Classificação:</strong> ${melhor.classificacaoIA}<br><br>
    <strong>Comparação:</strong><br>
    ${cenarios
      .map(
        (c) =>
          `• ${c.horario} → ${formatarTempo(c.tempoBase)} | risco ${c.risco}/100 | ${c.trafego}`
      )
      .join("<br>")}
  `;
}

function gerarMensagemRecomendacao(trafego, clima, transporte) {
  if (trafego === "intenso" && clima === "tempestade") {
    return "Condição crítica de deslocamento. O ideal é sair com bastante antecedência e acompanhar mudanças no trajeto.";
  }

  if (trafego === "intenso" && clima === "chuva" && transporte === "onibus") {
    return "Trânsito intenso com chuva. Para ônibus, o ideal é sair 30 minutos antes.";
  }

  if (trafego === "intenso" && (clima === "chuva" || clima === "garoa")) {
    return "Trânsito intenso com chuva. O ideal é sair 25 a 30 minutos antes.";
  }

  if (trafego === "intenso") {
    return "Trânsito intenso. Recomendamos sair com pelo menos 20 minutos de antecedência.";
  }

  if (trafego === "moderado" && (clima === "chuva" || clima === "garoa")) {
    return "Trânsito moderado com chuva. Considere sair 15 minutos antes.";
  }

  if (trafego === "moderado") {
    return "Trânsito moderado. Considere sair 10 minutos antes.";
  }

  return "Trânsito tranquilo. Você pode sair no horário planejado.";
}

/* =========================
   FLUXO PRINCIPAL
========================= */
async function analisar() {
  if (carregando) return;

  const botao = document.getElementById("btn-analisar");
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

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Analisando...";
    }

    mostrarStatus("Buscando rota, previsão do clima e gerando recomendação...", "info");

    resultado.className = "resultado neutro";
    resultado.innerHTML = "Calculando rota e previsão climática, aguarde...";

    const origemCoords = await buscarCoordenadas(origem);
    const destinoCoords = await buscarCoordenadas(destino);

    if (!origemCoords || !destinoCoords) {
      resultado.className = "resultado neutro";
      resultado.innerHTML = "Não foi possível localizar uma das cidades informadas.";
      mostrarStatus("Localização não encontrada.", "erro");
      return;
    }

    const rota = await calcularRotaReal(origemCoords, destinoCoords);

    if (!rota) {
      resultado.className = "resultado neutro";
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

    let trafego = "";
    if (faixaHorario === "pico") {
      trafego = "intenso";
    } else if (faixaHorario === "atencao") {
      trafego = "moderado";
    } else {
      trafego = "leve";
    }

    const distanciaKm = Number((rota.distanciaMetros / 1000).toFixed(1));
    const tempoBase = calcularTempoBase(rota.duracaoSegundos, clima, transporte);
    const risco = calcularRisco(clima, transporte, faixaHorario);
    const chanceLeve = gerarChanceLeve(risco);
    const classificacaoIA = gerarClassificacaoIA(risco);
    const melhorHorario = sugerirMelhorHorario(hora, faixaHorario, clima, risco);
    const confiancaIA = calcularConfiabilidade(risco, distanciaKm);
    const severidade = gerarSeveridade(risco);
    const mensagem = gerarMensagemRecomendacao(trafego, clima, transporte);

    const descricaoFonteClima =
      origemClima === "previsao"
        ? "Previsão para o horário selecionado"
        : origemClima === "atual"
        ? "Clima atual da origem"
        : "Seleção manual";

    resultado.className = `resultado ${trafego}`;
    resultado.innerHTML = `
      <strong>📍 Origem:</strong> ${origem}<br>
      <strong>🎯 Destino:</strong> ${destino}<br>
      <strong>📏 Distância real:</strong> ${distanciaKm} km<br>
      <strong>⏰ Horário informado:</strong> ${horario}<br>
      <strong>🌤️ Clima considerado:</strong> ${clima}${climaInfo?.temperatura !== undefined ? ` (${climaInfo.temperatura}°C)` : ""}<br>
      <strong>🧭 Fonte do clima:</strong> ${descricaoFonteClima}<br>
      ${
        climaInfo?.horarioReferencia
          ? `<strong>🕓 Horário da previsão:</strong> ${new Date(climaInfo.horarioReferencia).toLocaleString("pt-BR")}<br>`
          : ""
      }
      <strong>🚘 Transporte:</strong> ${transporte}<br>
      <strong>🚦 Nível de trânsito:</strong> ${trafego}<br>
      <strong>🕒 Tempo real estimado:</strong> ${formatarTempo(tempoBase)}<br>
      <strong>📉 Pontuação de risco:</strong> ${risco}/100<br>
      <strong>⚠️ Severidade:</strong> ${severidade}<br>
      <strong>🧠 Classificação inteligente:</strong> ${classificacaoIA}<br>
      <strong>📊 Confiabilidade da previsão:</strong> ${confiancaIA}%<br>
      <strong>✅ Chance de trânsito leve:</strong> ${chanceLeve}%<br>
      <strong>⏳ Melhor horário sugerido:</strong> ${melhorHorario}<br><br>
      <strong>📢 Recomendação:</strong> ${mensagem}
    `;

    atualizarMedidorRisco(risco);
    desenharRotaNoMapa(origemCoords, destinoCoords, rota);
    gerarComparacaoHorarios(hora, clima, transporte, rota.duracaoSegundos);

    try {
      const salvarResponse = await fetch(`${API_BASE_URL}/analises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          origem,
          destino,
          horario,
          clima,
          transporte,
          distanciaKm,
          tempoBase,
          trafego,
          mensagem,
          risco,
          chanceLeve,
          classificacaoIA,
          melhorHorario
        })
      });

      if (!salvarResponse.ok) {
        throw new Error("Erro ao salvar análise.");
      }

      await carregarHistorico();
      await carregarStats();
    } catch (error) {
      console.error("Erro ao salvar análise:", error);
    }

    mostrarStatus("Análise concluída com sucesso.", "sucesso");
  } catch (error) {
    console.error("Erro na análise:", error);
    resultado.className = "resultado neutro";
    resultado.innerHTML = "Ocorreu um erro ao realizar a análise. Tente novamente.";
    mostrarStatus("Erro ao processar análise.", "erro");
  } finally {
    carregando = false;

    if (botao) {
      botao.disabled = false;
      botao.textContent = "Analisar trajeto";
    }
  }
}

/* =========================
   HISTÓRICO / GRÁFICO
========================= */
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

  if (graficoTempo) {
    graficoTempo.destroy();
  }

  graficoTempo = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Tempo estimado (min)",
          data: dados,
          borderWidth: 2,
          tension: 0.3,
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

async function limparHistorico() {
  try {
    const response = await fetch(`${API_BASE_URL}/analises`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Erro ao limpar histórico.");
    }

    await carregarHistorico();
    await carregarStats();
    atualizarMedidorRisco(0);
    mostrarStatus("Histórico limpo com sucesso.", "sucesso");

    const comparacao = document.getElementById("comparacao-horarios");
    if (comparacao) {
      comparacao.className = "resultado neutro";
      comparacao.innerHTML = "A comparação automática aparecerá aqui.";
    }

    const resultado = document.getElementById("resultado");
    if (resultado) {
      resultado.className = "resultado neutro";
      resultado.innerHTML = "A recomendação aparecerá aqui.";
    }

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

  carregarHistorico();
  carregarStats();
  atualizarMedidorRisco(0);
  inicializarMapa();
});

window.analisar = analisar;
window.limparHistorico = limparHistorico;