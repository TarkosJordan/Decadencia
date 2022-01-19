class Rastreamento {
    constructor(context) {
        this.Context = context;
    }

    init(serialNumber, Map, event, program = "", startTime = "") {
        pvi.runInstructionS("ras.init", ["true", serialNumber, Map.join(";"), event, program, startTime,]);
    }

    setRepot(serialNumber, relatorio) {
        pvi.runInstructionS("ras.setreport", [serialNumber, JSON.stringify(relatorio), true,]);
    }

    end(serialNumber, Falhas) {
        var sucess;
        var endTime = "";
        var informationText = "";

        Falhas.size == 0 ? (sucess = true) : (sucess = false);

        pvi.runInstructionS("ras.end", ["true", serialNumber, sucess, informationText, endTime,]);
    }
}

/**
 * Classe que descreve um relatorio de teste
 * @class
 */
class RelatorioTeste {
    /**
     * @constructs RelatorioTeste
     * @param {string} programa
     * @param {string} versao
     * @param {number} setup
     * @param {number} teste
     * @param {Array} funcional
     * @param {Array} componente
     */
    constructor(programa, versao, setup, teste, funcional, componente) {
        this.Programa = programa;
        this.Versao = versao;
        this.TempoSetup = setup;
        this.TempoTeste = teste;

        //opcionais
        this.TesteFuncional = funcional ? funcional : [];
        this.TesteComponentes = componente ? componente : [];
    }

    /**
     * Adiciona um teste funcional ao array de testes funcionais
     * @memberof RelatorioTeste
     * @param {string} descricao Descrição do teste (string longa)
     * @param {string} nome Nome do teste (utilizado na pesquisa. ex : E1, S1 ...)
     * @param {number} cod Codigo de falha (-1 se nao tem)
     * @param {boolean} resultado True ou False
     *
     * Exemplo:
     * AddTesteFuncional("Impossível comunicar", "COM", -1, true)
     */
    AddTesteFuncional(descricao, nome, cod, resultado) {
        this.TesteFuncional.push({
            Codigo: cod,
            Resultado: resultado,
            Descricao: descricao,
            Nome: nome,
        });
    }

    /**
     * Adiciona um teste de componente ao array de testes de componentes
     * @memberof RelatorioTeste
     * @param {number} pino Numero do pino (-1 se não tem)
     * @param {number} valor Valor medido (com decimais)
     * @param {string} designator Designator do componente (R1, T1 ...)
     * @param {number} referencia Valor de referência (com decimais)
     * @param {number} aceitacao Porcentagem de aceitação (+/-)
     * @param {string} etapa Etapa do componente
     * @param {number} cod Codigo de falha (-1 se nao tem)
     * @param {boolean} resultado True ou False
     *
     * Exemplo:
     * AddTesteComponente(-1, 311.2, "VccVoltage", 311.0, 5, "G", -1, true)
     */
    AddTesteComponente(pino, valor, designator, referencia, aceitacao, etapa, cod, resultado) {
        this.TesteComponentes.push({
            Pino: pino,
            Valor: valor,
            Designator: designator,
            Referencia: referencia,
            Aceitacao: aceitacao,
            Etapa: etapa,
            Codigo: cod,
            Resultado: resultado,
        });
    }
}










