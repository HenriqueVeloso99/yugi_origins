export const EFFECTS = {

  MAGO_NEGRO_BUFF: {
    tipo: "BuffGlobal",
    alvo: "Aliados",
    faccao: "Dark",
    atributo: "ATK",
    valor: 200,
    condicao: "ComandanteAtivo"
  },

  PALADINO_BUFF: {
    tipo: "BuffGlobal",
    alvo: "Aliados",
    faccao: "Dark",
    atributo: "ATK",
    valor: 300,
    condicao: "ComandanteAtivo"
  },

  POTE_GANANCIA_EFFECT: {

    tipo: "Compra",
    quantidade: 2
  },

  CILINDRO_MAGICO_EFFECT: {

    tipo: "CilindroMagico",
    gatilho: "AtaqueDeclarado",
     descricao:
    "Quando um monstro do oponente declara ataque: o ataque é cancelado e o atacante recebe dano igual à metade do seu ATK."
  },

  RITUAL_LUSTRO_NEGRO_EFFECT:{

    tipo: "Ritual",
    estrelasMin: 7,
    origensPermitidas: ["Mao","Campo"],
    criatura: "KN003"

  }
}