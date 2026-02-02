import { criarEstadoInicial } from "./state.js"
import { CARDS } from "../data/cards.js"
import {
  comprarCarta,
  jogarCartaDaMao,
  atacar,
  atacarJogador,
  calcularATK,
  calcularDEF,
  embaralharDeck,
  obterComandantesDoCampo
} from "./engine.js"
import { turnoIA } from "./ia.js"
import { DECKS } from "../data/decks.js"
import {
  logResumoTurno,
  logMao,
  perguntar,
} from "./logger.js"
import { descreverCarta } from "../data/index.js"
import { podeTrocarComandante, finalizarTurno } from "./rules.js"
import { EFFECTS } from "../data/effects.js"

const estado = criarEstadoInicial()

async function escolherDecks() {
  const chaves = Object.keys(DECKS)

  console.log("\n🎴 ESCOLHA SEU DECK:\n")

  chaves.forEach((key, i) => {
    console.log(`[${i + 1}] ${DECKS[key].nome}`)
  })

  const escolha = Number(await perguntar("Escolha: ")) - 1
  const deckJogadorKey = chaves[escolha]

  if (!deckJogadorKey) {
    console.log("❌ Escolha inválida, deck padrão selecionado")
    return escolherDecks()
  }

  // remove o escolhido
  const decksRestantes = chaves.filter(k => k !== deckJogadorKey)

  // IA escolhe aleatoriamente
  const deckIAKey =
    decksRestantes[Math.floor(Math.random() * decksRestantes.length)]

  console.log("\n🎴 DECKS SELECIONADOS:")
  console.log(`👤 Você: ${DECKS[deckJogadorKey].nome}`)
  console.log(`🤖 IA: ${DECKS[deckIAKey].nome}\n`)

  return {
    jogador: DECKS[deckJogadorKey].cartas,
    ia: DECKS[deckIAKey].cartas
  }
}

const decks = await escolherDecks()

estado.jogadores[0].deck = [...decks.jogador]
estado.jogadores[1].deck = [...decks.ia]

embaralharDeck(estado.jogadores[0].deck)
embaralharDeck(estado.jogadores[1].deck)

/* =========================
   TURNO (HUMANO OU IA)
========================= */
async function executarTurno(jogadorIndex) {
  const jogadorAtual = estado.jogadores[jogadorIndex]
  const jogadorOponente = estado.jogadores[1 - jogadorIndex]

  // reset de ataque
  jogadorAtual.campo.criaturas.forEach(c => {
    c.jaAtacou = false
  })

  //Reset Magias
  jogadorAtual.magiasBuscaUsadasTurno = 0

  console.log(`\n=== TURNO ${estado.turno} | Jogador ${jogadorIndex + 1} ===`)

  comprarCarta(jogadorAtual)

  // TURNO DA IA
  if (jogadorIndex === 1) {
    await turnoIA(jogadorAtual, jogadorOponente, estado)
    return
  }

  // TURNO DO HUMANO
  let fimTurno = false

  while (!fimTurno) {
    if (estado.flags.menuBloqueado) {
      await new Promise(resolve => setTimeout(resolve, 50))
      continue
    }

    logResumoTurno(jogadorAtual, jogadorOponente, estado.turno)

    console.log("\n[AÇÕES]")
    console.log("1 - AÇÕES")

    if (estado.turno > 2) {
      console.log("2 - ATACAR")
    }

    console.log("3- INDEX")
    if (
      !jogadorAtual.flags.trocouComandante &&
      jogadorAtual.campo.criaturas.some(c =>
        c.palavrasChave?.includes("Comandante")
      )
    ) {
      console.log("4 - COMANDANTE")
    }

    console.log("5 - FINALIZAR")

    const opcao = await perguntar("Escolha: ")

    switch (opcao) {

      case "1": // AÕES
        logMao(jogadorAtual)
        const cartaId = await perguntar("Digite o ID da carta para invocação: ")
        jogarCartaDaMao(cartaId, jogadorAtual, estado)
        break

      case "2": // ATACAR
        if (estado.turno < 3) {
          break
        }
        await menuAtaque(jogadorAtual, jogadorOponente)
        break

      case "3": // Index
        await menuIndex()
        break

      case "4": // Comandante
        await menuComandante(jogadorAtual)
        break

      case "5": // FINALIZAR
        fimTurno = true
        finalizarTurno(jogadorAtual, estado.turno)
        break

      default:
        console.log("❌ Opção inválida")
    }
    if (estado.vencedor) return
  }
}

/* =========================
   MENU DE ATAQUE
========================= */
async function menuAtaque(jogadorAtual, jogadorOponente) {
  if (jogadorAtual.campo.criaturas.length === 0) {
    console.log("⚠️ Você não tem criaturas para atacar")
    return
  }

  const aindaTemAcoes =
    jogadorAtual.mao.length > 0 &&
    jogadorAtual.flags.podeAtacar

  if (aindaTemAcoes) {
    const confirmar = await perguntar(
      "\n⚠️ Você ainda pode jogar cartas. Ao atacar, não poderá mais utilizá-las. Deseja continuar? (1 = Sim | 0 = Não): "
    )

    if (confirmar !== "1") {
      console.log("↩️ Ataque cancelado")
      return
    }
  }

  console.log("\nEscolha seu atacante:")
  jogadorAtual.campo.criaturas.forEach((c, i) => {
    console.log(
      `[${i + 1}] ${c.nome} ATK ${calcularATK(c, jogadorAtual)}`
    )
  })

  const atkIndex = Number(await perguntar("Número do atacante: ")) - 1
  const atacante = jogadorAtual.campo.criaturas[atkIndex]
  if (Number.isNaN(atkIndex)) {
    console.log("❌ Digite apenas o número da criatura")
    return
  }

  else if (!atacante || atacante.jaAtacou) {
    console.log("❌ Atacante inválido ou já atacou")
    return
  }

  // ataque direto
  if (jogadorOponente.campo.criaturas.length === 0) {
    await atacarJogador(atacante, jogadorOponente, estado)
    return
  }

  console.log("\nEscolha o alvo:")
  jogadorOponente.campo.criaturas.forEach((c, i) => {
    console.log(
      `[${i + 1}] ${c.nome} DEF ${calcularDEF(c, jogadorOponente)}`
    )
  })

  const defIndex = Number(await perguntar("Número do alvo: ")) - 1
  const defensor = jogadorOponente.campo.criaturas[defIndex]

  if (!defensor) {
    console.log("❌ Alvo inválido")
    return
  }

  await atacar(atacante, defensor, estado)
}

/* =========================
   MENU DE INDEX
========================= */

async function menuIndex() {
  const id = await perguntar("Digite o ID da carta: ")
  const carta = CARDS[id]

  if (!carta) {
    console.log("❌ Carta não encontrada")
    return
  }

  descreverCarta(carta, CARDS)
}


/* =========================
   MENU COMANDANTES
========================= */
async function menuComandante(jogadorAtual) {
  const comandantes = obterComandantesDoCampo(jogadorAtual)

  if (jogadorAtual.flags.trocouComandante) {
    console.log("⚠️ Você já trocou de comandante neste turno")
    return
  }

  if (comandantes.length === 0) {
    console.log("⚠️ Nenhum comandante disponível no campo")
    return
  }

  console.log("\n🟡 COMANDANTES DISPONÍVEIS:")

  comandantes.forEach((c, i) => {
    const ativo =
      jogadorAtual.campo.comandanteAtivo === c.instanciaId

    // extrai buffs
    const buffs = []

    // efeitos inline
    c.efeitos?.forEach(e => {
      if (e.tipo === "BuffGlobal") {
        buffs.push(`${e.atributo} +${e.valor}`)
      }
    })

    // efeitos por ID
    c.efeitosId?.forEach(id => {
      const efeito = EFFECTS[id]
      if (efeito?.tipo === "BuffGlobal") {
        buffs.push(`${efeito.atributo} +${efeito.valor}`)
      }
    })

    console.log(
      `[${i + 1}] ${c.nome} (${c.id})`
    )
    console.log(
      `    Status: ${ativo ? "🟢 ATIVO" : "⚪ INATIVO"}`
    )
    console.log(
      `    Buff: ${buffs.length ? buffs.join(", ") : "Nenhum"}`
    )
  })

  const escolha = Number(
    await perguntar("Escolha o comandante (0 para cancelar): ")
  )

  if (escolha === 0) return

  const escolhido = comandantes[escolha - 1]
  if (!escolhido) {
    console.log("❌ Comandante inválido")
    return
  }

  jogadorAtual.campo.comandanteAtivo = escolhido.instanciaId
  jogadorAtual.flags.trocouComandante = true

  console.log(
    `⭐ ${escolhido.nome} agora é o comandante ativo`
  )
}

/* =========================
   LOOP PRINCIPAL DO JOGO
========================= */
while (!estado.vencedor && estado.turno <= 20) {
  await executarTurno(estado.jogadorAtual)
  estado.jogadorAtual = 1 - estado.jogadorAtual
  estado.turno++
}

while (!estado.vencedor) {
  jogo();
}