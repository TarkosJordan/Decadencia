class Main {
    constructor(MAP = ["TF"], EVT = "TF") {

        this.Evt = EVT
        this.Map = MAP
        this.dataErp = ""
        this.SerialNumber
        this.ConfigTest = null
        this.EtapaTesteAtual = null
        this.TempoSetup = null
        this.TempoTeste = null

        this.Falhas = new Map()
        this.EtapasDeTeste = null
        this.RelatorioTeste = new RelatorioTeste()
        this.tempoResposta = 800
        this.tempoRetentativa = 800
        this.regexTestResponse = /[1][8][ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}/
        this.MapaDeValidacao = new Map()

        // Desculpa Kroth
        // Parece redundante porem não...  
        this.tentativasComunicacao = 0          // Essa propriedade é para testar se a resposta do controlador esta com o tamanho do buffer estipulado e se o controlador respondeu ACK (ou um dado valido)
        this.tentativasMaxComunicacao = 5
        this.tentativasReenergizacao = 0
        this.tentativasMaxReenergizacao = 3
        this.tamanhoBuffer = 7
        this.numeroTentativasReqResp = 5        // Essa outra propriedade tem o intuito de servir como um parametro do metodo de requisição e resposta, esse metodo retorna uma resposta que conseguiu dar match com o regex passado como parametro
        // Em suma a 'this.numeroTentativasReqResp' auxilia na validação do formato da resposta (tenta de novo se o retorno for ruido ou nulo)
        // e a 'this.tentativasComunicacao' auxilia na validação do protocolo (tenta de novo se a quantidade de bytes for diferente do tamnho do buffer estipulado ou se o dado lido for invalido)

        this.Ui = new UI()
        this.Util = new Utils(this)
        this.TestProcedures = new Teste(this)
        this.Gravacao = new Gravacao(this)
        this.Rastreamento = new Rastreamento(this)
        this.JigTransceiver = new Serial(this, 9600, 0)

        this.Util.setState("TestConfig")
    }

    MaquinaDeEstados(state) {
        switch (state) {
            case "TestConfig":
                this.TempoSetup = new Date()
                Serial.closeAllPorts()
                if (sessionStorage.getItem("FirstExec") == true || sessionStorage.getItem("ProductCode") == null) {
                    sessionStorage.setItem("TrasceiverCOM", null)
                    this.Util.initTest((value) => {
                        this.Util.requestERP(value, (dataErp) => {
                            if (dataErp != null) {
                                this.dataErp = dataErp
                                if (this.dataErp.Information.ProductCode.match(/[0-9]{1,6}/) != null) {
                                    this.Util.configuraTest(this.dataErp.Information.ProductCode, (config) => {
                                        if (config != null) {
                                            this.ConfigTest = config
                                            this.incrementaEstado()
                                        } else {
                                            console.error("não foi encontrado o arquivo de configuração Json para esse produto")
                                            sessionStorage.clear()
                                        }
                                    })
                                } else {
                                    console.error("não foi encontrado o produto para esse numero de série")
                                    sessionStorage.clear()
                                }
                            } else {
                                console.error("Servidor erp não respondeu")
                                sessionStorage.clear()
                            }
                        })
                    })
                } else {
                    this.Util.configuraTest(sessionStorage.getItem("ProductCode"), (config) => {
                        if (config != null) {
                            this.ConfigTest = config
                            this.incrementaEstado()
                        } else {
                            console.error("não foi encontrado o arquivo de configuração Json para esse produto")
                            sessionStorage.clear()
                        }
                    })
                }
                break

            case "SetupPotenciometro1":
                if(sessionStorage.getItem("FirstExec") != "false"){
                    this.Ui.setImage(this.ConfigTest.Imagens.SetupPotenciometro1)
                    this.Ui.setMsg(`    Antes de começar o teste cerfique-se de encaixar o potenciômentro no suporte da base e na peça também. Verifique as cores das vias tanto na peça quanto no potênciometro.
                    Sequencia de cores da esquerda para direita
                    
                    No Potenciômetro:
                        - Via Vermelha
                        - Via Azul
                        - Via Preta
    
                    Na Peça:
                        - Via Preta
                        - Via Azul
                        - Via Vermelha`
                    )
                    this.Ui.observerAvanca(()=>{
                        sessionStorage.setItem("FirstExec", "false")
                        this.incrementaEstado()
                    })
                } else{
                    this.incrementaEstado()
                }
                break

            case "ConfiguraValidacoes":
                this.ConfigTest.MapaValidacoes.forEach((element) => {
                    this.MapaDeValidacao.set(element, false)
                })
                this.incrementaEstado()
                break

            case "SetupInicial":
                this.Ui.setTitle(this.ConfigTest.ProductName)
                if (sessionStorage.getItem("FirstExec") == "true") {
                    var componentesDeTeste = this.ConfigTest.ComponentesDeTeste
                    var msgComponentesDeTeste = ""
                    componentesDeTeste.forEach(componente => {
                        msgComponentesDeTeste += "  - " + componente + "\n"
                    })
                    this.Ui.modalInfo(this.ConfigTest.Imagens.Base, "Para prosseguir utilize:\n\n" + msgComponentesDeTeste, () => {
                        this.Ui.modalInfo("Imagens/atencao.gif", "Não use a tomada série!", ()=>{
                            this.Ui.modalInfo(this.ConfigTest.Imagens.CabosUSB, "Conecte os cabos USB no computador e na base de teste", () => {
                                this.Ui.modalInfo(this.ConfigTest.Imagens.IsoladorUSB, "Para o cabo mini USB, utilize um isolador USB na entrada do computador", () => {
                                    var msgDissipador
                                    if(this.ConfigTest.hasOwnProperty("Dissipador")){
                                        if(this.ConfigTest.Dissipador == "false"){
                                            msgDissipador = "Para o teste da placa sem o dissipador, utilize o suporte de placa localizado na lateral da base"
                                        } else if(this.ConfigTest.Dissipador == "true"){
                                            msgDissipador = "Para o teste da placa com o dissipador, caso seja necessário, remova o suporte de placa e guarde o na lateral da base"
                                        }
                                        this.Ui.modalInfo(this.ConfigTest.Imagens.SetupDissipador, msgDissipador, () => {
                                            this.incrementaEstado()
                                        })
                                    } else{
                                        console.warn("Informação de dissipador, não especificada corretamente no .json de configuração")
                                    }
                                })
                            })
                        })
                    })
                } else {
                    this.incrementaEstado()
                }
                break

            case "GravaFirmwareTeste":                 
                if (this.ConfigTest.Gravacao == "true") {
                    var optionBytesDespr = "I:/Documentos/FirmwaresDeTeste/INV-30400/opt_desprotect.hex"       // Optionbyte para desproteger o acesso a memoria do microcontrolador
                    var firmwareTesteHex = "I:/Documentos/FirmwaresDeTeste/INV-30400/AT_304v01_0.10.hex"
                    var optionByteFinal = "I:/Documentos/FirmwaresDeTeste/INV-30400/opt_desprotect.hex"
                    this.Ui.setMsg("Gravando Firmware")
                    this.Gravacao.gravaFirmwareST(optionBytesDespr, firmwareTesteHex, optionByteFinal, 3, () => {
                        this.incrementaEstado()
                    })
                } else {
                    console.warn("Gravação do Firmware de teste desabilitada, revisar .json de configuração")
                    this.incrementaEstado()
                }
                break

            case "StartRastreamento":
                this.Ui.getInsertedValue("Informe o numero de série do produto.", (serialcode) => {
                    if (serialcode != null) {
                        if (JSON.parse(this.ConfigTest.Rastreamento)) {
                            if (serialcode.match(/[1][0]{4}[0-9]{8}/)) {
                                PVI.FWLink.globalDaqMessagesObservers.addString('Observers.Rastreamento', "PVI.DaqScript.DS_Rastreamento.rastreamento")
                                this.Rastreamento.init(serialcode, this.Map, this.Evt)
                                this.SerialNumber = serialcode
                                setTimeout(() => {
                                    this.incrementaEstado()
                                }, 500)
                            } else {
                                this.Falhas.set("Rastreamento", "O número de série informado é inválido!")
                                this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("FinalizaTeste")
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }
                        } else {
                            console.warn("RASTREAMENTO DESABILITADO")
                            this.incrementaEstado()
                        }
                    } else {
                        this.Falhas.set("Rastreamento", "O número de série não foi informado!")
                        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("FinalizaTeste")
                        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                    }
                })
                break
            case "EstabeleceComunicacaoTransceiver":
                this.Ui.setMsg("Estabelecendo comunicação com o transceiver aguarde...")
                this.Ui.setImage(this.ConfigTest.Imagens.Padrao)
                var tentatviasCom = 4
                console.log("Tentativa Comunicação Energização", this.tentativasReenergizacao + 1)
                Serial.closeAllPorts()
                this.TestProcedures.setupRelesDesligamentoControlado("RL5")
                if(sessionStorage.getItem("TrasceiverCOM") == null){
                    this.JigTransceiver.getConnectedPortCom_funcRequest(()=>{}, this.regexTestResponse, tentatviasCom, (retornoBooleano, portaEncontrada) => {
                        try{
                            if(retornoBooleano){
                                this.tentativasReenergizacao = 0
                                console.log("Porta do transceiver encontrada em", portaEncontrada)
                                this.JigTransceiver.open(this.JigTransceiver.COMPORT)
                                sessionStorage.setItem("TrasceiverCOM", this.JigTransceiver.COMPORT)
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Comunicação não estabelecida, tentativa de reenergização"))
                            }
                        } catch(e){
                            console.log(e.message)
                            this.tentativasReenergizacao++
                            if(this.tentativasReenergizacao < this.tentativasMaxReenergizacao){
                                setTimeout(()=>{
                                    this.EtapaTesteAtual -= 2
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                }, this.tempoRetentativa)
                            } else{
                                this.setFalhaCritica("COM_E1", "Não foi possível estabelecer comunicação com o transceiver/ Funcionamento da entrada E1")
                            }
                        }
                    })
                } else{
                    this.JigTransceiver.COMPORT = sessionStorage.getItem("TrasceiverCOM")
                    this.TestProcedures.setupRelesDesligamentoControlado("RL5")
                    this.JigTransceiver.estabeleceComunicacaoCOM_funcRequest(this.JigTransceiver.COMPORT, ()=>{}, this.regexTestResponse, tentatviasCom, (retornoBooleano, portaEncontrada) => {
                        try{
                            if(retornoBooleano){
                                this.tentativasReenergizacao = 0
                                console.log("Comunicação estabelecida na porta", portaEncontrada)
                                this.JigTransceiver.open(this.JigTransceiver.COMPORT)
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Comunicação não estabelecida, tentativa de reenergização"))
                            }
                        } catch(e){
                            console.log(e.message)
                            this.tentativasReenergizacao++
                            if(this.tentativasReenergizacao < this.tentativasMaxReenergizacao){
                                setTimeout(()=>{
                                    this.EtapaTesteAtual -= 2
                                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                                }, this.tempoRetentativa)
                            } else{
                                this.setFalhaCritica("COM_E1", "Não foi possível estabelecer comunicação com o transceiver/ Funcionamento da entrada E1")
                            }
                        }
                    })
                }
                break
            
            case "Teste_E1_SempreAcionada":
                this.Ui.setMsg("Testando se E1 esta sempre acionada")
                console.log("Tentativa Comunicação", this.tentativasComunicacao + 1)
                var regexTestDeNaoComunicacao = /([0-9]|[A-F]){2}[ ]([0-9]|[A-F]){2}/ // Um regex generico para da mactch com qualquer par de bytes que possam vir da comunicacao
                // A ideia eh que a comunicacao falhe para testar se E1 nao esta indevidamente acionada
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("","RL5")}, regexTestDeNaoComunicacao, this.tempoResposta, 4, (statusResponse, respostaReq) => {
                    try{
                        if(!statusResponse){
                            console.log("Controlador não comunicou indevidamente portanto entrada E1 não esta em curto")
                            this.tentativasComunicacao = 0
                            this.incrementaEstado()
                            console.log(respostaReq)
                        } else{
                            throw (new Error("Comunicação aconteceu de forma indevida"))
                        }
                    }
                    catch(e){
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if(this.tentativasComunicacao < this.tentativasMaxComunicacao){
                            setTimeout(()=>{
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else{
                            this.setFalhaCritica("E1", "Entrada E1 em curto")
                        }
                    }
                })
                break

            case "INV30401_160V_Pot_Min_E1":
                // Variaveis para validacao da leitura de tensao 160V
                if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada160V")){
                    var tensaoLida160V = null
                    var tensaoTarget160V = this.ConfigTest.TensoesEntrada.Entrada160V.Target
                    var toleranciaLeitura160V = this.ConfigTest.TensoesEntrada.Entrada160V.Tolerancia
                }
                // Variaveis para validacao de leitura do potenciometro minimo
                if(this.ConfigTest.Potenciometro.hasOwnProperty("Min")){
                    var leituraPotMin = null
                    var leituraPotMinTarget = this.ConfigTest.Potenciometro.Min.Target
                    var toleranciaLeituraPotMin = this.ConfigTest.Potenciometro.Min.Tolerancia
                }
                if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E1")){
                    var leituraEntradaE1 = null
                }
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("RL5,RL11")}, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try {
                        if (statusResponse) {
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)

                            if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada160V")){
                                if(this.MapaDeValidacao.get("Leitura160V") == false){
                                    tensaoLida160V = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                    console.log("Tensao lida:", tensaoLida160V)
                                    if(tensaoLida160V >= (tensaoTarget160V - toleranciaLeitura160V) && tensaoLida160V <= (tensaoTarget160V + toleranciaLeitura160V)){
                                        this.setAprovacaoAnalogica("160V", "Valor de tensão lido pelo controlador correto", tensaoTarget160V, toleranciaLeitura160V, tensaoLida160V)
                                        this.MapaDeValidacao.set("Leitura160V", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao -1){
                                        this.setFalhaAnalogica("160V", "Falha na leitura de tensão 160V", tensaoTarget160V, toleranciaLeitura160V, tensaoLida160V)
                                    }                           
                                }
                            }
                            if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E1")){
                                if(this.MapaDeValidacao.get("E1") == false){
                                    leituraEntradaE1 = stringByteHexToNumber(respostaReq[6])
                                    console.log("Valor das Entradas:", leituraEntradaE1)
                                    switch(leituraEntradaE1){
                                        case 1:
                                            this.setAprovacaoBooleana("E1","Entrada E1 Funcionou")
                                            this.MapaDeValidacao.set("E1", true)
                                            break
                                        case 3:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1_E2", "Entrada E1_E2 em curto")
                                            }
                                            break
                                        case 5:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1_E3", "Entrada E1_E3 em curto")
                                            }
                                            break
                                        case 8:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1_E2_E3", "Entrada E1_E2_E3 em curto")
                                            }
                                            break
                                        default:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1", "Valor recebido para entradas incoerente")
                                            }
                                            break
                                    }
                                }
                            }
                            if(this.ConfigTest.Potenciometro.hasOwnProperty("Min")){
                                if(this.MapaDeValidacao.get("Potenciometro_Min") == false){
                                    leituraPotMin = string2BytesHexToNumber(respostaReq[1], respostaReq[2])
                                    console.log("Valor lido no potenciometro:", leituraPotMin)
                                    if(leituraPotMin >= (leituraPotMinTarget - toleranciaLeituraPotMin) && leituraPotMin <= (leituraPotMinTarget + toleranciaLeituraPotMin)){
                                        this.setAprovacaoBooleana("Potenciometro_Min", "Valor minimo do potenciômetro lido corretamente")
                                        this.MapaDeValidacao.set("Potenciometro_Min", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("Pot_Min", "Falha na leitura do potenciometro", leituraPotMinTarget, toleranciaLeituraPotMin, leituraPotMin)
                                    }
                                }
                            }
                            if(this.MapaDeValidacao.get("Potenciometro_Min") && this.MapaDeValidacao.get("E1") && this.MapaDeValidacao.get("Leitura160V")){
                                this.tentativasComunicacao = 0
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Leitura de algum dos parâmetros falhou")) 
                            }
                        } else {
                            if (this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                this.setFalha("E1_COM", "Falha na comunicação ou entrada E1")
                            }
                            throw (new Error("Comando de requisição e resposta do comando Config1 falhou -> Falha na Comunicação"))
                        }
                    }
                    catch (e) {
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if (this.tentativasComunicacao < this.tentativasMaxComunicacao) {
                            setTimeout(() => {
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else {
                            this.incrementaEstado()
                        }
                    }
                })
                break

            case "INV30401_190V_Pot_Max_E2":
                // Variaveis para validacao da leitura de tensao 190V
                if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada190V")){
                    var tensaoLida190V = null
                    var tensaoTarget190V = this.ConfigTest.TensoesEntrada.Entrada190V.Target
                    var toleranciaLeitura190V = this.ConfigTest.TensoesEntrada.Entrada190V.Tolerancia
                }
                // Variaveis para validacao de leitura do potenciometro maximo
                if(this.ConfigTest.Potenciometro.hasOwnProperty("Max")){
                    var leituraPotMax = null
                    var leituraPotMaxTarget = this.ConfigTest.Potenciometro.Max.Target
                    var toleranciaLeituraPotMax = this.ConfigTest.Potenciometro.Max.Tolerancia
                }
                if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E2")){
                    var leituraEntradaE2 = null
                }
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("RL5,RL7")}, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try {
                        if (statusResponse) {
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)

                            if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada190V")){
                                if(this.MapaDeValidacao.get("Leitura190V") == false){
                                    tensaoLida190V = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                    console.log("Tensao lida:", tensaoLida190V)
                                    if(tensaoLida190V >= (tensaoTarget190V - toleranciaLeitura190V) && tensaoLida190V <= (tensaoTarget190V + toleranciaLeitura190V)){
                                        this.setAprovacaoAnalogica("190V", "Valor de tensão lido pelo controlador correto", tensaoTarget190V, toleranciaLeitura190V, tensaoLida190V)
                                        this.MapaDeValidacao.set("Leitura190V", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("190V", "Falha na leitura de tensão 190V", tensaoTarget190V, toleranciaLeitura190V, tensaoLida190V)
                                    }                           
                                }
                            }
                            if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E2")){
                                if(this.MapaDeValidacao.get("E2") == false){
                                    leituraEntradaE2 = stringByteHexToNumber(respostaReq[6])
                                    console.log("Valor das Entradas:", leituraEntradaE2)
                                    switch(leituraEntradaE2){
                                        case 3:
                                            this.setAprovacaoBooleana("E2","Entrada E2 Funcionou")
                                            this.MapaDeValidacao.set("E2", true)
                                            break
                                        case 1:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E2", "Nao acionou")
                                            }
                                            break
                                        case 5:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E2_E3", "Entrada E2_E3 em curto")
                                            }
                                            break
                                        default:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E2", "Valor recebido para entradas incoerente")
                                            }
                                            break
                                    }
                                }
                            }
                            if(this.ConfigTest.Potenciometro.hasOwnProperty("Max")){
                                if(this.MapaDeValidacao.get("Potenciometro_Max") == false){
                                    leituraPotMax = string2BytesHexToNumber(respostaReq[1], respostaReq[2])
                                    console.log("Valor lido no potenciometro:", leituraPotMax)
                                    if(leituraPotMax >= (leituraPotMaxTarget - toleranciaLeituraPotMax) && leituraPotMax <= (leituraPotMaxTarget + toleranciaLeituraPotMax)){
                                        this.setAprovacaoBooleana("Potenciometro_Max", "Valor Maximo do potenciômetro lido corretamente")
                                        this.MapaDeValidacao.set("Potenciometro_Max", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("Pot_Max", "Falha na leitura do potenciometro", leituraPotMaxTarget, toleranciaLeituraPotMax, leituraPotMax)
                                    }
                                }
                            }
                            if(this.MapaDeValidacao.get("Potenciometro_Max") && this.MapaDeValidacao.get("E2") && this.MapaDeValidacao.get("Leitura190V")){
                                this.tentativasComunicacao = 0
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Leitura de algum dos parâmetros falhou")) 
                            }
                        } else {
                            if (this.tentativasComunicacao >= this.tentativasMaxComunicacao -1){
                                this.setFalha("E1_COM", "Falha na comunicação ou entrada E1")
                            }
                            throw (new Error("Comando de requisição e resposta do comando Config1 falhou -> Falha na Comunicação"))
                        }
                    }
                    catch (e) {
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if (this.tentativasComunicacao < this.tentativasMaxComunicacao) {
                            setTimeout(() => {
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else {
                            this.incrementaEstado()
                        }
                    }
                })
                break

            case "INV30401_Pot_Medio_E3":
                // Variaveis para validacao de leitura do potenciometro medio
                if(this.ConfigTest.Potenciometro.hasOwnProperty("Medio")){
                    var leituraPotMedio = null
                    var leituraPotMedioTarget = this.ConfigTest.Potenciometro.Medio.Target
                    var toleranciaLeituraPotMedio = this.ConfigTest.Potenciometro.Medio.Tolerancia
                }
                if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E3")){
                    var leituraEntradaE3 = null
                }
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("RL5,RL9","RL7")}, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try {
                        if (statusResponse) {
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)

                            if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E3")){
                                if(this.MapaDeValidacao.get("E3") == false){
                                    leituraEntradaE3 = stringByteHexToNumber(respostaReq[6])
                                    console.log("Valor das Entradas:", leituraEntradaE3)
                                    switch(leituraEntradaE3){
                                        case 5:
                                            this.setAprovacaoBooleana("E3","Entrada E3 Funcionou")
                                            this.MapaDeValidacao.set("E3", true)
                                            break
                                        case 1:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E3", "Entrada E3 Não acionou")
                                            }
                                            break
                                        default:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E3", "Valor recebido para entradas incoerente")
                                            }
                                            break
                                    }
                                }
                            }
                            if(this.ConfigTest.Potenciometro.hasOwnProperty("Medio")){
                                if(this.MapaDeValidacao.get("Potenciometro_Medio") == false){
                                    leituraPotMedio = string2BytesHexToNumber(respostaReq[1], respostaReq[2])
                                    console.log("Valor lido no potenciometro:", leituraPotMedio)
                                    if(leituraPotMedio >= (leituraPotMedioTarget - toleranciaLeituraPotMedio) && leituraPotMedio <= (leituraPotMedioTarget + toleranciaLeituraPotMedio)){
                                        this.setAprovacaoBooleana("Potenciometro_Medio", "Valor Medioimo do potenciômetro lido corretamente")
                                        this.MapaDeValidacao.set("Potenciometro_Medio", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao -1){
                                        this.setFalhaAnalogica("Pot_Medio", "Falha na leitura do potenciometro", leituraPotMedioTarget, toleranciaLeituraPotMedio, leituraPotMedio)
                                    }
                                }
                            }
                            if(this.MapaDeValidacao.get("Potenciometro_Medio") && this.MapaDeValidacao.get("E3")){
                                this.tentativasComunicacao = 0
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Leitura de algum dos parâmetros falhou")) 
                            }
                        } else {
                            if (this.tentativasComunicacao >= this.tentativasMaxComunicacao -1){
                                this.setFalha("E1_COM", "Falha na comunicação ou entrada E1")
                            }
                            throw (new Error("Comando de requisição e resposta do comando Config1 falhou -> Falha na Comunicação"))
                        }
                    }
                    catch (e) {
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if (this.tentativasComunicacao < this.tentativasMaxComunicacao) {
                            setTimeout(() => {
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else {
                            this.incrementaEstado()
                        }
                    }
                })
                break
            case "INV30404_160V_Pot_Min_E1_NTC_Baixa":
                // Variaveis para validacao da leitura da entrada NTC (temp baixa)
                if(this.ConfigTest.Temperatura.hasOwnProperty("NTC")){
                    var temperaturaLidaNTC_Baixa = null
                    var temperaturaTargetNTC_Baixa = this.ConfigTest.Temperatura.NTC.Baixa.Target
                    var temperaturaToleranciaNTC_Baixa = this.ConfigTest.Temperatura.NTC.Baixa.Tolerancia
                }
                // Variaveis para validacao da leitura de tensao 160V
                if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada160V")){
                    var tensaoLida160V = null
                    var tensaoTarget160V = this.ConfigTest.TensoesEntrada.Entrada160V.Target
                    var toleranciaLeitura160V = this.ConfigTest.TensoesEntrada.Entrada160V.Tolerancia
                }
                // Variaveis para validacao de leitura do potenciometro minimo
                if(this.ConfigTest.Potenciometro.hasOwnProperty("Min")){
                    var leituraPotMin = null
                    var leituraPotMinTarget = this.ConfigTest.Potenciometro.Min.Target
                    var toleranciaLeituraPotMin = this.ConfigTest.Potenciometro.Min.Tolerancia
                }
                if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E1")){
                    var leituraEntradaE1 = null
                }
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("RL5,RL11")}, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try {
                        if (statusResponse) {
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)

                            if(this.ConfigTest.Temperatura.hasOwnProperty("NTC")){
                                if(this.MapaDeValidacao.get("NTC_Baixa") == false){
                                    temperaturaLidaNTC_Baixa = stringByteHexToNumber(respostaReq[5])
                                    console.log("Temperatura lida:", temperaturaLidaNTC_Baixa)
                                    if (temperaturaLidaNTC_Baixa >= (temperaturaTargetNTC_Baixa - temperaturaToleranciaNTC_Baixa) &&
                                        temperaturaLidaNTC_Baixa <= (temperaturaTargetNTC_Baixa + temperaturaToleranciaNTC_Baixa)) {
                                        this.setAprovacaoAnalogica("NTC_Baixa", "Temperatura NTC baixa simulada foi lida corretamente", temperaturaTargetNTC_Baixa, temperaturaToleranciaNTC_Baixa, temperaturaLidaNTC_Baixa)
                                        this.MapaDeValidacao.set("NTC_Baixa", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("NTC_Baixa", "Falha na leitura da temperatura baixa do NTC", temperaturaTargetNTC_Baixa, temperaturaToleranciaNTC_Baixa, temperaturaLidaNTC_Baixa)
                                    }  
                                }
                            }
                            if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada160V")){
                                if(this.MapaDeValidacao.get("Leitura160V") == false){
                                    tensaoLida160V = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                    console.log("Tensao lida:", tensaoLida160V)
                                    if(tensaoLida160V >= (tensaoTarget160V - toleranciaLeitura160V) && tensaoLida160V <= (tensaoTarget160V + toleranciaLeitura160V)){
                                        this.setAprovacaoAnalogica("160V", "Valor de tensão lido pelo controlador correto", tensaoTarget160V, toleranciaLeitura160V, tensaoLida160V)
                                        this.MapaDeValidacao.set("Leitura160V", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("160V", "Falha na leitura de tensão 160V", tensaoTarget160V, toleranciaLeitura160V, tensaoLida160V)
                                    }                           
                                }
                            }
                            if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E1")){
                                if(this.MapaDeValidacao.get("E1") == false){
                                    leituraEntradaE1 = stringByteHexToNumber(respostaReq[6])
                                    console.log("Valor das Entradas:", leituraEntradaE1)
                                    switch(leituraEntradaE1){
                                        case 1:
                                            this.setAprovacaoBooleana("E1","Entrada E1 Funcionou")
                                            this.MapaDeValidacao.set("E1", true)
                                            break
                                        case 3:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1_E2", "Entrada E1_E2 em curto")
                                            }
                                            break
                                        case 5:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1_E3", "Entrada E1_E3 em curto")
                                            }
                                            break
                                        case 8:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1_E2_E3", "Entrada E1_E2_E3 em curto")
                                            }
                                            break
                                        default:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E1", "Valor recebido para entradas incoerente")
                                            }
                                            break
                                    }
                                }
                            }
                            if(this.ConfigTest.Potenciometro.hasOwnProperty("Min")){
                                if(this.MapaDeValidacao.get("Potenciometro_Min") == false){
                                    leituraPotMin = string2BytesHexToNumber(respostaReq[1], respostaReq[2])
                                    console.log("Valor lido no potenciometro:", leituraPotMin)
                                    if(leituraPotMin >= (leituraPotMinTarget - toleranciaLeituraPotMin) && leituraPotMin <= (leituraPotMinTarget + toleranciaLeituraPotMin)){
                                        this.setAprovacaoBooleana("Potenciometro_Min", "Valor minimo do potenciômetro lido corretamente")
                                        this.MapaDeValidacao.set("Potenciometro_Min", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("Pot_Min", "Falha na leitura do potenciometro", leituraPotMinTarget, toleranciaLeituraPotMin, leituraPotMin)
                                    }
                                }
                            }
                            if(this.MapaDeValidacao.get("Potenciometro_Min") && this.MapaDeValidacao.get("E1") && this.MapaDeValidacao.get("Leitura160V")){
                                this.tentativasComunicacao = 0
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Leitura de algum dos parâmetros falhou")) 
                            }
                        } else {
                            if (this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                this.setFalha("E1_COM", "Falha na comunicação ou entrada E1")
                            }
                            throw (new Error("Comando de requisição e resposta do comando Config1 falhou -> Falha na Comunicação"))
                        }
                    }
                    catch (e) {
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if (this.tentativasComunicacao < this.tentativasMaxComunicacao) {
                            setTimeout(() => {
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else {
                            this.incrementaEstado()
                        }
                    }
                })
                break

            case "INV30404_190V_Pot_Max_E2_NTC_Alta":
                // Variaveis para validacao da leitura da entrada NTC (temp alta)
                if(this.ConfigTest.Temperatura.hasOwnProperty("NTC")){
                    var temperaturaLidaNTC_Alta = null
                    var temperaturaTargetNTC_Alta = this.ConfigTest.Temperatura.NTC.Alta.Target
                    var temperaturaToleranciaNTC_Alta = this.ConfigTest.Temperatura.NTC.Alta.Tolerancia
                }
                // Variaveis para validacao da leitura de tensao 190V
                if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada190V")){
                    var tensaoLida190V = null
                    var tensaoTarget190V = this.ConfigTest.TensoesEntrada.Entrada190V.Target
                    var toleranciaLeitura190V = this.ConfigTest.TensoesEntrada.Entrada190V.Tolerancia
                }
                // Variaveis para validacao de leitura do potenciometro maximo
                if(this.ConfigTest.Potenciometro.hasOwnProperty("Max")){
                    var leituraPotMax = null
                    var leituraPotMaxTarget = this.ConfigTest.Potenciometro.Max.Target
                    var toleranciaLeituraPotMax = this.ConfigTest.Potenciometro.Max.Tolerancia
                }
                if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E2")){
                    var leituraEntradaE2 = null
                }
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("RL5,RL7","RL11")}, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try {
                        if (statusResponse) {
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)

                            if(this.ConfigTest.Temperatura.hasOwnProperty("NTC")){
                                if(this.MapaDeValidacao.get("NTC_Alta") == false){
                                    temperaturaLidaNTC_Alta = stringByteHexToNumber(respostaReq[5])
                                    console.log("Temperatura lida:", temperaturaLidaNTC_Alta)
                                    if (temperaturaLidaNTC_Alta >= (temperaturaTargetNTC_Alta - temperaturaToleranciaNTC_Alta) &&
                                        temperaturaLidaNTC_Alta <= (temperaturaTargetNTC_Alta + temperaturaToleranciaNTC_Alta)) {
                                        this.setAprovacaoAnalogica("NTC_Alta", "Temperatura NTC baixa simulada foi lida corretamente", temperaturaTargetNTC_Alta, temperaturaToleranciaNTC_Alta, temperaturaLidaNTC_Alta)
                                        this.MapaDeValidacao.set("NTC_Alta", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("NTC_Alta", "Falha na leitura da temperatura baixa do NTC", temperaturaTargetNTC_Alta, temperaturaToleranciaNTC_Alta, temperaturaLidaNTC_Alta)
                                    }  
                                }
                            }
                            if(this.ConfigTest.TensoesEntrada.hasOwnProperty("Entrada190V")){
                                if(this.MapaDeValidacao.get("Leitura190V") == false){
                                    tensaoLida190V = string2BytesHexToNumber(respostaReq[3], respostaReq[4])
                                    console.log("Tensao lida:", tensaoLida190V)
                                    if(tensaoLida190V >= (tensaoTarget190V - toleranciaLeitura190V) && tensaoLida190V <= (tensaoTarget190V + toleranciaLeitura190V)){
                                        this.setAprovacaoAnalogica("190V", "Valor de tensão lido pelo controlador correto", tensaoTarget190V, toleranciaLeitura190V, tensaoLida190V)
                                        this.MapaDeValidacao.set("Leitura190V", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("190V", "Falha na leitura de tensão 190V", tensaoTarget190V, toleranciaLeitura190V, tensaoLida190V)
                                    }                           
                                }
                            }
                            if(this.ConfigTest.EntradasDigitais.hasOwnProperty("E2")){
                                if(this.MapaDeValidacao.get("E2") == false){
                                    leituraEntradaE2 = stringByteHexToNumber(respostaReq[6])
                                    console.log("Valor das Entradas:", leituraEntradaE2)
                                    switch(leituraEntradaE2){
                                        case 3:
                                            this.setAprovacaoBooleana("E2","Entrada E2 Funcionou")
                                            this.MapaDeValidacao.set("E2", true)
                                            break
                                        case 1:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E2", "Nao acionou")
                                            }
                                            break
                                        case 5:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E2_E3", "Entrada E2_E3 em curto")
                                            }
                                            break
                                        default:
                                            if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                                this.setFalha("E2", "Valor recebido para entradas incoerente")
                                            }
                                            break
                                    }
                                }
                            }
                            if(this.ConfigTest.Potenciometro.hasOwnProperty("Max")){
                                if(this.MapaDeValidacao.get("Potenciometro_Max") == false){
                                    leituraPotMax = string2BytesHexToNumber(respostaReq[1], respostaReq[2])
                                    console.log("Valor lido no potenciometro:", leituraPotMax)
                                    if(leituraPotMax >= (leituraPotMaxTarget - toleranciaLeituraPotMax) && leituraPotMax <= (leituraPotMaxTarget + toleranciaLeituraPotMax)){
                                        this.setAprovacaoBooleana("Potenciometro_Max", "Valor Maximo do potenciômetro lido corretamente")
                                        this.MapaDeValidacao.set("Potenciometro_Max", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                        this.setFalhaAnalogica("Pot_Max", "Falha na leitura do potenciometro", leituraPotMaxTarget, toleranciaLeituraPotMax, leituraPotMax)
                                    }
                                }
                            }
                            if(this.MapaDeValidacao.get("Potenciometro_Max") && this.MapaDeValidacao.get("E2") && this.MapaDeValidacao.get("Leitura190V")){
                                this.tentativasComunicacao = 0
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Leitura de algum dos parâmetros falhou")) 
                            }
                        } else {
                            if (this.tentativasComunicacao >= this.tentativasMaxComunicacao-1){
                                this.setFalha("E1_COM", "Falha na comunicação ou entrada E1")
                            }
                            throw (new Error("Comando de requisição e resposta do comando Config1 falhou -> Falha na Comunicação"))
                        }
                    }
                    catch (e) {
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if (this.tentativasComunicacao < this.tentativasMaxComunicacao) {
                            setTimeout(() => {
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else {
                            this.incrementaEstado()
                        }
                    }
                })
                break

            case "INV30404_Pot_Medio":
                // Variaveis para validacao de leitura do potenciometro medio
                if(this.ConfigTest.Potenciometro.hasOwnProperty("Medio")){
                    var leituraPotMedio = null
                    var leituraPotMedioTarget = this.ConfigTest.Potenciometro.Medio.Target
                    var toleranciaLeituraPotMedio = this.ConfigTest.Potenciometro.Medio.Tolerancia
                }
                this.JigTransceiver.requisicaoResposta_funcRequest(()=>{this.TestProcedures.setupRelesDesligamentoControlado("RL5","RL7")}, this.regexTestResponse, this.tempoResposta, this.numeroTentativasReqResp, (statusResponse, respostaReq) => {
                    try {
                        if (statusResponse) {
                            console.log("Regex conseguiu ser aplicado a resposta")
                            console.log(respostaReq)

                            if(this.ConfigTest.Potenciometro.hasOwnProperty("Medio")){
                                if(this.MapaDeValidacao.get("Potenciometro_Medio") == false){
                                    leituraPotMedio = string2BytesHexToNumber(respostaReq[1], respostaReq[2])
                                    console.log("Valor lido no potenciometro:", leituraPotMedio)
                                    if(leituraPotMedio >= (leituraPotMedioTarget - toleranciaLeituraPotMedio) && leituraPotMedio <= (leituraPotMedioTarget + toleranciaLeituraPotMedio)){
                                        this.setAprovacaoBooleana("Potenciometro_Medio", "Valor Medioimo do potenciômetro lido corretamente")
                                        this.MapaDeValidacao.set("Potenciometro_Medio", true)
                                    } else if(this.tentativasComunicacao >= this.tentativasMaxComunicacao -1){
                                        this.setFalhaAnalogica("Pot_Medio", "Falha na leitura do potenciometro", leituraPotMedioTarget, toleranciaLeituraPotMedio, leituraPotMedio)
                                    }
                                }
                            }
                            if(this.MapaDeValidacao.get("Potenciometro_Medio")){
                                this.tentativasComunicacao = 0
                                this.incrementaEstado()
                            } else{
                                throw (new Error("Leitura de algum dos parâmetros falhou")) 
                            }
                        } else {
                            if (this.tentativasComunicacao >= this.tentativasMaxComunicacao -1){
                                this.setFalha("E1_COM", "Falha na comunicação ou entrada E1")
                            }
                            throw (new Error("Comando de requisição e resposta do comando Config1 falhou -> Falha na Comunicação"))
                        }
                    }
                    catch (e) {
                        console.log(e.message)
                        this.tentativasComunicacao++
                        if (this.tentativasComunicacao < this.tentativasMaxComunicacao) {
                            setTimeout(() => {
                                this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                            }, this.tempoRetentativa)
                        } else {
                            this.incrementaEstado()
                        }
                    }
                })
                break
            case "Validations":
                if(this.Falhas.size == 0){
                    this.incrementaEstado()
                } else{
                    this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
                    this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
                }
                break

            case "FinalValidations":
                this.MapaDeValidacao.forEach((element) => {
                    if(this.MapaDeValidacao.get(element) == false){
                        this.setFalha(element, "Não validado")
                    }
                })
                break

            case "SetPotenciometroMin":
                this.Ui.setMsg("Gire todo potenciometro no sentido horario (direita) como sugere a ilustração.\n\nPressione avança")
                this.Ui.setImage(this.ConfigTest.Imagens.PotenciometroMin)
                
                this.Ui.observerAvanca(()=>{
                    this.incrementaEstado()
                })
                break

            case "SetPotenciometroMaximo":
                this.Ui.setMsg("Gire todo potenciômetro no sentido antihorario (esquerda) como sugere a ilustração.\n\nPressione avança")
                this.Ui.setImage(this.ConfigTest.Imagens.PotenciometroMax)
                this.Ui.observerAvanca(()=>{
                    this.incrementaEstado()
                })
                break

            case "SetPotenciometroMedio":
                this.Ui.setMsg("Gire o potenciometro até aproximadamente seu centro.\n\nPressione avança")
                this.Ui.setImage(this.ConfigTest.Imagens.PotenciometroMedio)
                this.Ui.observerAvanca(()=>{
                    this.incrementaEstado()
                })
                break

            case "EnableTriacControlWithDigitalInputs":
                this.Ui.setMsg("Iniciando teste de saída triac\n\nComunicando com o controlador aguarde...")
                this.Ui.setImage(this.ConfigTest.Imagens.Padrao)
                pvi.daq.ligaRele(5)
                setTimeout(()=>{
                    pvi.daq.ligaRele(7)
                    setTimeout(()=>{
                        pvi.daq.desligaRele(5)
                        this.incrementaEstado()
                    },1000)
                }, 1000)
                break

            case "SaidaTriac220_min":
                var targetOutTriacMin = this.ConfigTest.Triac.Saida220.Min.Target
                var toleranceOutTriacMin = this.ConfigTest.Triac.Saida220.Min.Tolerance
                var flagFinalizaTestTriacMin = false
                var flagStatusLedAmarelo = false

                this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Triac.Triggers.HighAngle, 2500, (media) => {
                    console.log(`Média:`, media)
                    if(media >= (targetOutTriacMin - toleranceOutTriacMin) && media <= (targetOutTriacMin + toleranceOutTriacMin)){
                        this.setAprovacaoAnalogica("Triac220V_Min", "Tensão lida para o valor médio da saída triac dentro da faixa de aceitação", targetOutTriacMin, toleranceOutTriacMin, media)
                        this.MapaDeValidacao.set("SaidaTriac220_min", true)
                    } else{
                        this.setFalhaAnalogicaCritica("Triac220V_Min", "Tensão lida para o valor mínimo da saída triac fora da faixa de aceitação", targetOutTriacMin, toleranceOutTriacMin, media)
                    }
                    flagFinalizaTestTriacMin = true
                })
                this.Ui.setMsg("Led amarelo está acesso?\n\nOBS.: Somente o led amarelo deve estar acesso")
                this.Ui.setImage(this.ConfigTest.Imagens.LEDAmarelo)
                this.Ui.observerSimNao((retornoBooleano)=>{
                    if(retornoBooleano){
                        this.setAprovacaoBooleana("LedAmarelo", "Led amarelo funcionou")
                        this.MapaDeValidacao.set("LED_Amarelo", true)
                    } else{
                        this.setFalha("LedAmarelo", "Led amarelo nao funcionou")
                    }
                    flagStatusLedAmarelo = true
                })
                var controlaAvancoTriacMin = setInterval(() => {
                    if(flagFinalizaTestTriacMin && flagStatusLedAmarelo){
                        this.incrementaEstado()
                        clearInterval(controlaAvancoTriacMin)
                    }
                }, 100)
                break

            case "SaidaTriac220_max":
                var targetOutTriacMax = this.ConfigTest.Triac.Saida220.Max.Target
                var toleranceOutTriacMax = this.ConfigTest.Triac.Saida220.Max.Tolerance
                var flagFinalizaTestTriacMax = false
                var flagStatusLedVerde = false

                this.TestProcedures.setupRelesDesligamentoControlado("RL5","RL7")
                this.Ui.setMsg("Testando Saída Triac 220V máximo")
                this.TestProcedures.SaidaTriacHandler(this.ConfigTest.Triac.Triggers.LowAngle, 2500, (media) => {
                    console.log(`Média:`, media)
                    if(media >= (targetOutTriacMax - toleranceOutTriacMax) && media <= (targetOutTriacMax + toleranceOutTriacMax)){
                        this.setAprovacaoAnalogica("Triac220V_Max", "Tensão lida para o valor máximo da saída triac dentro da faixa de aceitação", targetOutTriacMax, toleranceOutTriacMax, media)
                        this.MapaDeValidacao.set("SaidaTriac220_max", true)
                    } else{
                        this.setFalhaAnalogicaCritica("Triac220V_Max", "Tensão lida para o valor máximo da saída triac fora da faixa de aceitação", targetOutTriacMax, toleranceOutTriacMax, media)
                    }
                })
                this.Ui.setMsg("Led Verde está acesso?\n\nOBS.: Somente o led Verde deve estar acesso")
                this.Ui.setImage(this.ConfigTest.Imagens.LEDVerde)
                this.Ui.observerSimNao((retornoBooleano)=>{
                    if(retornoBooleano){
                        this.setAprovacaoBooleana("LedVerde", "Led Verde funcionou")
                        this.MapaDeValidacao.set("LED_Verde", true)
                    } else{
                        this.setFalha("LedVerde", "Led Verde nao funcionou")
                    }
                    flagStatusLedVerde = true
                })
                var controlaAvancoTriacMax = setInterval(() => {
                    if(flagFinalizaTestTriacMax && flagStatusLedVerde){
                        this.incrementaEstado()
                        clearInterval(controlaAvancoTriacMax)
                    }
                }, 100)
                break
            
            case "DisableOutTriac":
                this.TestProcedures.setupReles(this.ConfigTest.Triac.Triggers.Disable, ()=>{
                    this.incrementaEstado()
                })
                break

            case "GravaFirmwareFinal":
                if(this.ConfigTest.Gravacao == "true"){
                    var diretorioFirmwareFinal = sessionStorage.getItem("Firmware").replace(/[\\]/g, "\/")
                    var firmwareFinalHex = sessionStorage.getItem("Firmware").replace(/\.stp|\.STP/, ".HEX")
                    var optionByteFwFinal = diretorioFirmwareFinal.substring(0, diretorioFirmwareFinal.lastIndexOf("\/")) + "/protect.hex"
                    if(this.Falhas.size == 0){
                        this.Gravacao.gravaFirmwareST(optionBytesDespr, firmwareFinalHex, optionByteFwFinal, 5, ()=>{
                            this.incrementaEstado()
                        })
                    } else{
                        console.error("Houveram falhas durante o teste, gravação do firmware final não será realizada")
                        this.incrementaEstado()
                    }
                } else{
                    console.warn("Gravação de firmware final desabilitada, revise a configuração do .json de teste")
                    this.Falhas.set("Grav_FW_Final", "Gravação de firmware final desabilitada, revisar configuração do item, chamar M&P")
                    this.incrementaEstado()
                }
                break

            case "Start":
                this.Ui.setImage(this.ConfigTest.Imagens.SetupPeca)
                this.Ui.setMsg("Posicione a peça na jiga abaixe a alavanca e pressione avança para iniciar o teste")
                this.Ui.observerAvanca((retorno) => {
                    if (retorno) {
                        this.TempoTeste = new Date()
                        this.incrementaEstado()
                    }
                })
                break

            case "Energizacao110":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..")
                this.TestProcedures.setAlimentacao(this.ConfigTest.Setup.Alimentacao110, () => {
                    setTimeout(()=>{
                        this.incrementaEstado()
                    },1000)
                })
                break

            case "Energizacao220":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..")
                this.TestProcedures.setAlimentacao(this.ConfigTest.Setup.Alimentacao220, () => {
                    setTimeout(()=>{
                        this.incrementaEstado()
                    },1000)
                })
                break

            case "Energizacao160":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..")
                this.TestProcedures.setupReles(this.ConfigTest.Setup.Alimentacao160, () => {
                    setTimeout(()=>{
                        this.incrementaEstado()
                    },1000)
                })
                break

            case "Energizacao190":
                this.Ui.setMsg("Energizando Controlador\n Aguarde..")
                this.TestProcedures.setupReles(this.ConfigTest.Setup.Alimentacao190, () => {
                    setTimeout(()=>{
                        this.incrementaEstado()
                    },1000)
                })
                break

            case "Desenergizacao":
                this.Ui.setMsg("Desenergizando Controlador\n Aguarde..")
                this.TestProcedures.setAlimentacao(null, () => {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Vazio, () => {
                        this.incrementaEstado()
                    })
                })
                break

            case "SetupGravacao":
                this.TestProcedures.setupReles(this.ConfigTest.Setup.Gravacao, () => {
                    this.incrementaEstado()
                })
                break

            case "SetupVazio":
                this.TestProcedures.setupReles(this.ConfigTest.Setup.Vazio, () => {
                    this.incrementaEstado()
                })
                break

            case "EndRastreamento":
                this.Ui.setMsg("Aguardando Finalização do rastreamento")

                if (this.ConfigTest != null) {

                    if (JSON.parse(this.ConfigTest.Rastreamento)) {
                        PVI.FWLink.globalDaqMessagesObservers.addString('Observers.Rastreamento', "PVI.DaqScript.DS_Rastreamento.rastreamento")
                        this.Rastreamento.setRepot(this.SerialNumber, this.RelatorioTeste)
                        this.Rastreamento.end(this.SerialNumber, this.Falhas)

                        this.incrementaEstado()
                    } else {
                        alert("RASTREAMENTO DESATIVADO!\nEntre em contato com o M&P")
                        console.warn("RASTREAMENTO DESATIVADO!")
                        PVI.FWLink.globalDaqMessagesObservers.addString('Observers.Rastreamento', "PVI.DaqScript.DS_Rastreamento.rastreamento")
                        this.Rastreamento.end(this.SerialNumber, this.Falhas)

                        this.incrementaEstado()
                    }
                } else {
                    this.Falhas.set("Erro", "ConfigTest inválido")
                    this.incrementaEstado()
                }
                break

            case "FinalizaTeste":
                this.Ui.setMsg("Finalizando teste")
                Serial.closeAllPorts()

                console.warn(`Tempo de Teste: ${(new Date() - this.TempoTeste) / 1000}s`)
                console.warn(`Tempo de Setup: ${(this.TempoTeste - this.TempoSetup) / 1000}s`)

                this.TestProcedures.setAlimentacao(null, () => {
                    this.TestProcedures.testeSetup(this.ConfigTest.Setup.Vazio, () => {
                        this.Ui.finalizaTeste(this.Falhas)
                    })
                })
                break
        }
    }
    incrementaEstado(){
        console.groupEnd(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
        this.EtapaTesteAtual++
        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
    }
    setAprovacaoBooleana(tag, mensagem){
        logDeuBom(mensagem)
        this.RelatorioTeste.AddTesteFuncional(mensagem, tag, -1, true)
    }
    setAprovacaoAnalogica(tag, mensagem, target, tolerancia, valorMedido){
        logDeuBom(mensagem)
        this.RelatorioTeste.AddTesteComponente(-1, valorMedido, tag, target, tolerancia, "NA", -1, true)
    }
    setFalha(tag, mensagem){
        console.error(mensagem)
        this.RelatorioTeste.AddTesteFuncional(mensagem, tag, -1, false)
        this.Falhas.set(tag, mensagem)
    }
    setFalhaAnalogica(tag, mensagem, target, tolerancia, valorMedido){
        console.error(mensagem)
        this.RelatorioTeste.AddTesteComponente(-1, valorMedido, tag, target, tolerancia, "NA", -1, false)
        this.Falhas.set(tag, mensagem)
    }
    // Utilizado para setar falhas em testes booleanos. Exemplo acionamento de led´s, entradas digitais , etc. Finaliza o teste
    setFalhaCritica(tag, mensagem){
        console.error(mensagem)
        this.RelatorioTeste.AddTesteFuncional(mensagem, tag, -1, false)
        this.Falhas.set(tag, mensagem)
        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
    }
    // Utilizado para setar falhas em testes de grandezas continuas. Exemplo entradas/saidas analogicas, medição de temperatura, etc. Finaliza o teste
    setFalhaAnalogicaCritica(tag, mensagem, target, tolerancia, valorMedido){
        console.error(mensagem)
        this.RelatorioTeste.AddTesteComponente(-1, valorMedido, tag, target, tolerancia, "NA", -1, false)
        this.Falhas.set(tag, mensagem)
        this.EtapaTesteAtual = this.TestProcedures.buscaEtapaFinalizacao("EndRastreamento")
        this.Util.setState(this.ConfigTest.EtapasDeTeste[this.EtapaTesteAtual])
    }
}

function stringByteHexToNumber(stringByte) {
    var number = "0x"
    number += stringByte
    number = Number(number)

    return number
}

function string2BytesHexToNumber(stringByte_MSB, stringByte_LSB) {
    var number = "0x"
    number += stringByte_MSB + stringByte_LSB
    number = Number(number)

    return number
}

function logDeuBom(stringParam) {
    console.log("%c" + stringParam, "color: green; font-weight: bold")
}