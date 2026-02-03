import { GAME_CONFIG } from "./rules.js"

/* =========================
   ESTADO INICIAL DO JOGO
========================= */

export function criarEstadoInicial() {
  return {
    turno: 1,
    fase: "Inicio", // Inicio | Principal | Batalha | Fim
    flags: {
      menuBloqueado: false
    },
    jogadorAtual: 0,
    vencedor: null,

    jogadores: [
      criarJogador(),
      criarJogador()
    ]
  }
}

/* =========================
   JOGADOR
========================= */

function criarJogador() {
  return {
    pv: GAME_CONFIG.PV_INICIAL,

    deck: [],
    mao: [],
    cemiterio: [],
    banidas: [],

    campo: {
      criaturas: [],
      magias: [],
      armadilhas: [],
      zona: null,
      comandanteAtivo: null
    },

    magiasBuscaUsadasTurno: 0,

    flags: {
      usouMagiaBusca: false,
      trocouComandante: false,
      podeAtacar: true,
      semInvocarCriaturas: false
    }
  }
}