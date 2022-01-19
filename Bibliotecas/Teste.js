class Teste {
    constructor(context) {
        this.Context = context;
    }

    /**
     * IMPORTANTE! A etapa de finalização passada para busca NÃO DEVE se repetir na máquina de estados configurada
     * @param {string} etapaFinalizacao Nome da etapa que deseja retornar o índice da máquina de estados
     * @returns Índice 
     */
    buscaEtapaFinalizacao(etapaFinalizacao) {
        try {
            let indiceFinalizacao = null;
            this.Context.EtapasDeTeste.forEach((etapa, indice) => {
                if (etapa == etapaFinalizacao) {
                    indiceFinalizacao = indice;
                }
            });
            return (indiceFinalizacao);

        } catch (error) {
            console.log("Impossível localizar índice do estado passado.");
        }
    }

    /**
     * 
     * @param {string} msg msg sobre o LEd
     * @param {string} imagem Representação do LED no produto
     * @param {string} setup String de configuração de relés (Opcional)
     * @param {function} callback 
     */
    VerificaLED(obj, callback) {
        this.Context.Ui.setImage(obj.imagem);
        this.Context.Ui.setMsg(obj.msg);

        setTimeout(() => {
            if (obj.setup != undefined) {
                this.testeSetup(obj.setup, () => { });
            }
        }, obj.setupTimeout);

        this.Context.Ui.observerSimNao((opcao) => {
            if (opcao == "yes" || opcao == "ArrowUp" || opcao == "KeyS") {
                callback(true);
            } else {
                this.Context.TesteAtivo = false;
                callback(false);
            }
        });
    }


    /**
     * 
     * @param {number} potenciometro Valor que será passado para saída analógica para simular o potenciômetro
     * @param {number} timeOutEstabilizacao valor em ms.
     * @param {function} callback 
     */
    SaidaTriacHandler(potenciometro, timeOutEstabilizacao, callback) {
        this.setSaidaAnalogica(potenciometro);

        setTimeout(() => {

            this.ReadSaidaTriac()
                .then((resolve) => {

                    callback(MediaAritimetica(resolve));

                });

        }, timeOutEstabilizacao);

        function MediaAritimetica(amostras) {
            let soma = 0;
            amostras.forEach(amostra => {
                soma += amostra;
            });

            let media = soma / amostras.length;
            return media;
        }
    }

    /**
     *  
     * @returns Promise de leitura da tensão da saída triac
     */
    ReadSaidaTriac() {
        return new Promise(function (resolve) {

            let amostras = [];

            pvi.daq.in.voltageOrCurrent2.value.onChange = (value) => {
                amostras.push(value);
            };

            setTimeout(() => {

                pvi.daq.in.voltageOrCurrent2.value.onChange = () => { };

                if (amostras.length == 0) {

                    amostras.push(pvi.daq.in.voltageOrCurrent2.value.value);
                    resolve(amostras);

                } else if (amostras.length >= 0) {

                    resolve(amostras);

                }

            }, 2000);

        });

    }

    /*CONTROLERS*/

    /**
     * 
     * @param {number} an1 valor 16 bits na proporção 0V a 10V da saída analógica 1
     * @param {number} an2 valor 16 bits na proporção 0V a 10V da saída analógica 2
     */
    setSaidaAnalogica(an1 = 0, an2 = 0) {
        pvi.daq.confVan1(Number(an1));
        pvi.daq.confVan2(Number(an2));
    }

    /**
     * 
     * @param {number} an1 valor entre 0 e 60 na proporção de 0V a 60mV da saída analógica 1
     * @param {number} an2 valor entre 0 e 60 na proporção de 1,2V da saída analógica 2
     */
    setSaidaAnalogica_mV(an1 = 0, an2 = 0) {
        pvi.daq.confMv1(Number(an1));
        pvi.daq.confMv2(Number(an2));
    }

    setAlimentacao(tensao, callback = () => { }) {
        if (tensao == "AUX_ON") {
            pvi.daq.ligaAux220();
        } else if (tensao == "AUX_OFF") {
            pvi.daq.desligaAux220();
        } else if (tensao == "220") {
            pvi.daq.alimenta220();
        } else if (tensao == "110") {
            pvi.daq.alimenta110();
        } else if (tensao == "24") {
            pvi.daq.alimenta24();
        } else if (tensao == "12") {
            pvi.daq.alimenta12();
        } else {
            pvi.daq.desligaAlimentacao();
        }
        callback();
    }

    /**
* 
* @param {função} callback 
*/
    SaidasEnergizacaoSetRelatorio(callback) {

        if (this.Context.ConfigTest.hasOwnProperty("SaidasEnergizacao1")) {
            var saidasAcionadas1 = new Map(Object.entries(this.Context.ConfigTest.SaidasEnergizacao1));
        }

        if (this.Context.ConfigTest.hasOwnProperty("SaidasEnergizacao2")) {
            var saidasAcionadas2 = new Map(Object.entries(this.Context.ConfigTest.SaidasEnergizacao2));
        }



        if (this.Context.ConfigTest.hasOwnProperty("SaidasEnergizacao1")) {
            saidasAcionadas1.forEach((valorEsperado, entradaDaq) => {
                this.Context.RelatorioGeral.set("SEMPRE_ACIONADA_1_" + entradaDaq, false);
            });
        }

        if (this.Context.ConfigTest.hasOwnProperty("SaidasEnergizacao2")) {
            saidasAcionadas2.forEach((valorEsperado, entradaDaq) => {
                this.Context.RelatorioGeral.set("SEMPRE_ACIONADA_2_" + entradaDaq, false);
            });
        }
        callback();
    }

    /**
     * 
     * @param {função} callback 
     */
    SaidasEnergizacao1(callback) {
        var saidasAcionadas = new Map(Object.entries(this.Context.ConfigTest.SaidasEnergizacao1));

        saidasAcionadas.forEach((valorEsperado, entradaDaq) => {
            var command = "if (pvi.daq.in." + entradaDaq + ".value == " + valorEsperado + ") {" +
                "this.Context.RelatorioGeral.set('SEMPRE_ACIONADA_1_" + entradaDaq + "',true)" +
                "}";
            eval(command);
        });
        callback();
    }

    /**
* 
* @param {função} callback 
*/
    SaidasEnergizacao2(callback) {
        var saidasAcionadas = new Map(Object.entries(this.Context.ConfigTest.SaidasEnergizacao2));

        saidasAcionadas.forEach((valorEsperado, entradaDaq) => {
            var command = "if (pvi.daq.in." + entradaDaq + ".value == " + valorEsperado + ") {" +
                "this.Context.RelatorioGeral.set('SEMPRE_ACIONADA_2_" + entradaDaq + "',true)" +
                "}";
            eval(command);
        });
        callback();
    }

    TesteSaida() {

        var saidas = Object.entries(this.Context.ConfigTest.SaidasRl);

        self = this;

        saidas.forEach((valor) => {

            if (valor[1] != "NA") {
                var command =
                    "if (pvi.daq.in." + valor[1] + ".value){" +
                    "self.Context.RelatorioGeral.set('SaidaAC2',true)" +
                    "}" +
                    "else{" +
                    "self.Context.RelatorioGeral.set('SaidaAC2',false)" +
                    "}";
                eval(command);
            }
        });
    }

    testeSetup(conf, callback) {

        if (conf.includes("Aux")) {
            pvi.daq.ligaAux220();
        } else {
            pvi.daq.desligaAux220();
        }
        if (conf.includes("RL1")) {
            pvi.daq.ligaRele(1);
        } else {
            pvi.daq.desligaRele(1);
        }
        if (conf.includes("RL2")) {
            pvi.daq.ligaRele(2);
        } else {
            pvi.daq.desligaRele(2);
        }
        if (conf.includes("RL3")) {
            pvi.daq.ligaRele(3);
        } else {
            pvi.daq.desligaRele(3);
        }
        if (conf.includes("RL4")) {
            pvi.daq.ligaRele(4);
        } else {
            pvi.daq.desligaRele(4);
        }
        if (conf.includes("RL5")) {
            pvi.daq.ligaRele(5);
        } else {
            pvi.daq.desligaRele(5);
        }
        if (conf.includes("RL6")) {
            pvi.daq.ligaRele(6);
        } else {
            pvi.daq.desligaRele(6);
        }
        if (conf.includes("RL7")) {
            pvi.daq.ligaRele(7);
        } else {
            pvi.daq.desligaRele(7);
        }
        if (conf.includes("RL8")) {
            pvi.daq.ligaRele(8);
        } else {
            pvi.daq.desligaRele(8);
        }
        if (conf.includes("RL9")) {
            pvi.daq.ligaRele(9);
        } else {
            pvi.daq.desligaRele(9);
        }
        if (conf.includes("RL10")) {
            pvi.daq.ligaRele(10);
        } else {
            pvi.daq.desligaRele(10);
        }
        if (conf.includes("RL11")) {
            pvi.daq.ligaRele(11);
        } else {
            pvi.daq.desligaRele(11);
        }
        if (conf.includes("RL12")) {
            pvi.daq.ligaRele(12);
        } else {
            pvi.daq.desligaRele(12);
        }
        callback();
    }
    
    setupReles(configuracao = "", callback = ()=>{}) {

        let reles = configuracao.split(",")
        let relesParaAcionar = new Array()
        let relesParaDesacionar = new Array()
        relesParaAcionar = []
        relesParaDesacionar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        if(reles != ""){
            // Laco que preenche vetor de acionamento e remove os devidos elementos do vetor de desacionamento dos reles
            for(var indice = 0; indice < reles.length; indice++){
                relesParaAcionar.push(Number(reles[indice].substring(reles[indice].indexOf("RL") + "RL".length)))   // Separa o "RL" de cada elemento e popula vetor de acionamento com o numero do rele que sera acionado
                relesParaDesacionar.splice(relesParaDesacionar.indexOf(relesParaAcionar[indice]), 1)                // Busca o elemento (numero do rele) que deve ser acionado e remove do vetor de desacionamento
            }
        }
        // Sistema de timeouts garante que os desacionamentos dos reles serao executados antes dos acionamentos
        setTimeout(()=>{
            var selecionaRele
            for(var quantidadeReles = 0; quantidadeReles < relesParaDesacionar.length; quantidadeReles++){
                selecionaRele = relesParaDesacionar[quantidadeReles]
                pvi.daq.desligaRele(selecionaRele)
            }
        }, 300)
        setTimeout(()=>{
            var selecionaRele
            for(var quantidadeReles = 0; quantidadeReles < relesParaAcionar.length; quantidadeReles++){
                selecionaRele = relesParaAcionar[quantidadeReles]
                pvi.daq.ligaRele(selecionaRele)
            }
            callback()
        }, 900)
    }
}



