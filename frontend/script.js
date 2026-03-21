let historico = [];
let graficoTempo = null;

async function carregarHistorico() {
  try {
    const response = await fetch("http://localhost:3000/api/analises");
    historico = await response.json();

    if (!Array.isArray(historico)) {
      historico = [];
    }

    mostrarHistorico();
    atualizarEstatisticas();
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
  }
}

function atualizarEstatisticas() {
  const total = document.getElementById("stat-total");
  const tempo = document.getElementById("stat-tempo");
  const trafego = document.getElementById("stat-trafego");

  total.textContent = historico.length;

  if (historico.length === 0) {
    tempo.textContent = "--";
    trafego.textContent = "--";
    return;
  }

  tempo.textContent = historico[0].tempoBase + " min";
  trafego.textContent = historico[0].trafego;
}

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
  let risco = 20;

  if (faixaHorario === "pico") {
    risco += 45;
  } else if (faixaHorario === "atencao") {
    risco += 20;
  }

  if (clima === "chuva") {
    risco += 20;
  } else if (clima === "nublado") {
    risco += 8;
  }

  if (transporte === "onibus") {
    risco += 10;
  } else if (transporte === "moto") {
    risco -= 8;
  }

  if (risco < 0) risco = 0;
  if (risco > 100) risco = 100;

  return risco;
}

function gerarChanceLeve(risco) {
  const chance = 100 - risco;
  return chance < 5 ? 5 : chance;
}

function gerarClassificacaoIA(risco) {
  if (risco >= 75) {
    return "Cenário crítico";
  }

  if (risco >= 50) {
    return "Cenário de atenção";
  }

  if (risco >= 30) {
    return "Cenário moderado";
  }

  return "Cenário favorável";
}

function sugerirMelhorHorario(hora, faixaHorario, clima) {
  if (faixaHorario === "pico" && clima === "chuva") {
    return `${String((hora - 1 + 24) % 24).padStart(2, "0")}:00`;
  }

  if (faixaHorario === "pico") {
    return `${String((hora - 1 + 24) % 24).padStart(2, "0")}:30`;
  }

  if (faixaHorario === "atencao" && clima === "chuva") {
    return `${String((hora - 1 + 24) % 24).padStart(2, "0")}:45`;
  }

  if (faixaHorario === "atencao") {
    return `${String((hora - 1 + 24) % 24).padStart(2, "0")}:50`;
  }

  return "Horário atual adequado";
}

async function analisar() {
  const origem = document.getElementById("origem").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const horario = document.getElementById("horario").value;
  const clima = document.getElementById("clima").value;
  const transporte = document.getElementById("transporte").value;
  const resultado = document.getElementById("resultado");

  if (!origem || !destino || !horario) {
    resultado.className = "resultado neutro";
    resultado.innerHTML = "Preencha origem, destino e horário para fazer a análise.";
    return;
  }

  const hora = parseInt(horario.split(":")[0], 10);
  let tempoBase = 20;
  let trafego = "";
  let mensagem = "";

  const faixaHorario = calcularFaixaHorario(hora);

  if (faixaHorario === "pico") {
    tempoBase += 25;
    trafego = "intenso";
  } else if (faixaHorario === "atencao") {
    tempoBase += 10;
    trafego = "moderado";
  } else {
    trafego = "leve";
  }

  if (clima === "chuva") {
    tempoBase += 15;
  } else if (clima === "nublado") {
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

  if (trafego === "intenso" && clima === "chuva" && transporte === "onibus") {
    mensagem = "Trânsito intenso com chuva. Para ônibus, o ideal é sair 30 minutos antes.";
  } else if (trafego === "intenso" && clima === "chuva") {
    mensagem = "Trânsito intenso com chuva. O ideal é sair 25 a 30 minutos antes.";
  } else if (trafego === "intenso") {
    mensagem = "Trânsito intenso. Recomendamos sair com pelo menos 20 minutos de antecedência.";
  } else if (trafego === "moderado" && clima === "chuva") {
    mensagem = "Trânsito moderado com chuva. Considere sair 15 minutos antes.";
  } else if (trafego === "moderado") {
    mensagem = "Trânsito moderado. Considere sair 10 minutos antes.";
  } else {
    mensagem = "Trânsito tranquilo. Você pode sair no horário planejado.";
  }

  const risco = calcularRisco(clima, transporte, faixaHorario);
  const chanceLeve = gerarChanceLeve(risco);
  const classificacaoIA = gerarClassificacaoIA(risco);
  const melhorHorario = sugerirMelhorHorario(hora, faixaHorario, clima);

  resultado.className = "resultado " + trafego;
  resultado.innerHTML = `
    <strong>📍 Origem:</strong> ${origem}<br>
    <strong>🎯 Destino:</strong> ${destino}<br>
    <strong>⏰ Horário:</strong> ${horario}<br>
    <strong>🌤️ Clima:</strong> ${clima}<br>
    <strong>🚘 Transporte:</strong> ${transporte}<br>
    <strong>🚦 Nível de trânsito:</strong> ${trafego}<br>
    <strong>🕒 Tempo estimado:</strong> ${tempoBase} minutos<br>
    <strong>📉 Pontuação de risco:</strong> ${risco}/100<br>
    <strong>🧠 Classificação inteligente:</strong> ${classificacaoIA}<br>
    <strong>✅ Chance de trânsito leve:</strong> ${chanceLeve}%<br>
    <strong>⏳ Melhor horário sugerido:</strong> ${melhorHorario}<br><br>
    <strong>📢 Recomendação:</strong> ${mensagem}
  `;

  try {
    await fetch("http://localhost:3000/api/analises", {
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
        tempoBase,
        trafego,
        mensagem,
        risco,
        chanceLeve,
        classificacaoIA,
        melhorHorario
      })
    });

    await carregarHistorico();
  } catch (error) {
    console.error("Erro ao salvar análise:", error);
  }
}

function mostrarHistorico() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  if (historico.length === 0) {
    lista.innerHTML = "<li>Nenhuma análise realizada ainda.</li>";
    gerarGrafico();
    return;
  }

  historico.forEach((item) => {
    lista.innerHTML += `
      <li>
        <strong>📍 ${item.origem} → ${item.destino}</strong><br>
        ⏰ Horário: ${item.horario} | 🌤️ Clima: ${item.clima} | 🚘 Transporte: ${item.transporte}<br>
        🕒 Tempo: ${item.tempoBase} min | 🚦 Tráfego: ${item.trafego}
      </li>
    `;
  });

  gerarGrafico();
}

function gerarGrafico() {
  const canvas = document.getElementById("grafico");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  const dados = historico.map(item => item.tempoBase).reverse();
  const labels = historico.map((_, i) => `Análise ${i + 1}`).reverse();

  if (graficoTempo) {
    graficoTempo.destroy();
  }

  graficoTempo = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
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
    await fetch("http://localhost:3000/api/analises", {
      method: "DELETE"
    });

    await carregarHistorico();
  } catch (error) {
    console.error("Erro ao limpar histórico:", error);
  }
}

carregarHistorico();