class Analysis {
  constructor({
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
  }) {
    this.origem = origem;
    this.destino = destino;
    this.horario = horario;
    this.clima = clima;
    this.transporte = transporte;
    this.distanciaKm = distanciaKm;
    this.tempoBase = tempoBase;
    this.trafego = trafego;
    this.mensagem = mensagem;
    this.risco = risco;
    this.chanceLeve = chanceLeve;
    this.classificacaoIA = classificacaoIA;
    this.melhorHorario = melhorHorario;
  }
}

module.exports = Analysis;