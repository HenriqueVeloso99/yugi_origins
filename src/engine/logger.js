import { calcularATK, calcularDEF } from "./engine.js"
import "./state.js"
import { CARDS } from "../data/cards.js"
import * as RULES from "./rules.js"




function logCampo(jogador) {
    
    const semCriaturas = jogador.campo.criaturas.length === 0
    const semArmadilhas = jogador.campo.armadilhas.length === 0

    if (semCriaturas && semArmadilhas) {
        console.log("🧙 Campo: (vazio)")
        return
    }
    console.log("🧙 Campo:")

    jogador.campo.criaturas.forEach((criatura, i) => {
        const atk = calcularATK(criatura, jogador)
        const def = calcularDEF(criatura, jogador)

        console.log(
            `  [${i + 1}] ${criatura.nome} (${criatura.faccao})`
        )
        console.log(
            `      ATK ${atk} / DEF ${def}`
        )
    })

    if (jogador.campo.armadilhas.length > 0) {
        console.log("🪤 Armadilhas:")

        jogador.campo.armadilhas.forEach((a, i) => {
            if (a.oculto) {
                console.log(`  [${i + 1}] Carta Desconhecida`)
            } else {
                console.log(`  [${i + 1}] ${a.nome}`)
            }
        })
    }
}

export function logResumoTurno(jogadorAtual, jogadorOponente,turno) {

    console.log("\n📊 ESTADO ATUAL")
    const limite = RULES.estrelasPermitidas(turno)
    console.log(`⭐ Limite de estrelas neste turno: ${limite === Infinity ? "Sem limite": limite}`)

    console.log(
        `👤 Você: ❤️   PV: ${jogadorAtual.pv}  | 📦 Deck ${jogadorAtual.deck.length} | ✋ Mão ${jogadorAtual.mao.length} | ☠️   Cemitério ${jogadorAtual.cemiterio.length}`
    )
    logCampo(jogadorAtual)

    console.log(
        `\n👤 Oponente: ❤️   PV: ${jogadorOponente.pv}  | 📦 Deck ${jogadorOponente.deck.length} | ✋ Mão ${jogadorOponente.mao.length} | ☠️   Cemitério ${jogadorOponente.cemiterio.length}`
    )
    logCampo(jogadorOponente)
}

export function logMao(jogador) {
    console.log("\n✋ SUA MÃO:")

    if (jogador.mao.length === 0) {
        console.log("  (vazia)")
        return
    }

    jogador.mao.forEach((cardId, index) => {
        const carta = CARDS[cardId]

        let extra = ""
        if (carta.tipoCarta === "Criatura") {
            extra = `⭐${carta.estrelas}`
        } else if (carta.tipoCarta === "Magia") {
            extra = `• ${carta.subTipo ?? "Magia"}`
        }

        console.log(
            `[${index + 1}] ${cardId} — ${carta.nome} (${carta.tipoCarta} ${extra})`
        )
    })
}

//Input
import readline from "readline"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


export function perguntar(pergunta) {
    return new Promise(resolve => {
        rl.question(pergunta, resposta => {
            resolve(resposta.trim())
        })
    })
}


export function fecharInput() {
    rl.close()
}