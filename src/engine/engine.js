// engine.js
import { CARDS } from "../data/cards.js"
import { EFFECTS } from "../data/effects.js"
import { perguntar } from "./logger.js"
import * as RULES from "./rules.js"

export function criarInstancia(cartaBase) {
  return {
    cartaId: cartaBase.id,
    ...cartaBase,
    instanciaId: crypto.randomUUID(),
    turnoEntrada: null,
    buffs: [],
    ativo: true,
    jaAtacou: false
  }
}

export function comprarCarta(jogador) {
  if (jogador.deck.length === 0) {
    console.log("Deck vazio!")
    return false
  }

  const cartaComprada = jogador.deck.shift()
  jogador.mao.push(cartaComprada)

  const carta = CARDS[cartaComprada]
  console.log(
    `🃏 Comprou carta: ${carta?.nome ?? "Carta desconhecida"} (${cartaComprada})`
  )
  return true
}

export function embaralharDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
}


function destinoAoJogarCarta(carta) {
  switch (carta.tipoCarta) {
    case "Criatura":
      return "Campo"


    case "Magia":
      return "Cemiterio"


    case "Armadilha":
      return "Campo"


    default:
      return "Cemiterio"
  }
}

export async function jogarCartaDaMao(cardId, jogador, estado) {
  const index = jogador.mao.indexOf(cardId)
  if (index === -1) {
    console.log("Carta não está na mão")
    return false
  }

  const carta = CARDS[cardId]
  const destino = destinoAoJogarCarta(carta)

  let sucesso = false

  if (!jogador.flags.podeAtacar) {
    console.log("⚠️ Você já entrou em fase de batalha e não pode mais jogar cartas")
    return false
  }

  switch (carta.tipoCarta) {

    case "Criatura":
      sucesso = await invocarCriatura(cardId, jogador, estado)
      break

    case "Magia":
      if (carta.subTipo === "Zona") {
        ativarZona(cardId, jogador)
        sucesso = true
      } else {
        sucesso = await ativarMagia(cardId, jogador, estado)
      }
      break

    case "Armadilha":
      sucesso = setarArmadilha(cardId, jogador)
      break

    default:
      console.log("Tipo de carta não jogável:", carta.tipoCarta)
      return false
  }

  if (!sucesso) return false

  // remove da mão
  jogador.mao.splice(index, 1)

  // envia para destino correto
  if (destino === "Cemiterio") {
    jogador.cemiterio.push(cardId)
  }

  return true
}

/* =========================
   INVOCAR CRIATURA
========================= */
export async function invocarCriatura(cardId, jogador, estado) {
  const carta = CARDS[cardId]

  if (carta.restricoes?.posInvocacao === "SemInvocarCriaturasProximoTurno") {
    RULES.aplicarRestricaoDeus(jogador)
  }

  if (!RULES.podeInvocarCriatura(carta, jogador, estado.turno)) {
    return false
  }

  const instancia = criarInstancia(carta)
  instancia.turnoEntrada = estado.turno
  instancia.dono = jogador.id

  if (
    carta.palavrasChave?.includes("Comandante") &&
    !jogador.campo.comandanteAtivo
  ) {
    jogador.campo.comandanteAtivo = instancia.instanciaId
  }

  jogador.campo.criaturas.push(instancia)
  await dispararEvento(
    "InvocacaoCriatura",
    { criatura: instancia },
    estado
  )

  return true
}

/* =========================
   ARMADILHAS
========================= */
export function setarArmadilha(cardId, jogador) {
  const carta = CARDS[cardId]
  if (!carta || carta.tipoCarta !== "Armadilha") return false

  if (jogador.campo.armadilhas.length >= 5) {
    console.log("⚠️ Campo de armadilhas cheio")
    return false
  }

  const instancia = {
    ...carta,
    instanciaId: crypto.randomUUID(),
    oculto: true,
    turnoSetada: jogador.turnoAtual ?? null,
    usada: false,
    dono: jogador
  }

  jogador.campo.armadilhas.push(instancia)

  console.log("🪤 Uma armadilha foi setada no campo")
  return true
}

/* =========================
   MAGIAS
========================= */
export async function ativarMagia(cardId, jogador, estado) {
  const magia = CARDS[cardId]
  let cancelada = false

  if (!magia || magia.tipoCarta !== "Magia") return false

  // 🔒 checa limite de busca/compra 
  if (magia.subTipo === "Busca" || magia.subTipo === "Compra") {
    if (jogador.magiasBuscaUsadasTurno >= 1) {
      console.log("⚠️ Você já usou uma magia de busca ou compra neste turno")
      return false
    }
  }

  if (magia.subTipo === "Fusao") {
    console.log(`🔮 Magia de fusão ativada`)
  }

  if (!RULES.podeAtivarMagia(magia, jogador)) return false

  console.log(`✨ ${magia.nome} foi ativada`)

  // resolve efeitos diretos

  // efeitos inline
  for (const efeito of magia.efeitos ?? []) {
    const r = await resolverEfeito(efeito, jogador, estado)
    if (r?.cancelar) cancelada = true
  }

  // efeitos por ID
  for (const id of magia.efeitosId ?? []) {
    const efeito = EFFECTS[id]
    const r = await resolverEfeito(efeito, jogador, estado)
    if (r?.cancelar) cancelada = true
  }

  if (magia.subTipo === "Fusao") {
    jogador.cemiterio.push(magia.id)
  }

  if (cancelada) {
    console.log("❌ Fusão não realizada — magia não foi consumida")
    return false
  }

  if (magia.subTipo === "Busca" || magia.subTipo === "Compra") {
    jogador.magiasBuscaUsadasTurno++
  }

  RULES.registrarUsoMagia(magia, jogador)

  return true
}

export function ativarZona(cardId, jogador) {
  const zona = CARDS[cardId]
  RULES.ativarZona(jogador, zona)
}

/* =========================
   RITUAIS
========================= */
export async function resolverRitual(efeito, jogador, estado, modo = "HUMANO") {
  if (modo === "IA") {
    return resolverRitualIA(efeito, jogador, estado)
  }

  return resolverRitualHumano(efeito, jogador, estado)
}

async function resolverRitualHumano(efeito, jogador, estado) {
  estado.flags.menuBloqueado = true
  try {
    const { criatura, estrelasMin, origensPermitidas } = efeito
    const criaturaRitual = CARDS[criatura]


    if (!criaturaRitual) {
      console.log("❌ Criatura ritual inválida")
      return
    }

    // =========================
    // COLETA DE SACRIFÍCIOS
    // =========================
    const opcoes = []

    if (origensPermitidas.includes("Mao")) {
      jogador.mao.forEach(id => {
        const carta = CARDS[id]
        if (
          carta?.tipoCarta === "Criatura" &&
          carta.id !== criatura
        ) {
          opcoes.push({
            origem: "Mao",
            carta,
            id
          })
        }
      })
    }

    if (origensPermitidas.includes("Campo")) {
      jogador.campo.criaturas.forEach(inst => {
        opcoes.push({
          origem: "Campo",
          carta: inst,
          instancia: inst
        })
      })
    }

    if (opcoes.length === 0) {
      console.log("❌ Nenhuma criatura disponível para ritual")
      return
    }

    let soma = 0
    const escolhidas = []

    // =========================
    // MENU DE ESCOLHA
    // =========================
    while (soma < estrelasMin) {
      console.log("\n🔮 Escolha criaturas para o ritual:")
      console.log(`⭐ Estrelas atuais: ${soma}/${estrelasMin}\n`)

      opcoes.forEach((op, i) => {
        console.log(
          `[${i + 1}] ${op.carta.nome} ⭐${op.carta.estrelas} (${op.origem === "Mao" ? "✋ Mão" : "🧙 Campo"})`
        )
      })

      console.log("[0] Cancelar ritual")

      const escolha = Number(await perguntar("Escolha: "))

      if (escolha === 0) {
        console.log("❌ Ritual cancelado")
        return
      }

      const selecionada = opcoes[escolha - 1]
      if (!selecionada) {
        console.log("❌ Escolha inválida")
        continue
      }

      escolhidas.push(selecionada)
      soma += selecionada.carta.estrelas

      // remove da lista para não escolher duas vezes
      opcoes.splice(escolha - 1, 1)
    }

    // =========================
    // SACRIFÍCIO
    // =========================
    escolhidas.forEach(alvo => {
      if (alvo.origem === "Mao") {
        jogador.mao = jogador.mao.filter(id => id !== alvo.id)
        jogador.cemiterio.push(alvo.id)
      } else {
        jogador.campo.criaturas =
          jogador.campo.criaturas.filter(c => c !== alvo.instancia)
        jogador.cemiterio.push(alvo.instancia.id)
      }
    })

    // =========================
    // INVOCAÇÃO
    // =========================
    const instancia = criarInstancia(criaturaRitual)
    instancia.turnoEntrada = estado.turno
    instancia.dono = jogador.id

    jogador.campo.criaturas.push(instancia)

    console.log(
      `✨ Ritual realizado! ${criaturaRitual.nome} foi invocado`
    )
  } finally {
    estado.flags.menuBloqueado = false
  }
}

function resolverRitualIA(efeito, jogador, estado) {
  const criatura = CARDS[efeito.criatura]
  let estrelas = 0
  const sacrificios = []

  // prioridade: campo → mão
  for (const c of jogador.campo.criaturas) {
    if (estrelas >= efeito.estrelasMin) break
    estrelas += c.estrelas
    sacrificios.push({ origem: "Campo", carta: c })
  }

  for (const id of jogador.mao) {
    if (estrelas >= efeito.estrelasMin) break
    const c = CARDS[id]
    if (c?.tipoCarta === "Criatura" && c.id !== criatura.id) {
      estrelas += c.estrelas
      sacrificios.push({ origem: "Mao", carta: c, id })
    }
  }

  if (estrelas < efeito.estrelasMin) {
    console.log("🤖 IA falhou em realizar o ritual")
    return false
  }

  // consumir sacrifícios
  sacrificios.forEach(s => {
    if (s.origem === "Campo") {
      const idx = jogador.campo.criaturas.findIndex(
        c => c.instanciaId === s.carta.instanciaId
      )
      if (idx !== -1) {
        const [rem] = jogador.campo.criaturas.splice(idx, 1)
        jogador.cemiterio.push(rem.cartaId)
      }
    }

    if (s.origem === "Mao") {
      const idx = jogador.mao.indexOf(s.id)
      if (idx !== -1) {
        jogador.mao.splice(idx, 1)
        jogador.cemiterio.push(s.id)
      }
    }
  })

  // invocar criatura ritual
  const instancia = criarInstancia(criatura)
  jogador.campo.criaturas.push(instancia)

  // LOG LIMPO
  console.log(`🤖 IA realizou o ritual de ${criatura.nome}`)
  console.log(
    `🔥 Sacrifícios: ${sacrificios.map(s => s.carta.nome).join(", ")}`
  )
  console.log(`✨ ${criatura.nome} foi invocado`)

  return true
}

/* =========================
   FUSÃO
========================= */

function mostrarPreviewFusao(carta) {
  console.log("\n🔮 FUSÃO DETECTADA\n")
  console.log(`${carta.nome}`)
  console.log(`⭐ ${carta.estrelas}`)
  console.log(`ATK ${carta.ataque} / DEF ${carta.defesa}`)

  if (carta.palavrasChave?.length) {
    console.log(`Tags: ${carta.palavrasChave.join(", ")}`)
  }
}

async function resolverFusaoManual(jogador, estado) {

  estado.flags.menuBloqueado = true
  try {

    console.log("\n🔮 Escolha os materiais para a fusão")
    const id1 = await perguntar("Material 1 (ID): ")
    const id2 = await perguntar("Material 2 (ID): ")

    // não pode usar o mesmo
    if (id1 === id2) {
      console.log("❌ Materiais devem ser diferentes")
      return false
    }

    const zonas = [
      ...jogador.mao,
      ...jogador.campo.criaturas.map(c => c.cartaId)
    ]

    if (!zonas.includes(id1) || !zonas.includes(id2)) {
      console.log("❌ Um ou ambos os materiais não estão disponíveis")
      return false
    }

    const cartaFusao = validarFusao(id1, id2, jogador)

    if (!cartaFusao.ok) {
      console.log(`❌ ${id1} + ${id2} não formam nenhuma fusão`)
      return false
    }


    console.log(
      `✅ Fusão válida: ${CARDS[id1].nome} + ${CARDS[id2].nome} → ${cartaFusao.carta.nome}`
    )

    // consumir materiais
    if (cartaFusao.carta.fusao?.consome) {
      [id1, id2].forEach(id => {
        const idxMao = jogador.mao.indexOf(id)
        if (idxMao !== -1) {
          jogador.mao.splice(idxMao, 1)
          jogador.cemiterio.push(id)
          return
        }

        const idxCampo = jogador.campo.criaturas.findIndex(c => c.cartaId === id)
        if (idxCampo !== -1) {
          const [inst] = jogador.campo.criaturas.splice(idxCampo, 1)
          jogador.cemiterio.push(inst.cartaId)
        }
      })
    }

    mostrarPreviewFusao(cartaFusao.carta)

    const confirmar = await perguntar("Confirmar fusão? (1 = Sim | 0 = Cancelar): ")
    if (confirmar !== "1") {
      console.log("❌ Fusão cancelada pelo jogador")
      return false
    }

    // invocar fusão
    const instancia = criarInstancia(cartaFusao.carta)
    instancia.turnoEntrada = estado.turno
    jogador.campo.criaturas.push(instancia)

    console.log(`✨ ${cartaFusao.carta.nome} foi invocado por fusão!`)

    return true

  } finally {
    estado.flags.menuBloqueado = false
  }
}


function validarFusao(matA, matB, jogador) {
  const zona = [
    ...jogador.mao,
    ...jogador.campo.criaturas.map(c => c.cartaId)
  ]

  for (const carta of Object.values(CARDS)) {
    if (!carta.palavrasChave?.includes("Fusao")) continue

    const materiais = carta.fusao.materiais.map(m => m.id)

    // verifica se a combinação bate
    if (
      !materiais.includes(matA) ||
      !materiais.includes(matB)
    ) continue

    // verifica se falta algo
    const faltando = materiais.filter(id => !zona.includes(id))

    if (faltando.length > 0) {
      return {
        ok: false,
        motivo: "INCOMPLETA",
        carta,
        faltando
      }
    }

    return {
      ok: true,
      carta
    }
  }

  return {
    ok: false,
    motivo: "NAO_EXISTE"
  }

}

/* =========================
   EFEITOS
========================= */
async function resolverEfeito(efeito, jogador, estado, payload = {}) {
  switch (efeito.tipo) {

    case "BuscarNoDeck":
      buscarCarta(jogador, efeito.filtro, efeito.quantidade)
      break

    case "Destruir":
      destruirAlvo(estado, efeito.alvo)
      break

    case "BanirMonstro": {
      const { atacante } = payload
      if (!atacante) return

      // 🔒 só ativa se o atacante for do OPONENTE
      const jogadorAtacante = estado.jogadores.find(j =>
        j.campo.criaturas.includes(atacante)
      )

      if (jogadorAtacante === jogador) {
        // atacante é do mesmo jogador da armadilha → ignora
        return
      }

      banir(atacante, estado)

      return {
        cancelar: true
      }
    }


    case "Fusao": {
      const sucesso = await resolverFusaoManual(jogador, estado)
      if (!sucesso) return { cancelar: true }
      break
    }

    case "Ritual":
      if (estado.jogadorAtual === 1) {
        // IA: ritual já tratado fora
        return
      }
      await resolverRitual(efeito, jogador, estado)
      break


    case "GerarExodia":
      processarExodia(jogador, estado, efeito)
      break

    case "Compra": {
      const qtd = efeito.quantidade

      for (let i = 0; i < qtd; i++) {
        comprarCarta(jogador)
      }

      console.log(`🟢 ${jogador === estado.jogadores[0] ? "Você" : "IA"} comprou ${qtd} cartas`)
      break
    }

    case "DestruirMultiplos":
      if (efeito.condicao === "Atacantes") {
        estado.flags.atacantesTurno.forEach(c =>
          destruir(c, estado)
        )
      }
      break

    case "CilindroMagico": {
      const { atacante } = payload

      if (!atacante) return

      const jogadorAtk = estado.jogadores.find(j =>
        j.campo.criaturas.includes(atacante)
      )

      const jogadorDef = estado.jogadores.find(j =>
        j !== jogadorAtk
      )

      const dano = Math.floor(atacante.ataque / 2)

      jogadorAtk.pv -= dano

      console.log(
        `🧨 Cilindro Mágico ativado! Ataque redirecionado — ${dano} de dano`
      )

      // destruir a armadilha depois de usar
      destruirArmadilhaUsada(estado, "CILINDRO_MAGICO_EFFECT")

      // cancela COMPLETAMENTE o ataque
      return {
        cancelar: true,
        bloquearDano: true
      }
    }

    default:
      console.warn("Efeito não tratado:", efeito.tipo)
  }
}

function destruirArmadilhaUsada(estado, efeitoId) {
  estado.jogadores.forEach(jogador => {
    jogador.campo.armadilhas = jogador.campo.armadilhas.filter(a => {
      if (a.efeitosId?.includes(efeitoId)) {
        jogador.cemiterio.push(a.id)
        return false
      }
      return true
    })
  })
}

export async function atacar(atacante, defensor, estado) {
  const jogadorAtk = estado.jogadores[estado.jogadorAtual]
  const jogadorDef = estado.jogadores[1 - estado.jogadorAtual]

  const resultado = await dispararEvento(
    "AtaqueDeclarado",
    { atacante, defensor },
    estado
  )

  if (resultado.cancelado) {
    console.log("❌ O ataque foi cancelado por uma armadilha")
    atacante.jaAtacou = true
    return
  }

  const atk = calcularATK(atacante, jogadorAtk)
  const def = calcularDEF(defensor, jogadorDef)

  if (atacante.jaAtacou) return

  if (atk > def) {
    destruir(defensor, estado)

    // ⭐ regra híbrida
    if (atacante.estrelas >= 6) {
      const dano = atk - def
      jogadorDef.pv -= dano
      console.log(
        `💥 ${atacante.nome} causou ${dano} de dano excedente`
      )

      checarVitoria(estado)
    }

  } else if (def > atk) {
    destruir(atacante, estado)
  } else {
    destruir(atacante, estado)
    destruir(defensor, estado)
  }

  jogadorAtk.flags.podeAtacar = false
  atacante.jaAtacou = true
}

function destruir(criatura, estado) {
  if (!criatura) return

  // encontra o jogador dono
  const jogador = estado.jogadores.find(j =>
    j.campo.criaturas.includes(criatura)
  )

  if (!jogador) return

  // remove do campo
  jogador.campo.criaturas = jogador.campo.criaturas.filter(
    c => c !== criatura
  )

  // envia para o cemitério
  jogador.cemiterio.push(criatura.id)

  // se era comandante, remove
  if (jogador.campo.comandanteAtivo === criatura.instanciaId) {
    jogador.campo.comandanteAtivo = null
  }

  console.log(`💥 ${criatura.nome} foi destruído`)
}

function banir(criatura, estado) {
  if (!criatura) return

  // encontra o jogador dono
  const jogador = estado.jogadores.find(j =>
    j.campo.criaturas.includes(criatura)
  )

  if (!jogador) return

  // remove do campo
  jogador.campo.criaturas = jogador.campo.criaturas.filter(
    c => c !== criatura
  )

  // envia para banidas
  jogador.banidas.push(criatura.id)

  // se era comandante, remove
  if (jogador.campo.comandanteAtivo === criatura.instanciaId) {
    jogador.campo.comandanteAtivo = null
  }

  console.log(`🚫 ${criatura.nome} foi banido`)
}


export async function atacarJogador(atacante, jogadorDefensor, estado) {
  if (!atacante) return false

  const jogadorAtk = estado.jogadores.find(j =>
    j.campo.criaturas.includes(atacante)
  )

  if (!jogadorAtk) return false

  const resultado = await dispararEvento(
    "AtaqueDeclarado",
    { atacante, defensor: null },
    estado
  )

  if (resultado.cancelado) {
    console.log("❌ O ataque foi cancelado por uma armadilha")
    atacante.jaAtacou = true
    jogadorAtk.flags.podeAtacar = false
    return false
  }

  const atk = calcularATK(atacante, jogadorAtk)

  console.log(
    `⚔️ ${atacante.nome} atacou diretamente causando ${atk} de dano`
  )

  jogadorDefensor.pv -= atk
  jogadorAtk.flags.podeAtacar = false
  atacante.jaAtacou = true

  checarVitoria(estado)
  return true
}

export async function dispararEvento(tipo, payload, estado) {
  let cancelado = false

  for (const jogador of estado.jogadores) {

    for (const criatura of jogador.campo.criaturas) {

      for (const efeito of criatura.efeitos ?? []) {
        if (efeito.gatilho === tipo) {
          const resultado = await resolverEfeito(
            efeito,
            jogador,
            estado,
            payload
          )
          if (resultado?.cancelar) cancelado = true
        }
      }

      for (const efeitoId of criatura.efeitosId ?? []) {
        const efeito = EFFECTS[efeitoId]
        if (efeito?.gatilho === tipo) {
          const resultado = await resolverEfeito(
            efeito,
            jogador,
            estado,
            payload
          )
          if (resultado?.cancelar) cancelado = true
        }
      }
    }

    for (const armadilha of jogador.campo.armadilhas) {

      if (armadilha.usada) continue

      // não ativa no mesmo turno em que foi setada
      if (armadilha.turnoSetada === estado.turno) continue

      for (const efeito of armadilha.efeitos ?? []) {
        if (efeito.gatilho === tipo) {
          const resultado = await resolverEfeito(
            efeito,
            jogador,
            estado,
            payload
          )
          if (resultado?.cancelar) cancelado = true
          armadilha.usada = true
          armadilha.oculto = false

        }
      }

      for (const efeitoId of armadilha.efeitosId ?? []) {
        const efeito = EFFECTS[efeitoId]
        if (efeito?.gatilho === tipo) {
          const resultado = await resolverEfeito(
            efeito,
            jogador,
            estado,
            payload
          )
          if (resultado?.cancelar) cancelado = true
          armadilha.usada = true
          armadilha.oculto = false

        }
      }
    }
  }

  return { cancelado }
}

function buscarCarta(jogador, filtro, quantidade = 1) {
  let encontradas = 0

  for (let i = jogador.deck.length - 1; i >= 0; i--) {
    const cardId = jogador.deck[i]
    const carta = CARDS[cardId]

    // aplica filtro simples (ex: faccao)
    let valida = true
    if (filtro?.faccao && carta.faccao !== filtro.faccao) {
      valida = false
    }

    if (valida) {
      jogador.deck.splice(i, 1)
      jogador.mao.push(cardId)
      encontradas++
      console.log(`🔍 Carta buscada: ${cardId}`)
    }

    if (encontradas >= quantidade) break
  }

  if (encontradas === 0) {
    console.log("🔍 Nenhuma carta encontrada no deck")
  }
}

export function obterComandantesDoCampo(jogador) {
  return jogador.campo.criaturas.filter(c =>
    c.palavrasChave?.includes("Comandante")
  )
}

export function checarVitoria(estado) {
  const jogador1 = estado.jogadores[0]
  const jogador2 = estado.jogadores[1]

  if (jogador1.pv <= 0) {
    jogador1.pv = 0
    estado.vencedor = 2
  }

  if (jogador2.pv <= 0) {
    jogador2.pv = 0
    estado.vencedor = 1
  }

  if (estado.vencedor) {
    console.log(`🏁 Fim de jogo — Jogador ${estado.vencedor} venceu`)
  }
}

// =========================
// CÁLCULO DE ATRIBUTOS
// =========================

export function calcularATK(criatura, jogador) {
  let atk = criatura.ataque
  if (!jogador?.campo) return criatura.ataque

  // Buff da Zona
  if (jogador.campo.zona) {
    const zona = CARDS[jogador.campo.zona]
    zona.efeitos?.forEach(efeito => {
      if (
        efeito.tipo === "BuffGlobal" &&
        efeito.atributo === "ATK" &&
        criatura.faccao === efeito.faccao
      ) {
        atk += efeito.valor
      }
    })
  }

  // Buff de Comandante
  // Buff de Comandante
  const comandanteId = jogador.campo.comandanteAtivo
  if (comandanteId) {
    const comandante = jogador.campo.criaturas.find(
      c => c.instanciaId === comandanteId
    )

    // efeitos inline
    comandante?.efeitos?.forEach(efeito => {
      if (
        efeito.tipo === "BuffGlobal" &&
        efeito.atributo === "ATK" &&
        criatura.faccao === efeito.faccao
      ) {
        atk += efeito.valor
      }
    })

    // efeitos por ID
    comandante?.efeitosId?.forEach(efeitoId => {
      const efeito = EFFECTS[efeitoId]
      if (
        efeito?.tipo === "BuffGlobal" &&
        efeito.atributo === "ATK" &&
        criatura.faccao === efeito.faccao
      ) {
        atk += efeito.valor
      }
    })
  }

  return atk
}

export function calcularDEF(criatura, jogador) {
  let def = criatura.defesa
  if (!jogador?.campo) return criatura.defesa

  // Buff da Zona
  if (jogador.campo.zona) {
    const zona = CARDS[jogador.campo.zona]
    zona.efeitos?.forEach(efeito => {
      if (
        efeito.tipo === "BuffGlobal" &&
        efeito.atributo === "DEF" &&
        criatura.faccao === efeito.faccao
      ) {
        def += efeito.valor
      }
    })
  }

  // Buff de Comandante
  // Buff de Comandante
  const comandanteId = jogador.campo.comandanteAtivo
  if (comandanteId) {
    const comandante = jogador.campo.criaturas.find(
      c => c.instanciaId === comandanteId
    )

    // efeitos inline
    comandante?.efeitos?.forEach(efeito => {
      if (
        efeito.tipo === "BuffGlobal" &&
        efeito.atributo === "DEF" &&
        criatura.faccao === efeito.faccao
      ) {
        def += efeito.valor
      }
    })

    // efeitos por ID
    comandante?.efeitosId?.forEach(efeitoId => {
      const efeito = EFFECTS[efeitoId]
      if (
        efeito?.tipo === "BuffGlobal" &&
        efeito.atributo === "DEF" &&
        criatura.faccao === efeito.faccao
      ) {
        def += efeito.valor
      }
    })
  }

  return def
}

function processarExodia(jogador, estado, efeito) {
  if (!jogador.flags.exodiaTurnos)
    jogador.flags.exodiaTurnos = 0

  jogador.flags.exodiaTurnos++

  if (jogador.flags.exodiaTurnos >= efeito.intervaloTurnos) {
    // aqui você adicionaria uma parte do Exodia
    jogador.flags.exodiaTurnos = 0
  }
}
