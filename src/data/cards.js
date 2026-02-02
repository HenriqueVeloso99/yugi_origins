// cards.js
const TIPO_CARTA = {
    CRIATURA: "Criatura",
    MAGIA: "Magia",
    ARMADILHA: "Armadilha",
    ESPECIAL: "Especial"
}

const FACCAO = {
    DARK: "Dark",
    DRAGON: "Dragon",
    SKULL: "Skull",
    KNIGHT: "Knight",
    DEMON: "Demon",
    TOON: "Toon",
    MACHINE: "Machine",
    DIVINO: "Divino",
    EXODIA: "Exodia"
}

export const CARDS = {
    DM001: {
        id: "DM001",
        nome: "Mago Negro",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DARK,
        estrelas: 6,
        ataque: 2200,
        defesa: 1900,
        palavrasChave: ["Comandante"],
        efeitosId: ["MAGO_NEGRO_BUFF"]
    },

    DM002: {
        id: "DM002",
        nome: "Paladino Negro",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DARK,
        estrelas: 7,
        ataque: 2800,
        defesa: 2500,
        palavrasChave: ["Comandante", "Fusao"],

        fusao: {
            materiais: [
                { id: "DM001", origem: ["Campo", "Mao"] },
                { id: "KN001", origem: ["Campo", "Mao"] }
            ],
            consome: true
        },

        efeitosId: ["PALADINO_BUFF"]
    },

    DR001:
    {
        id: "DR001",
        nome: "Mestre dos Dragões",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DRAGON,
        estrelas: 7,
        ataque: 2900,
        defesa: 2250,

        palavrasChave: ["Comandante",],

        efeitos: [
            {
                tipo: "BuffGlobal",
                alvo: "Aliados",
                faccao: FACCAO.DRAGON,
                atributo: "ATK",
                valor: 300,
                penalidade: { atributo: "DEF", valor: -100 },
                condicao: "ComandanteAtivo"
            }
        ]
    },

    DR002:
    {
        id: "DR002",
        nome: "Dragão Branco de Olhos Azuis",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DRAGON,
        estrelas: 7,
        ataque: 2800,
        defesa: 2300,
    },

    DR003:
    {
        id: "DR003",
        nome: "Dragão Negro de Olhos Vermelhos",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DRAGON,
        estrelas: 6,
        ataque: 2400,
        defesa: 2000,

    },

    DE001:
    {
        id: "DE001",
        nome: "Kuriboh",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DEMON,
        estrelas: 1,
        ataque: 300,
        defesa: 200,

    },

    SK001:
    {
        id: "SK001",
        nome: "Caveira Sumonada",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.SKULL,
        estrelas: 6,
        ataque: 2500,
        defesa: 1300,

        palavrasChave: ["Comandante"],

        efeitos: [
            {
                tipo: "BuffGlobal",
                alvo: "Aliados",
                faccao: FACCAO.SKULL,
                atributo: "DEF",
                valor: 200,
                condicao: "ComandanteAtivo"
            }
        ]
    },

    KN001:
    {
        id: "KN001",
        nome: "Blader Notável",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.KNIGHT,
        estrelas: 6,
        ataque: 1700, //nerf de 900 em prol do efeito
        defesa: 2100,

        efeitos: [
            //Ganha 500 ATK para cada monstro Dragão no campo ou cemitério do oponente
        ]
    },

    KN002:
    {
        id: "KN002",
        nome: "Guardião Celta",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.KNIGHT,
        estrelas: 3,
        ataque: 1400,
        defesa: 1000,

        efeitos: [

        ]
    },

    KN003: {
        id: "KN 003",
        nome: "Soldado Lustro Negro",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.KNIGHT,
        estrelas: 7,
        ataque: 2850,
        defesa: 2400,

        palavrasChave: ["Ritual"]
    },


    ZN001: {
        id: "ZN001",
        nome: "Mundo da Fantasia",
        tipoCarta: "Magia",
        subTipo: "Zona",
        faccao: FACCAO.TOON,

        efeitos: [
            {
                tipo: "BuffGlobal",
                alvo: "Aliados",
                penalidade: { atributo: "PV", valor: -1000 },
            }
        ]
    },

    MG001: {
        id: "MG001",
        nome: "Pote da Ganância",
        tipoCarta: TIPO_CARTA.MAGIA,
        subTipo: "Compra",

        efeitosId: ["POTE_GANANCIA_EFFECT"]
    },

    MG002: {
        id: "MG002",
        nome: "Ritual do Lustro Negro",
        tipoCarta: TIPO_CARTA.MAGIA,
        subTipo: "Ritual",

        efeitosId: ["RITUAL_LUSTRO_NEGRO_EFFECT"]

    },

    MG003: {
        id: "MG003",
        nome: "Revivier Monstro",
        tipoCarta: TIPO_CARTA.MAGIA,
        subTipo: "Reviver",

        efeitosId: ["REVIVER_MONSTRO_EFFECT"]

    },

    MG010: {
        id: "MG010",
        nome: "Polimerização",
        tipoCarta: TIPO_CARTA.MAGIA,
        subTipo: "Fusao",

        efeitos: [
            {
                tipo: "Fusao"
            }
        ]
    },

    MG021: {
        id: "MG021",
        nome: "Chamado das Trevas",
        tipoCarta: TIPO_CARTA.MAGIA,
        subTipo: "Busca",
        faccao: FACCAO.DARK,

        limitePorTurno: true, //Busca

        efeitos: [
            {
                tipo: "BuscarNoDeck",
                filtro: { faccao: FACCAO.DARK },
                quantidade: 1
            }
        ]
    },

    TR001: {
        id: "TR001",
        nome: "Cilindro Mágico",
        tipoCarta: TIPO_CARTA.ARMADILHA,

        gatilho: "AtaqueDeclarado",
        efeitosId: ["CILINDRO_MAGICO_EFFECT"]
    },

    TR002: {
        id: "TR006",
        nome: "Força do Espelho",
        tipoCarta: TIPO_CARTA.ARMADILHA,
        gatilho: "AtaqueDeclarado",
        descricao: "Quando um monstro do oponente declara ataque: destrói todos os monstros atacantes do oponente",
        efeitosId: ["FORCA_ESPELHO_EFFECT"]
    },

    TR003: {
        id: "TR007",
        nome: "Rugido da Terra",
        tipoCarta: TIPO_CARTA.ARMADILHA,
        gatilho: "InvocacaoCriatura",
        descricao: "Quando seu oponente invoca um monstro: você pode destruir essa criatura",
        efeitosId: ["RUGIDO_TERRA_EFFECT"]
    },

    TR004: {
        id: "TR008",
        nome: "Prisão Dimensional",
        tipoCarta: TIPO_CARTA.ARMADILHA,
        gatilho: "AtaqueDeclarado",
        descricao: "Quando um monstro do oponente ataca: bana o monstro atacante",
        efeitosId: ["PRISAO_DIMENSIONAL_EFFECT"]
    },

    EG001: {
        id: "EG001",
        nome: "Obelisco",
        tipoCarta: TIPO_CARTA.ESPECIAL,
        faccao: FACCAO.DIVINO,
        ataque: 3100,
        defesa: 3500,

        imunidades: ["Criaturas"],

        restricoes: {
            posInvocacao: "SemInvocarCriaturasProximoTurno"
        }
    },

    EG002: {
        id: "EG002",
        nome: "Slifer",
        tipoCarta: TIPO_CARTA.ESPECIAL,
        faccao: FACCAO.DIVINO,
        ataque: 3500,
        defesa: 3100,

        imunidades: ["Armadilhas"],

        restricoes: {
            posInvocacao: "SemInvocarCriaturasProximoTurno"
        }
    },

    EG003: {
        id: "EG003",
        nome: "Drgão Alado de Rá",
        tipoCarta: TIPO_CARTA.ESPECIAL,
        faccao: FACCAO.DIVINO,
        ataque: 3250,
        defesa: 3250,

        imunidades: ["Magias de Zona"],

        restricoes: {
            posInvocacao: "SemInvocarCriaturasProximoTurno"
        }
    },

    EX001: {
        id: "EX001",
        nome: "Braço Direito do Exodia",
        tipoCarta: TIPO_CARTA.EXODIA,
        faccao: FACCAO.EXODIA,
        parteExodia: true
    },

    EX002: {
        id: "EX002",
        nome: "Braço Esquerdo do Exodia",
        tipoCarta: TIPO_CARTA.EXODIA,
        faccao: FACCAO.EXODIA,
        parteExodia: true
    },

    EX003: {
        id: "EX003",
        nome: "Perna Direita do Exodia",
        tipoCarta: TIPO_CARTA.EXODIA,
        faccao: FACCAO.EXODIA,
        parteExodia: true
    },

    EX004: {
        id: "EX004",
        nome: "Perna Esquerda do Exodia",
        tipoCarta: TIPO_CARTA.EXODIA,
        faccao: FACCAO.EXODIA,
        parteExodia: true
    },

    EX005: {
        id: "EX005",
        nome: "Torço do Exodia",
        tipoCarta: TIPO_CARTA.EXODIA,
        faccao: FACCAO.EXODIA,
        parteExodia: true
    },

    DM040: {
        id: "DM040",
        nome: "Ancião Pecador",
        tipoCarta: TIPO_CARTA.CRIATURA,
        faccao: FACCAO.DARK,
        estrelas: 6,
        ataque: 1300,
        defesa: 800,

        efeitos: [
            {
                tipo: "GerarExodia",
                intervaloTurnos: 2,
                custo: {
                    tipo: "Banir",
                    requisito: { estrelasMin: 4 }
                },
                limitePartida: 3,
                risco: "ResetExodiaSeSairDoCampo"
            }
        ]
    }

}