// rules.js

/* =========================
   CONFIGURAÇÕES GERAIS
========================= */

export const GAME_CONFIG = {
  PV_INICIAL: 4000,
  LIMITE_TURNOS: 25,

  TEMPO_TURNO: {
    NORMAL: 30,
    FINAL: 40,
    TURNO_FINAL_INICIA: 15
  },

  CAMPO: {
    MAX_CRIATURAS: 5,
    MAX_MAGIAS: 5
  }
}

/* =========================
   PROGRESSÃO DE ESTRELAS
========================= */

export function estrelasPermitidas(turno) {
  if (turno <= 2) return 4
  if (turno <= 4) return 5
  if (turno <= 6) return 6
  return Infinity
}

/* =========================
   VALIDAÇÕES DE INVOCACÃO
========================= */

export function podeInvocarCriatura(carta, jogador, turnoAtual) {
  if (carta.tipoCarta !== "Criatura") return false

  // Campo cheio
  if (jogador.campo.criaturas.length >= GAME_CONFIG.CAMPO.MAX_CRIATURAS)
    return false

  // Restrição pós-Deus
  if (jogador.flags?.semInvocarCriaturas)
    return false

  // Limite de estrelas (apenas invocação direta)
  const limite = estrelasPermitidas(turnoAtual)
  if (carta.estrelas > limite) { console.log("❌ Está Carta Ainda Não Pode Ser Invocada!"); return false }

  if (carta.palavrasChave?.includes("Ritual")) {
    console.log("❌ Criaturas rituais só podem ser invocadas por ritual")
    return false
  }

  if (carta.palavrasChave?.includes("Fusão")) {
    console.log("❌ Criaturas de Fusão só podem ser invocadas por magias de Fusão")
    return false
  }


  return true
}

/* =========================
   COMANDANTES
========================= */

export function podeTrocarComandante(jogador) {
  return !jogador.flags?.trocouComandante
}

export function trocarComandante(jogador, criaturaId) {
  if (!podeTrocarComandante(jogador)) return false

  jogador.campo.comandanteAtivo = criaturaId
  jogador.flags.trocouComandante = true
  jogador.flags.podeAtacar = false

  return true
}

/* =========================
   MAGIAS DE BUSCA
========================= */

export function podeAtivarMagia(magia, jogador) {
  if (magia.tipoCarta !== "Magia") return false

  if (magia.subtipo === "Busca" && jogador.flags.usouMagiaBusca)
    return false

  return true
}

export function registrarUsoMagia(magia, jogador) {
  if (magia.subtipo === "Busca") {
    jogador.flags.usouMagiaBusca = true
  }
}

/* =========================
   MAGIAS DE ZONA
========================= */

export function ativarZona(jogador, zonaId) {
  if (jogador.campo.zona) {
    // remove zona anterior
    jogador.campo.zona = null
  }

  jogador.campo.zona = zonaId
}

/* =========================
   ATAQUES
========================= */

export function podeAtacar(jogador) {
  return jogador.flags.podeAtacar !== false
}

/* =========================
   DEUSES EGÍPCIOS
========================= */

export function aplicarRestricaoDeus(jogador) {
  jogador.flags.semInvocarCriaturas = true
}

/* =========================
   FIM DE TURNO
========================= */

export function finalizarTurno(jogador, turnoAtual) {
  // Reseta flags temporárias
  jogador.flags.usouMagiaBusca = false
  jogador.flags.trocouComandante = false
  jogador.flags.podeAtacar = true

  // Restrição de Deus dura só 1 turno
  if (jogador.flags.semInvocarCriaturas) {
    jogador.flags.semInvocarCriaturas = false
  }
}