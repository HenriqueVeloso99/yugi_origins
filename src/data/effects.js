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

  REVIVER_MONSTRO_EFFECT:{
    tipo:"Reviver",
    origensPermitidas: ["Cemitério"],
    EstrelasMax: 5,

    descricao: "Pode reviver um monstro do cemitério de até 5 estrelas"
  },

  DESTRUICAO_ARMADILHA: {
    tipo: "Destruir",
    alvo: "CriaturaMaisForte"
  },

  CILINDRO_MAGICO_EFFECT: {

    tipo: "CilindroMagico",
    gatilho: "AtaqueDeclarado",
    alvo: "Oponente",
    descricao:
      "Quando um monstro do oponente declara ataque: o ataque é cancelado e o atacante recebe dano igual à metade do seu ATK."
  },

  FORCA_ESPELHO_EFFECT: {
    tipo: "DestruirMultiplos",
    alvo: "Oponente",
    gatilho: "AtaqueDeclarado",
    descricao: "Destrói todos os monstros que declararam ataque neste turno"
  },

  RUGIDO_TERRA_EFFECT: {
    tipo: "DestruirAlvo",
    alvo: "Oponente",
    gatilho: "InvocadoEsteTurno",
    descricao: "Destrói o monstro que acabou de ser invocado"
  },

  PRISAO_DIMENSIONAL_EFFECT: {
    tipo: "BanirMonstro",
    alvo: "Oponente",
    gatilho: "AtaqueDeclarado",
    descricao: "Bana o monstro que declarou ataque"
  },

  RITUAL_LUSTRO_NEGRO_EFFECT: {

    tipo: "Ritual",
    estrelasMin: 7,
    origensPermitidas: ["Mao", "Campo"],
    criatura: "KN003"

  }
}