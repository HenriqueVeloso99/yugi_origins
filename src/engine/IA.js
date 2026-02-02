import { jogarCartaDaMao, atacar, atacarJogador, calcularATK, calcularDEF, resolverRitual } from "./engine.js"
import { CARDS } from "../data/cards.js"
import * as RULES from "./rules.js"
import { EFFECTS } from "../data/effects.js"
import { logResumoTurno } from "./logger.js"

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function avaliarAtaque(atacante, defensor, jogadorIA, jogadorOponente) {
  const atk = calcularATK(atacante, jogadorIA)
  const def = calcularDEF(defensor, jogadorOponente)

  // perder criatura sem ganho
  if (atk < def) return -100
  // troca 1 por 1 (empate)
  if (atk === def) return -10
  // vitória
  let score = 50

  // dano excedente (criaturas ⭐6+)
  if (atacante.estrelas >= 6) {
    score += (atk - def)
  }

  // bônus se matar comandante
  if (
    jogadorOponente.campo.comandanteAtivo === defensor.instanciaId
  ) {
    score += 40
  }
  return score
}

//Avaliar Ritual
async function tentarRitualIA(jogador, estado) {
  // procura uma magia ritual na mão
  const magiaRitualId = jogador.mao.find(id => {
    const carta = CARDS[id]
    return carta?.tipoCarta === "Magia" &&
      carta.subTipo === "Ritual"
  })

  if (!magiaRitualId) return false

  const magiaRitual = CARDS[magiaRitualId]
  const efeitoRitualId = magiaRitual.efeitosId?.find(eid => {
    return EFFECTS[eid]?.tipo === "Ritual"
  })

  const efeitoRitual = efeitoRitualId
    ? EFFECTS[efeitoRitualId]
    : magiaRitual.efeitos?.find(e => e.tipo === "Ritual")


  if (!efeitoRitual) return false

  const criaturaRitual = CARDS[efeitoRitual.criatura]
  if (!criaturaRitual) return false

  // coleta possíveis sacrifícios (campo + mão)
  let estrelas = 0
  const sacrificios = []

  if (efeitoRitual.origensPermitidas.includes("Campo")) {
    jogador.campo.criaturas.forEach(c => {
      estrelas += c.estrelas
      sacrificios.push({ origem: "Campo", carta: c })
    })
  }

  if (efeitoRitual.origensPermitidas.includes("Mao")) {
    jogador.mao.forEach(id => {
      const c = CARDS[id]
      if (c?.tipoCarta === "Criatura" && c.id !== criaturaRitual.id) {
        estrelas += c.estrelas
        sacrificios.push({ origem: "Mao", carta: c, id })
      }
    })
  }

  if (estrelas < efeitoRitual.estrelasMin) return false

  // ✅ Executa ritual automaticamente
  console.log(`🤖 IA realizou o ritual de ${criaturaRitual.nome}`)

  const sucesso = await resolverRitual(
    efeitoRitual,
    jogador,
    estado,
    "IA"
  )

  if (sucesso) {
    // magia ritual vai para o cemitério
    const idx = jogador.mao.indexOf(magiaRitualId)
    if (idx !== -1) {
      jogador.mao.splice(idx, 1)
      jogador.cemiterio.push(magiaRitualId)
    }

    logResumoTurno(jogador, estado.jogadores[0], estado.turno)
  }

  return true
}

export async function turnoIA(jogador, oponente, estado) {

  console.log("\n🤖 TURNO DA IA")
  await esperar(800)

  // 1️⃣ Tentar ritual
  let invocacaoEspecialFeita = false
  const ritualFeito = await tentarRitualIA(jogador, estado)
  if (ritualFeito) {
    invocacaoEspecialFeita = true
    await esperar(800)
  }



  // 2️⃣ Jogar criatura normal
  if (!invocacaoEspecialFeita) {
    const cartaCriatura = jogador.mao.find(id => {
      const carta = CARDS[id]
      const limite = RULES.estrelasPermitidas(estado.turno)

      if (!carta) return false
      if (carta.tipoCarta !== "Criatura") return false
      if (carta.palavrasChave?.includes("Ritual")) return false
      if (carta.palavrasChave?.includes("Fusao")) return false
      if (carta.estrelas > limite) return false

      return true
    })

    if (cartaCriatura) {
      console.log(`🤖 IA invocou ${CARDS[cartaCriatura].nome}`)
      jogarCartaDaMao(cartaCriatura, jogador, estado)

      logResumoTurno(jogador, estado.jogadores[0], estado.turno)

      await esperar(800)
    }
  }

  // 2️⃣ Ataque
  if (estado.turno > 2) {
    for (const atacante of jogador.campo.criaturas) {

      if (atacante.jaAtacou) continue

      // ataque direto sempre é bom
      if (oponente.campo.criaturas.length === 0) {
        await atacarJogador(atacante, oponente, estado)
        continue
      }

      let melhorAlvo = null
      let melhorScore = -Infinity

      for (const defensor of oponente.campo.criaturas) {
        const score = avaliarAtaque(
          atacante,
          defensor,
          jogador,
          oponente
        )

        if (score > melhorScore) {
          melhorScore = score
          melhorAlvo = defensor
        }
      }

      // só ataca se não for suicídio
      if (melhorScore > 0 && melhorAlvo) {
        await atacar(atacante, melhorAlvo, estado)
      }
    }
  }

  // 5️ Usar magias simples (Compra / Busca)
  for (const id of [...jogador.mao]) {
    const carta = CARDS[id]
    if (!carta) continue

    if (
      carta.tipoCarta === "Magia" &&
      (carta.subTipo === "Compra" || carta.subTipo === "Busca")
    ) {
      console.log(`🤖 IA ativou ${carta.nome}`)
      await jogarCartaDaMao(id, jogador, estado)
      await esperar(600)
      break // usa só uma por turno
    }
  }

  // 6️⃣ Setar armadilha
  for (const id of [...jogador.mao]) {
    const carta = CARDS[id]
    if (!carta) continue

    if (carta.tipoCarta === "Armadilha") {
      console.log("🤖 IA setou uma armadilha")
      await jogarCartaDaMao(id, jogador, estado)
      await esperar(600)
      break // só 1 por turno
    }
  }

}