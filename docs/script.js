let historico = JSON.parse(localStorage.getItem("historicoTrajetos")) || [];

function salvarHistorico() {
  localStorage.setItem("historicoTrajetos", JSON.stringify(historico));
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

function analisar() {
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

  if ((hora >= 7 && hora <= 9) || (hora >= 17 && hora <= 19)) {
    tempoBase += 25;
    trafego = "intenso";
  } else if (
    (hora >= 6 && hora < 7) ||
    (hora > 9 && hora <= 10) ||
    (hora >= 16 && hora < 17) ||
    (hora > 19 && hora <= 20)
  ) {
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

  resultado.className = "resultado " + trafego;
  resultado.innerHTML = `
    <strong>📍 Origem:</strong> ${origem}<br>
    <strong>🎯 Destino:</strong> ${destino}<br>
    <strong>⏰ Horário:</strong> ${horario}<br>
    <strong>🌤️ Clima:</strong> ${clima}<br>
    <strong>🚘 Transporte:</strong> ${transporte}<br>
    <strong>🚦 Nível de trânsito:</strong> ${trafego}<br>
    <strong>🕒 Tempo estimado:</strong> ${tempoBase} minutos<br><br>
    <strong>✅ Recomendação:</strong> ${mensagem}
  `;

  historico.unshift({
    origem,
    destino,
    horario,
    clima,
    transporte,
    tempoBase,
    trafego
  });

  if (historico.length > 5) {
    historico.pop();
  }

  salvarHistorico();
  mostrarHistorico();
  atualizarEstatisticas();
}

function mostrarHistorico() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  if (historico.length === 0) {
    lista.innerHTML = "<li>Nenhuma análise realizada ainda.</li>";
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
}

function limparHistorico() {
  historico = [];
  localStorage.removeItem("historicoTrajetos");
  mostrarHistorico();
  atualizarEstatisticas();
}

mostrarHistorico();
atualizarEstatisticas();