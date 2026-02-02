import { EFFECTS } from "./effects.js"
import { CARDS } from "../data/cards.js"

export const TAG_DESCRICOES = {
  Comandante: carta => {
    const buffs = []

    // efeitos inline
    carta.efeitos?.forEach(e => {
      if (e.tipo === "BuffGlobal") {
        buffs.push(formatarBuff(e))
      }
    })

    // efeitos por ID
    carta.efeitosId?.forEach(id => {
      const efeito = EFFECTS[id]
      if (efeito?.tipo === "BuffGlobal") {
        buffs.push(formatarBuff(efeito))
      }
    })

    return `
🟡 COMANDANTE
Enquanto estiver ativo:
${buffs.length ? buffs.map(b => `• ${b}`).join("\n") : "• Sem bônus direto"}
`
  },

  Fusao: carta => {
    const mats = carta.fusao?.materiais ?? []
    return `
🔮 FUSÃO
Materiais necessários:
${mats.map(m => `• ${m.id}`).join("\n")}
`
  },

  Ritual: carta => `
🟣 RITUAL
Só pode ser invocada por magia ritual específica
`
}

function formatarBuff(efeito) {
  let texto = `${efeito.atributo} +${efeito.valor}`

  if (efeito.faccao) {
    texto += ` (${efeito.faccao})`
  }

  if (efeito.condicao === "ComandanteAtivo") {
    texto += " enquanto for comandante"
  }

  return texto
}

export function descreverCarta(carta, CARDS) {
  console.log(`\n📘 INDEX — ${carta.nome}`)
  console.log(`ID: ${carta.id}`)
  console.log(`Tipo: ${carta.tipoCarta}`)

  if (carta.tipoCarta === "Criatura") {
    descreverCriatura(carta, CARDS)
  }

  if (carta.tipoCarta === "Magia") {
    descreverMagia(carta)
  }

  if (carta.tipoCarta === "Armadilha") {
    descreverArmadilha(carta)
  }
}

function descreverCriatura(carta, CARDS) {
  console.log(`⭐ Estrelas: ${carta.estrelas}`)
  console.log(`ATK ${carta.ataque} / DEF ${carta.defesa}`)
  console.log(`Facção: ${carta.faccao}`)

  if (carta.palavrasChave?.length) {
    console.log("\n🏷️ Tags:")
    carta.palavrasChave.forEach(tag => {
      const fn = TAG_DESCRICOES[tag]
      if (fn) console.log(fn(carta))
      else console.log(`• ${tag}`)
    })
  }

  // 🟣 Ritual: mostrar magia que invoca
  if (carta.palavrasChave?.includes("Ritual")) {
    const magiasRitual = Object.values(CARDS).filter(c =>
      c.tipoCarta === "Magia" &&
      c.efeitosId?.some(id => {
        const efeito = EFFECTS[id]
        return efeito?.tipo === "Ritual" && efeito.criatura === carta.id
      })
    )

    if (magiasRitual.length) {
      console.log("\n🟣 Invocada por Ritual:")
      magiasRitual.forEach(m =>
        console.log(`• ${m.nome} (${m.id})`)
      )
    }
  }

  // 🔍 fusões possíveis
  const fusoesPossiveis = Object.values(CARDS).filter(c =>
    c.fusao?.materiais?.some(m => m.id === carta.id)
  )

  if (fusoesPossiveis.length) {
    console.log("\n🔮 Pode ser usada em fusão para:")
    fusoesPossiveis.forEach(f => {
      console.log(`• ${f.nome} (${f.id})`)
    })
  }
}

function descreverMagia(carta) {
  console.log(`🪄 Subtipo: ${carta.subTipo ?? "Magia comum"}`)

  const efeitos = carta.efeitos ?? []
  const ids = carta.efeitosId ?? []

  console.log("\n📜 Efeitos:")

  carta.efeitosId?.forEach(id => {
    const efeito = EFFECTS[id]

    if (efeito?.tipo === "Ritual") {
      const alvo = CARDS[efeito.criatura]
      console.log(
        `• Ritual: invoca ${alvo?.nome ?? efeito.criatura} (⭐${efeito.estrelasMin})`
      )
    } else if (efeito?.descricao) {
      console.log(`• ${efeito.descricao}`)
    } else {
      console.log(`• ${efeito?.tipo}`)
    }
  })

}

function descreverArmadilha(carta) {
  console.log("🪤 Armadilha")

  carta.efeitosId?.forEach(id => {
    const efeito = EFFECTS[id]

    if (efeito?.descricao) {
      console.log(`• ${efeito.descricao}`)
    } else {
      console.log(`• ${efeito.tipo}`)
    }
  })
}


