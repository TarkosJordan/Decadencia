class Main {
    constructor(MAP = ["TF"], EVT = "TF") {

        this.Evt = EVT;
        this.Map = MAP;
        this.dataErp = "";
        this.SerialNumber;
        this.ConfigTest = null;
        this.EtapaTesteAtual = null;
        this.TempoSetup = new Date();
        this.TempoTeste = null;

        this.Falhas = new Map();
        this.RelatorioTeste = new RelatorioTeste();
        this.TesteAtivo = true;
        this.EtapasDeTeste = null;
        this.RelatorioGeral = null;
        this.RelatorioSaida110 = null;
        this.RelatorioSaida220 = null;
        this.tempoResposta = 9000;
        this.tempoRetentativa = 5000;
        this.regexTestResponse = /[0][A][ ][0][6|3][ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}/
        this.ACK = "12"
        this.NACK = "10"

        // Desculpa Kroth
        // Parece redundante porem não...  
        this.tentativasComunicacao = 0          // Essa propriedade é para testar se a resposta do controlador esta com o tamanho do buffer estipulado e se o controlador respondeu ACK (ou um dado valido)
        this.tentativasMaxComunicacao = 3   
        this.tamanhoBuffer = 6                  
        this.numeroTentativasReqResp = 4        // Essa outra propriedade tem o intuito de servir como um parametro do metodo de requisição e resposta, esse metodo retorna uma resposta que conseguiu dar match com o regex passado como parametro
        // Em suma a 'this.numeroTentativasReqResp' auxilia na validação do formato da resposta (tenta de novo se o retorno for ruido ou nulo)
        // e a 'this.tentativasComunicacao' auxilia na validação do protocolo (tenta de novo se a quantidade de bytes for diferente do tamnho do buffer estipulado ou se o dado lido for invalido)

        // Inicializando propriedades que serão populadas com os comandos do protocolo
        this.modoTeste = ""
        this.piscaLedVerde = ""
        this.desligaLedVerde = ""
        this.piscaLedAmarelo = ""
        this.desligaLedAmarelo = ""
        this.statusEntradas = ""
        this.leituraTensaoEntrada = ""
        this.leituraTemperaturaNTC = ""
        this.leituraEntradaPotenciometro = ""

        this.Ui = new UI();
        this.Util = new Utils(this);
        this.TestProcedures = new Teste(this);
        this.Validations = new Validations(this);
        this.Rastreamento = new Rastreamento(this);
        this.JigTransceiver = new Serial(this, 9600, 0);

        this.Util.setState("TestConfig");
    }

    MaquinaDeEstados(state) {
        switch (state) {
            case "TestConfig":
                if (sessionStorage.getItem("FirstExec") != "true" && sessionStorage.getItem("ProductCode") == null) {
                    this.Util.initTest((value) => {
                        this.Util.requestERP(value, (dataErp) => {
                            if (dataErp != null) {
                                this.dataErp = dataErp;
                                if (this.dataErp.Information.ProductCode.match(/[0-9]{1,6}/) != null) {
                                    this.Util.configuraTest(this.dataErp.Information.ProductCode, (config) => {
                                        if (config != null) {
                                            this.ConfigTest = config;
                                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                            this.EtapaTesteAtual++;
                                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);

                                        } else {
                                            console.error("não foi encontrado o arquivo de configuração Json para esse produto");
                                            sessionStorage.clear();
                                        }
                                    });
                                } else {
                                    console.error("não foi encontrado o produto para esse numero de série");
                                    sessionStorage.clear();
                                }
                            } else {
                                console.error("Servidor erp não respondeu");
                                sessionStorage.clear();
                            }
                        });
                    });
                } else {
                    this.Util.configuraTest(sessionStorage.getItem("ProductCode"), (config) => {
                        if (config != null) {
                            this.ConfigTest = config;
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);

                        } else {
                            console.error("não foi encontrado o arquivo de configuração Json para esse produto");
                            sessionStorage.clear();
                        }
                    });
                }
                break;

            case "ConfiguraProtocolo":
                // Configurando comandos do protocolo através do .json
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("modoTeste"))                     {   this.modoTeste = this.ConfigTest.ConfiguracoesProtocolo.modoTeste   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("piscaLedVerde"))                 {   this.piscaLedVerde = this.ConfigTest.ConfiguracoesProtocolo.piscaLedVerde   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("desligaLedVerde"))               {   this.desligaLedVerde = this.ConfigTest.ConfiguracoesProtocolo.desligaLedVerde   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("piscaLedAmarelo"))               {   this.piscaLedAmarelo = this.ConfigTest.ConfiguracoesProtocolo.piscaLedAmarelo   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("desligaLedAmarelo"))             {   this.desligaLedAmarelo = this.ConfigTest.ConfiguracoesProtocolo.desligaLedAmarelo   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("statusEntradas"))                {   this.statusEntradas = this.ConfigTest.ConfiguracoesProtocolo.statusEntradas   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("leituraTensaoEntrada"))          {   this.leituraTensaoEntrada = this.ConfigTest.ConfiguracoesProtocolo.leituraTensaoEntrada   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("leituraTemperaturaNTC"))         {   this.leituraTemperaturaNTC = this.ConfigTest.ConfiguracoesProtocolo.leituraTemperaturaNTC   }
                if(this.ConfigTest.ConfiguracoesProtocolo.hasOwnProperty("leituraEntradaPotenciometro"))   {   this.leituraEntradaPotenciometro = this.ConfigTest.ConfiguracoesProtocolo.leituraEntradaPotenciometro   }

                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                this.EtapaTesteAtual++;
                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);

                break

            case "SetupInicial":
                this.Ui.setTitle(this.ConfigTest.ProductName);

                this.Falhas = new Map();
                this.EtapasDeTeste = new Map(Object.entries(this.ConfigTest.EtapasDeTeste));
                this.RelatorioGeral = new Map(Object.entries(this.ConfigTest.Relatorio.Geral));
                this.RelatorioSaida110 = new Map(Object.entries(this.ConfigTest.Relatorio.Saida110));
                this.RelatorioSaida220 = new Map(Object.entries(this.ConfigTest.Relatorio.Saida220));
                this.RelatorioRastreamento = new RelatorioTeste();

                if (sessionStorage.getItem("FirstExec") == "true") {
                    sessionStorage.setItem("FirstExec", "false");
                    this.Ui.modalInfo(this.ConfigTest.Imagens.Base, "Para prosseguir utilize:\n" + this.ConfigTest.BS + "\n" + this.ConfigTest.CNV + "\n" + this.ConfigTest.TRAFO, () => {
                        this.Ui.modalInfo(this.ConfigTest.Imagens.Agulhas, "Verifique se as agulhas instaladas estão de acordo com a imagem.\nSe não estiver, troque pelas agulhas do compartimento à direita.", () => {
                            this.Ui.modalInfo(this.ConfigTest.Imagens.Atencao, "ATENÇÃO!\nNÃO utilizar lâmpada série para esse teste!", () => {
                                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                this.EtapaTesteAtual++;
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            });
                        });
                    });
                } else {
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "StartRastreamento":
                this.Ui.getInsertedValue("Informe o numero de série do produto.", (serialcode) => {
                    if (serialcode != null) {
                        if (JSON.parse(this.ConfigTest.Rastreamento)) {
                            if (serialcode.match(/[1][0]{4}[0-9]{8}/)) {
                                PVI.FWLink.globalDaqMessagesObservers.addString('Observers.Rastreamento', "PVI.DaqScript.DS_Rastreamento.rastreamento");
                                this.Rastreamento.init(serialcode, this.Map, this.Evt);
                                this.SerialNumber = serialcode;
                                setTimeout(() => {
                                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    this.EtapaTesteAtual++;
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                }, 500);
                            } else {
                                this.Falhas.set("Rastreamento", "O número de série informado é inválido!");
                                this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("FinalizaTeste");
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }
                        } else {
                            console.warn("RASTREAMENTO DESABILITADO");
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        }
                    } else {
                        this.Falhas.set("Rastreamento", "O número de série não foi informado!");
                        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("FinalizaTeste");
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    }
                });
                break;

            case "EstabeleceComunicacaoTransceiver":  //Tambem faz com que a peca entre em modo de teste
                Serial.closeAllPorts()
                this.JigTransceiver.getConnectedPortCom(this.modoTeste, this.regexTestResponse, (retornoBooleano, portaEncontrada) => {
                    if(retornoBooleano){
                        console.log("Porta do transceiver encontrada em", portaEncontrada);
                        this.COMPORT = portaEncontrada
                        this.JigTransceiver.open(this.COMPORT);
                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    } else{
                        console.error("Porta COM não encontrada")
                        this.RelatorioTeste.AddTesteFuncional("Porta COM do transceiver não encontrada", "COM", -1, false)
                        this.Falhas.set("COM", "Não foi possível estabelecer comunicação com o transceiver")
                        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    }
                })
                break

            case "SetPotenciometroMin":
                this.Ui.setMsg("Gire todo potenciometro no sentido antihorario como sugere a ilustração.\n\nPressione avança")
                this.Ui.setImage(this.ConfigTest.Imagens.PotenciometroMin)
                this.Ui.observerAvanca(()=>{
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                })
                break

            case "LeituraPotMin":
                var leituraPotMin = null
                var leituraPotMinTarget = this.ConfigTest.Potenciometro.Min.Target
                var toleranciaLeituraPotMin = this.ConfigTest.Potenciometro.Min.Tolerancia

                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.leituraEntradaPotenciometro, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                leituraPotMin = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                if(leituraPotMin >= (leituraPotMinTarget - toleranciaLeituraPotMin) && leituraPotMin <= (leituraPotMinTarget + toleranciaLeituraPotMin)){
                                    logDeuBom("Potenciômetro funcionou normalmente")
                                    this.RelatorioTeste.AddTesteFuncional("Valor minimo do potenciômetro lido corretamente", "Potenciômetro", -1, true)
                                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    this.EtapaTesteAtual++
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                } else{
                                    console.error("Erro na leitura do potenciômetro no mínimo")
                                    this.RelatorioTeste.AddTesteFuncional("Falha na leitura do valor mínimo do potenciômetro", "Potenciômetro", -1, false)
                                    this.Falhas.set("Potenciômetro", "Falha na leitura do valor mínimo do potenciômetro")
                                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                }
                            } else{
                                throw (new Error("Controlador respondeu NACK para o comando de leitura de potenciometro, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do leituraEntradaPotenciometro falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        }
                    }
                })
                break

            case "SetPotenciometroMaximo":
                this.Ui.setMsg("Gire todo potenciômetro no sentido horario como sugere a ilustração.\n\nPressione avança")
                this.Ui.setImage(this.ConfigTest.Imagens.PotenciometroMin)
                this.Ui.observerAvanca(()=>{
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                })
                break

            case "LeituraPotMax":
                var leituraPotMax = null
                var leituraPotMaxTarget = this.ConfigTest.Potenciometro.Max.Target
                var toleranciaLeituraPotMax = this.ConfigTest.Potenciometro.Max.Tolerancia

                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.leituraEntradaPotenciometro, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                leituraPotMax = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                if(leituraPotMax >= (leituraPotMaxTarget - toleranciaLeituraPotMax) && leituraPotMax <= (leituraPotMaxTarget + toleranciaLeituraPotMax)){
                                    logDeuBom("Potenciômetro maximo funcionou")
                                    this.RelatorioTeste.AddTesteFuncional("Valor máximo do potenciômetro lido corretamente", "Potenciômetro", -1, true)
                                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    this.EtapaTesteAtual++
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                } else{
                                    console.error("Erro na leitura do potenciômetro no Máximo")
                                    this.RelatorioTeste.AddTesteFuncional("Falha na leitura do valor máximo do potenciômetro", "Potenciômetro", -1, false)
                                    this.Falhas.set("Potenciômetro", "Falha na leitura do valor máximo do potenciômetro")
                                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                }
                            } else{
                                throw (new Error("Controlador respondeu NACK para o comando de leitura de potenciometro, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do leituraEntradaPotenciometro falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        }
                    }
                })
                break

            case "SetPotenciometroMedio":
                this.Ui.setMsg("Gire o potenciometro até aproximadamente seu centro como sugere a ilustração.\n\nPressione avança")
                this.Ui.setImage(this.ConfigTest.Imagens.PotenciometroMedio)
                this.Ui.observerAvanca(()=>{
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                })
                break

            case "LeituraPotMedio":
                var leituraPotMedio = null
                var leituraPotMedioTarget = this.ConfigTest.Potenciometro.Medio.Target
                var toleranciaLeituraPotMedio = this.ConfigTest.Potenciometro.Medio.Tolerancia

                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.leituraEntradaPotenciometro, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                leituraPotMedio = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                if(leituraPotMedio >= (leituraPotMedioTarget - toleranciaLeituraPotMedio) && leituraPotMedio <= (leituraPotMedioTarget + toleranciaLeituraPotMedio)){
                                    logDeuBom("Potenciometro funcionou normalmente")
                                    this.RelatorioTeste.AddTesteFuncional("Valor médio do potenciômetro lido corretamente", "Potenciômetro", -1, true)
                                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    this.EtapaTesteAtual++
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                } else{
                                    console.error("Erro na leitura do potenciômetro no Médio")
                                    this.RelatorioTeste.AddTesteFuncional("Falha na leitura do valor médio do potenciômetro", "Potenciômetro", -1, false)
                                    this.Falhas.set("Potenciômetro", "Falha na leitura do valor médio do potenciômetro")
                                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                }
                            } else{
                                throw (new Error("Controlador respondeu NACK para o comando de leitura de potenciometro, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do leituraEntradaPotenciometro falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        }
                    }
                })
                break

            case "LeituraRede220V":
                var tensaoLida220V = null
                var tensaoTarget220V = this.ConfigTest.TensoesEntrada.Entrada220V.Target
                var toleranciaLeitura220V = this.ConfigTest.TensoesEntrada.Entrada220V.Tolerancia

                this.Ui.setMsg("Realizando a leitura da rede 220V\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.leituraTensaoEntrada, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                tensaoLida220V = stringByteHexToNumber(respostaReq[4])
                                if(tensaoLida220V >= (tensaoTarget220V - toleranciaLeitura220V) && tensaoLida220V <= (tensaoTarget220V + toleranciaLeitura220V)){
                                    logDeuBom("Detecção de tensão 220V na entrada funcionou corretamente")
                                    this.RelatorioTeste.AddTesteFuncional("Valor de tensão lido pelo controlador correto", "220V", -1, true)
                                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    this.EtapaTesteAtual++
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                } else{
                                    console.error("Erro na leitura de rede 220V")
                                    this.RelatorioTeste.AddTesteFuncional("Falha na leitura da tensão de alimentação", "220V", -1, false)
                                    this.Falhas.set("220V", "Falha na leitura da tensão de alimentação 220V")
                                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                }
                            } else{
                                throw (new Error("Controlador respondeu NACK para o comando de leitura de tensão 220V, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do leituraTensaoEntrada falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                        }
                    }
                })
                break

            case "LeituraRede110V":
                var tensaoLida110V = null
                var tensaoTarget110V = this.ConfigTest.TensoesEntrada.Entrada220V.Target
                var toleranciaLeitura110V = this.ConfigTest.TensoesEntrada.Entrada110V.Tolerancia

                this.Ui.setMsg("Realizando a leitura da rede 110V\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.leituraTensaoEntrada, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                tensaoLida110V = stringByteHexToNumber(respostaReq[4])
                                if(tensaoLida110V >= (tensaoTarget110V - toleranciaLeitura110V) && tensaoLida110V <= (tensaoTarget110V + toleranciaLeitura110V)){
                                    logDeuBom("Detecção de tensão 110V na entrada funcionou corretamente")
                                    this.RelatorioTeste.AddTesteFuncional("Valor de tensão lido pelo controlador correto", "110V", -1, true)
                                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    this.EtapaTesteAtual++
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                } else{
                                    console.error("Erro na leitura de rede 110V")
                                    this.RelatorioTeste.AddTesteFuncional("Falha na leitura da tensão de alimentação", "110V", -1, false)
                                    this.Falhas.set("110V", "Falha na leitura da tensão de alimentação 110V")
                                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                }
                            } else{
                                throw (new Error("Controlador respondeu NACK para o comando de leitura de tensão 110V, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do leituraTensaoEntrada falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                        }
                    }
                })
                break

            case "VerificaLedVerde":
                this.Ui.setMsg("Ligando Led Verde\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.piscaLedVerde, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq[4] == this.ACK && respostaReq.length == this.tamanhoBuffer){
                                this.tentativasComunicacao = 0
                                console.log("Controlador reconheceu o comando e respondeu com ACK no comando pisca led Verde")
                                this.Ui.setMsg("O Led Verde da peça está piscando? \n\nOBS.: Somente o Led Verde deve piscar")
                                this.Ui.observerSimNao((retornoBooleano)=>{
                                    if(retornoBooleano){
                                        this.RelatorioTeste.AddTesteFuncional("Led verde funcionou corretamente", "Led_Verde", -1, true)
                                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                        this.EtapaTesteAtual++
                                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    } else{
                                        this.RelatorioTeste.AddTesteFuncional("Falha no acionamento do led verde", "Led_Verde", -1, false)
                                        this.Falhas.set("Led_Verde", "Falha no acionamento do led verde")
                                        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                    }
                                })
                            } else{
                                throw (new Error("Controlador não respondeu ACK para o comando de piscar led Verde, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do piscaLedVerde falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                        }
                    }
                })
                break

            case "DesligaLedVerde":
                this.Ui.setMsg("Desligando Led Verde\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.desligaLedVerde, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq[4] == this.ACK && respostaReq.length == this.tamanhoBuffer){
                                this.tentativasComunicacao = 0
                                console.log("Controlador reconheceu o comando e respondeu com ACK no comando desligaLedVerde")
                                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                this.EtapaTesteAtual++
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }else{
                                throw (new Error("Controlador não respondeu ACK para o comando de desligar led Verde, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do desligaLedVerde falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                        }                        
                    }
                })
                break

            case "VerificaLedAmarelo":
                this.Ui.setMsg("Ligando Led Amarelo\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.piscaLedAmarelo, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq[4] == this.ACK && respostaReq.length == this.tamanhoBuffer){
                                this.tentativasComunicacao = 0
                                console.log("Controlador reconheceu o comando e respondeu com ACK no comando pisca led Amarelo")
                                this.Ui.setMsg("O Led Amarelo da peça está piscando? \n\nOBS.: Somente o Led Amarelo deve piscar")
                                this.Ui.observerSimNao((retornoBooleano)=>{
                                    if(retornoBooleano){
                                        this.RelatorioTeste.AddTesteFuncional("Led amarelo funcionou corretamente", "Led_Amarelo", -1, true)
                                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                        this.EtapaTesteAtual++
                                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                    } else{
                                        this.RelatorioTeste.AddTesteFuncional("Falha no acionamento do led amarelo", "Led_Amarelo", -1, false)
                                        this.Falhas.set("Led_Amarelo", "Falha no acionamento do led amarelo")
                                        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                    }
                                })
                            } else{
                                throw (new Error("Controlador não respondeu ACK para o comando de piscar led Amarelo, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do piscaLedAmarelo falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                        }
                    }
                })
                break

            case "DesligaLedAmarelo":
                this.Ui.setMsg("Desligando Led Amarelo\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.desligaLedAmarelo, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq[4] == this.ACK && respostaReq.length == this.tamanhoBuffer){
                                this.tentativasComunicacao = 0
                                console.log("Controlador reconheceu o comando e respondeu com ACK no comando desligaLedAmarelo")
                                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                this.EtapaTesteAtual++
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }else{
                                throw (new Error("Controlador não respondeu ACK para o comando de desligar led Amarelo, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do piscaLedAmarelo falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            this.RelatorioTeste.AddTesteFuncional("Tentativas de comunicação esgotadas", "Comunicação", -1, false)
                            this.Falhas.set("Comunicação", "Tentativas de comunicação esgotadas")
                            this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                        }                        
                    }
                })
                break
            case "TesteEntradasJaAcionadas":
                this.Ui.setMsg("Testando se existem entradas indevidamente acionadas\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.JigTransceiver.requisicaoResposta(this.statusEntradas, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                console.log("Pacote recebido coerente")
                                switch(respostaReq[4]){
                                    case "00":
                                        logDeuBom("Entradas OK!")
                                        // Setar no relatorio de teste
                                        break
                                    case "01":
                                        console.error("Entrada E1 indevidamente acionada")
                                        // Setar no relatorio
                                        break;
                                    case "02":
                                        console.error("Entrada E2 indevidamente acionada")
                                        // Setar no relatorio
                                        break
                                    case "04":
                                        console.error("Entrada E3 indevidamente acionada")
                                        // Setar no relatorio
                                        break
                                    default:
                                        console.error("Falha na leitura do parametro de validação para entradas não acionadas")
                                        // Setar no relatorio
                                        break
                                }
                            }else{
                                throw (new Error("Controlador respondeu NACK para o comando de status de entradas, ou buffer de resposta maior do que o estipulado"))
                            }
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        } else{
                            throw (new Error("Comando de requisição e resposta do comando statusEntradas falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            //Finaliza teste e seta no relatorio erro na comunicacao
                        }                        
                    }
                })
                break
            case "TesteEntradaDigital_E1":
                this.Ui.setMsg("Testando Entrada Digital E1\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.TestProcedures.setupReles(this.ConfigTest.EntradasDigitais.E1)
                this.JigTransceiver.requisicaoResposta(this.statusEntradas, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                console.log("Pacote recebido coerente")
                                switch(respostaReq[4]){
                                    case "01":
                                        logDeuBom("Entrada E1 funcinou")
                                        // Setar no relatorio de teste
                                        break
                                    case "03":
                                        console.error("Entrada E1 e E2 em curto")
                                        // Setar no relatorio
                                        break;
                                    case "05":
                                        console.error("Entrada E1 e E3 em curto")
                                        // Setar no relatorio
                                        break
                                    case "07":
                                        console.error("Entrada E1, E2 e E3 em curto")
                                        // Setar no relatorio
                                        break
                                    case "00":
                                        console.error("Entrada E1 nao funcionou")
                                        // Setar no relatorio
                                        break
                                    default:
                                        console.error("Falha na leitura do parametro de validação para entrada E1")
                                        // Setar no relatorio
                                        break
                                }
                            }else{
                                throw (new Error("Controlador respondeu NACK para o comando de status de entradas, ou buffer de resposta maior do que o estipulado"))
                            }
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        } else{
                            throw (new Error("Comando de requisição e resposta do comando statusEntradas falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            //Finaliza teste e seta no relatorio erro na comunicacao
                        }                        
                    }
                })
                break

            case "TesteEntradaDigital_E2":
                this.Ui.setMsg("Testando Entrada Digital E2\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.TestProcedures.setupReles(this.ConfigTest.EntradasDigitais.E2)
                this.JigTransceiver.requisicaoResposta(this.statusEntradas, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                console.log("Pacote recebido coerente")
                                switch(respostaReq[4]){
                                    case "02":
                                        logDeuBom("Entrada E2 funcinou")
                                        // Setar no relatorio de teste
                                        break
                                    case "03":
                                        console.error("Entrada E1 e E2 em curto")
                                        // Setar no relatorio
                                        break;
                                    case "06":
                                        console.error("Entrada E2 e E3 em curto")
                                        // Setar no relatorio
                                        break
                                    case "07":
                                        console.error("Entrada E1, E2 e E3 em curto")
                                        // Setar no relatorio
                                        break
                                    case "00":
                                        console.error("Entrada E2 nao funcionou")
                                        // Setar no relatorio
                                        break
                                    default:
                                        console.error("Falha na leitura do parametro de validação para entrada E2")
                                        // Setar no relatorio
                                        break
                                }
                            }else{
                                throw (new Error("Controlador respondeu NACK para o comando de status de entradas, ou buffer de resposta maior do que o estipulado"))
                            }
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        } else{
                            throw (new Error("Comando de requisição e resposta do comando statusEntradas falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            //Finaliza teste e seta no relatorio erro na comunicacao
                        }                        
                    }
                })
                break

            case "TesteEntradaDigital_E3":
                this.Ui.setMsg("Testando Entrada Digital E3\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.TestProcedures.setupReles(this.ConfigTest.EntradasDigitais.E3)
                this.JigTransceiver.requisicaoResposta(this.statusEntradas, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                console.log("Pacote recebido coerente")
                                switch(respostaReq[4]){
                                    case "04":
                                        logDeuBom("Entrada E3 funcinou")
                                        // Setar no relatorio de teste
                                        break
                                    case "05":
                                        console.error("Entrada E1 e E3 em curto")
                                        // Setar no relatorio
                                        break;
                                    case "06":
                                        console.error("Entrada E2 e E3 em curto")
                                        // Setar no relatorio
                                        break
                                    case "07":
                                        console.error("Entrada E1, E2 e E3 em curto")
                                        // Setar no relatorio
                                        break
                                    case "00":
                                        console.error("Entrada E3 nao funcionou")
                                        // Setar no relatorio
                                        break
                                    default:
                                        console.error("Falha na leitura do parametro de validação para entrada E3")
                                        // Setar no relatorio
                                        break
                                }
                            }else{
                                throw (new Error("Controlador respondeu NACK para o comando de status de entradas, ou buffer de resposta maior do que o estipulado"))
                            }
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        } else{
                            throw (new Error("Comando de requisição e resposta do comando statusEntradas falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            //Finaliza teste e seta no relatorio erro na comunicacao
                        }                        
                    }
                })
                break

            case "TesteTemperaturaNTC_Baixa":
                var temperaturaLidaNTC_Baixa = null
                var temperaturaTargetNTC_Baixa = this.ConfigTest.Temperatura.NTC.Baixa.Target
                var temperaturaToleranciaNTC_Baixa = this.ConfigTest.Temperatura.NTC.Baixa.Tolerancia

                this.Ui.setMsg("Testando Entrada NTC (temperatura baixa) do produto\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.TestProcedures.setSaidaAnalogica_mV(0, this.ConfigTest.Temperatura.NTC.Baixa.setAnalog)
                this.JigTransceiver.requisicaoResposta(this.leituraTemperaturaNTC, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                console.log("Pacote recebido coerente")
                                temperaturaLidaNTC_Baixa = stringByteHexToNumber(respostaReq[4])
                                if(temperaturaLidaNTC_Baixa >= (temperaturaTargetNTC_Baixa - temperaturaToleranciaNTC_Baixa) &&
                                   temperaturaLidaNTC_Baixa <= (temperaturaTargetNTC_Baixa + temperaturaToleranciaNTC_Baixa)){
                                    logDeuBom("Temperatura baixa do NTC lida corretamente")
                                    // Setar no relatorio de teste
                                } else{
                                    console.error("Temperatura baixa do NTC lida incorretamente")
                                    // Setar falha no relatorio de teste
                                }
                                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                this.EtapaTesteAtual++
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }else{
                                throw (new Error("Controlador respondeu NACK para o comando de status de entradas, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do comando leituraTemperaturaNTC falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            //Finaliza teste e seta no relatorio erro na comunicacao
                        }                        
                    }
                })
                break

            case "TesteTemperaturaNTC_Alta":
                var temperaturaLidaNTC_Alta = null
                var temperaturaTargetNTC_Alta = this.ConfigTest.Temperatura.NTC.Alta.Target
                var temperaturaToleranciaNTC_Alta = this.ConfigTest.Temperatura.NTC.Alta.Tolerancia

                this.Ui.setMsg("Testando Entrada NTC (temperatura Alta) do produto\n\nComunicando com o controlador aguarde...")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                this.TestProcedures.setSaidaAnalogica_mV(0, this.ConfigTest.Temperatura.NTC.Alta.setAnalog)
                this.JigTransceiver.requisicaoResposta(this.leituraTemperaturaNTC, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) =>{
                    try{
                        if(statusResponse){
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)
                            if(respostaReq.length == this.tamanhoBuffer && respostaReq[4] != this.NACK){
                                this.tentativasComunicacao = 0
                                console.log("Pacote recebido coerente")
                                temperaturaLidaNTC_Alta = stringByteHexToNumber(respostaReq[4])
                                if(temperaturaLidaNTC_Alta >= (temperaturaTargetNTC_Alta - temperaturaToleranciaNTC_Alta) &&
                                    temperaturaLidaNTC_Alta <= (temperaturaTargetNTC_Alta + temperaturaToleranciaNTC_Alta)){
                                    logDeuBom("Temperatura Alta do NTC lida corretamente")
                                    // Setar no relatorio de teste
                                } else{
                                    console.error("Temperatura Alta do NTC lida incorretamente")
                                    // Setar falha no relatorio de teste
                                }
                                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                this.EtapaTesteAtual++
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }else{
                                throw (new Error("Controlador respondeu NACK para o comando de status de entradas, ou buffer de resposta maior do que o estipulado"))
                            }
                        } else{
                            throw (new Error("Comando de requisição e resposta do comando leituraTemperaturaNTC falhou -> Falha na Comunicação"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            }, this.tempoRetentativa)
                        } else{
                            console.error("Tentativas de comunicação esgotadas, falha na comunicação")
                            //Finaliza teste e seta no relatorio erro na comunicacao
                        }                        
                    }
                })
                break

            case "Start":
                if (this.TesteAtivo) {
                    this.Ui.setMsg("Clique em Avança para iniciar o teste.");
                    this.Ui.observerAvanca((retorno) => {
                        if (retorno) {
                            this.TempoTeste = new Date();
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        }
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SetTemperaturaFria":
                this.TestProcedures.setSaidaAnalogica_mV(0, this.ConfigTest.Setup.NTC.TemperaturaFria);
                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                this.EtapaTesteAtual++;
                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                break;

            case "SetSobreTemperatura":
                this.TempoInicioSobretemperatura = new Date();
                this.TestProcedures.setSaidaAnalogica_mV(0, this.ConfigTest.Setup.NTC.SobreTemperatura);
                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                this.EtapaTesteAtual++;
                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                break;

            case "SetTemperaturaInicial":
                this.TestProcedures.testeSetup(this.ConfigTest.Setup.SetupRl, () => {
                    this.TestProcedures.setSaidaAnalogica_mV(1, this.ConfigTest.Setup.NTC.TempInical);
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                });
                break;

            case "EndRastreamento":
                this.Ui.setMsg("Aguardando Finalização do rastreamento");

                if (this.ConfigTest != null) {

                    if (JSON.parse(this.ConfigTest.Rastreamento)) {
                        PVI.FWLink.globalDaqMessagesObservers.addString('Observers.Rastreamento', "PVI.DaqScript.DS_Rastreamento.rastreamento");
                        this.Rastreamento.setRepot(this.SerialNumber, this.RelatorioRastreamento);
                        this.Rastreamento.end(this.SerialNumber, this.Falhas);

                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++;
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);

                    } else {
                        alert("RASTREAMENTO DESATIVADO!\nEntre em contato com o M&P");
                        console.warn("RASTREAMENTO DESATIVADO!");
                        PVI.FWLink.globalDaqMessagesObservers.addString('Observers.Rastreamento', "PVI.DaqScript.DS_Rastreamento.rastreamento");
                        this.Rastreamento.end(this.SerialNumber, this.Falhas);

                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++;
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    }
                } else {
                    this.Falhas.set("Erro", "ConfigTest inválido");
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Calibracao":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");
                this.TestProcedures.testeSetup(this.ConfigTest.Setup.Calibracao, () => {
                    this.TestProcedures.VerificaLED(
                        {
                            msg: "Os LEDs Verde e Amarelo piscaram?",
                            imagem: this.ConfigTest.Imagens.LEDVerdeAmarelo,
                            setup: this.ConfigTest.Setup.EnergizaCalibracao,
                            setupTimeout: 500
                        },
                        (retorno) => {
                            this.RelatorioGeral.set("Calibracao", retorno);
                            this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                });
                break;

            case "Limiar110":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");
                if (this.TesteAtivo) {
                    this.TestProcedures.VerificaLED(
                        {
                            msg: "O LED Verde piscou?",
                            imagem: this.ConfigTest.Imagens.LEDVerde,
                            setup: this.ConfigTest.Setup.AlimentacaoLimiar110,
                            setupTimout: 300
                        },
                        (retorno) => {
                            this.RelatorioGeral.set("Limiar110", retorno);
                            this.RelatorioGeral.set("LEDVerde", retorno);
                            this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Limiar220":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");
                if (this.TesteAtivo) {
                    this.TestProcedures.VerificaLED(
                        {
                            msg: "O LED Amarelo piscou?",
                            imagem: this.ConfigTest.Imagens.LEDAmarelo,
                            setup: this.ConfigTest.Setup.AlimentacaoLimiar220,
                            setupTimeout: 300
                        },
                        (retorno) => {
                            this.RelatorioGeral.set("Limiar220", retorno);
                            this.RelatorioGeral.set("LEDAmarelo", retorno);
                            this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Deteccao110":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");
                if (this.TesteAtivo) {
                    this.TestProcedures.VerificaLED(
                        {
                            msg: "O LED Verde piscou?",
                            imagem: this.ConfigTest.Imagens.LEDVerde,
                            setup: this.ConfigTest.Setup.Stop,
                            setupTimeout: 500
                        },
                        (retorno) => {
                            this.RelatorioGeral.set("Deteccao110", retorno);
                            this.RelatorioGeral.set("LEDVerde", retorno);
                            this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Deteccao220":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");
                if (this.TesteAtivo) {
                    this.TestProcedures.VerificaLED(
                        {
                            msg: "O LED Amarelo piscou?",
                            imagem: this.ConfigTest.Imagens.LEDAmarelo,
                            setup: this.ConfigTest.Setup.Stop,
                            setupTimeout: 500
                        },
                        (retorno) => {
                            this.RelatorioGeral.set("Deteccao220", retorno);
                            this.RelatorioGeral.set("LEDAmarelo", retorno);
                            this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Energizacao110":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");

                if (this.TesteAtivo) {
                    this.TestProcedures.setAlimentacao(this.ConfigTest.Setup.Alimentacao110, () => {
                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++;
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Energizacao220":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..");

                if (this.TesteAtivo) {
                    this.TestProcedures.setAlimentacao(this.ConfigTest.Setup.Alimentacao220, () => {
                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++;
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "Desenergizacao":
                if (this.TesteAtivo) {
                    this.Ui.setMsg("Desenergizando Controlador\n Aguarde..");
                    this.TestProcedures.setAlimentacao(null, () => {
                        this.TestProcedures.testeSetup(this.ConfigTest.Setup.Vazio, () => {
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual], 1000);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SobreTemperatura":
                this.Ui.setMsg("Atenção!\n\nFique atento ao acionamento dos LEDs");
                this.Ui.setImage(this.ConfigTest.Imagens.Atencao)
                this.TempoAcionamentoSobreTemperatura = 37000;
                this.TempoDecorridoSobreTemperatura = new Date() - this.TempoInicioSobretemperatura;
                this.TempoRestanteSobreTemperatura = this.TempoAcionamentoSobreTemperatura - this.TempoDecorridoSobreTemperatura;
                console.log(this.TempoRestanteSobreTemperatura);

                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Max, this.TempoRestanteSobreTemperatura, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("SobreTemperatura", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "RearmeSobreTemperatura":
                this.Ui.setMsg("Testando Saída Triac 110V Mínimo");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 5000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("RearmeSobreTemperatura", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac110_init":
                this.Ui.setMsg("Testando Saída Triac 110V");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Stop, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("Init", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac110_min":
                this.Ui.setMsg("Testando Saída Triac 110V Mínimo");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 3000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("Min", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac110_medio":
                this.Ui.setMsg("Testando Saída Triac 110V Médio");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Medio, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("Medio", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac110_max":
                this.Ui.setMsg("Testando Saída Triac 110V Máximo");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Max, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("Max", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac110_stop":
                this.Ui.setMsg("Testando Saída Triac 110V Stop");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Vazio, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida110.set("Stop", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriacValidation_110V":
                this.Ui.setMsg("Validando Saída Triac 110V");
                if (this.TesteAtivo) {
                    this.Validations.ValidaSaidaTriac(110, () => {
                        this.RelatorioGeral.set("Saida110", true);
                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++;
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac220_init":
                this.Ui.setMsg("Testando Saída Triac 220V");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Stop, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida220.set("Init", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac220_min":
                this.Ui.setMsg("Testando Saída Triac 220V Mínimo");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 3000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida220.set("Min", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac220_medio":
                this.Ui.setMsg("Testando Saída Triac 220V Médio");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Medio, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida220.set("Medio", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac220_max":
                this.Ui.setMsg("Testando Saída Triac 220V Máximo");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Start, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Max, 2000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida220.set("Max", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriac220_stop":
                this.Ui.setMsg("Testando Saída Triac 220V Stop");
                if (this.TesteAtivo) {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Vazio, () => {
                        this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Setup.Potenciometro.Min, 3000, (media) => {
                            console.log(`Média:`, media);
                            this.RelatorioSaida220.set("Stop", Number(media.toFixed(2)));
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "SaidaTriacValidation_220V":
                this.Ui.setMsg("Validando Saída Triac 220V");
                if (this.TesteAtivo) {
                    this.Validations.ValidaSaidaTriac(220, () => {
                        this.RelatorioGeral.set("Saida220", true);
                        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        this.EtapaTesteAtual++;
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    });
                } else {
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                }
                break;

            case "TesteLedVerde":
                setTimeout(() => {
                    this.Ui.setMsg("Energizando Controlador\n Aguarde..");
                    if (this.TesteAtivo) {
                        this.TestProcedures.VerificaLED(
                            {
                                msg: "O LED Verde piscou?",
                                imagem: this.ConfigTest.Imagens.LEDVerde
                            },
                            (retorno) => {
                                this.RelatorioGeral.set("LEDVerde", retorno);
                                this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                                console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                                this.EtapaTesteAtual++;
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            });
                    } else {
                        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("TransferenciaDeFalhas");
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    }
                }, 2000);
                break;

            case "SaidasEnergizacaoSetRelatorio":
                this.Ui.setMsg("#Teste Inicial..#");
                this.TestProcedures.SaidasEnergizacaoSetRelatorio(() => {
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                });
                break;

            case "SaidasEnergizacao1":
                this.Ui.setMsg("Testando saídas sempre acionadas...");
                this.TestProcedures.SaidasEnergizacao1(() => {
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                });
                break;

            case "SaidasEnergizacao2":
                this.Ui.setMsg("Testando saídas sempre acionadas...");
                this.TestProcedures.SaidasEnergizacao2(() => {
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                });
                break;

            case "TesteRL":
                this.Ui.setMsg("Testando Saida Relé.");
                this.TestProcedures.setSaidaAnalogica_mV(1, this.ConfigTest.Setup.NTC.TempAcionaRL);
                setTimeout(() => {
                    this.TestProcedures.TesteSaida();
                    this.TestProcedures.VerificaLED(
                        {
                            msg: "Os LED AMARELO esta ligado?",
                            imagem: this.ConfigTest.Imagens.LEDAmarelo,
                            setup: this.ConfigTest.Setup.SetupRl,
                            setupTimeout: 500
                        },
                        (retorno) => {
                            this.RelatorioGeral.set("LEDAmarelo", retorno);
                            this.Ui.setImage(this.ConfigTest.Imagens.Padrao);
                            console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                            this.EtapaTesteAtual++;
                            this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                        });
                }, 2000);
                break;

            case "TransferenciaDeFalhas":
                this.Ui.setMsg("Transferindo Falhas...");

                console.warn(`Tempo de Teste: ${(new Date() - this.TempoTeste) / 1000}s`);
                console.warn(`Tempo de Setup: ${(this.TempoTeste - this.TempoSetup) / 1000}s`);

                this.Validations.TransferenciaDeFalhas(() => {
                    console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                    this.EtapaTesteAtual++;
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual]);
                });
                break;

            case "FinalizaTeste":
                this.Ui.setMsg("Finalizando teste");

                this.TestProcedures.setAlimentacao(null, () => {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Vazio, () => {
                        this.Ui.finalizaTeste(this.Falhas);
                    });
                });
                break;
        }
    }
}

function stringByteHexToNumber(stringByte){
    var number = "0x"
    number += stringByte
    number = Number(number)

    return number
}

function string2BytesHexToNumber(stringByte_MSB, stringByte_LSB){
    var number = "0x"
    number += stringByte_MSB + stringByte_LSB
    number = Number(number)

    return number
}

function logDeuBom(stringParam){
    console.log("%c"+stringParam,"color: green; font-weight: bold;")
}