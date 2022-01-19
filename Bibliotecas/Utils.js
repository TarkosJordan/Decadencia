
class Utils {
    constructor(context) {
        this.Context = context
    }

    initTest(callback) {
        this.setOperador((value) => {
            if (value) {
                this.getSerial((serial) => {
                    if (serial != null) {
                        callback(serial)
                    } else {
                        window.alert("Numero de série inválido!")
                        this.initTest(callback)
                    }
                })
            } else {
                this.initTest(callback)
            }
        })
    }
    
    /**
     * Verifica se o pvi já possiu um numero de operador, caso ñ, solicita um numero de operador 
     * @param {*} callback função de retorno 
     */
    setOperador(callback) {
        if (PVI.runInstructionS("ras.getuser", []) == "") {
            this.Context.Ui.setMsg("Informe o Crachá")
            this.Context.Ui.imgTest.style.display = "none"
            BarcodeScanner(this.Context.Ui.video, (value) => {
                this.Context.Ui.video.style.display = "none"
                this.Context.Ui.imgTest.style.display = "initial"
                if (!isNaN(value)) {
                    PVI.runInstructionS("ras.setuser", [value])
                    callback(true)
                } else {
                    this.Context.Ui.getInsertedValue("Informe o Número do Crachá", (value) => {
                        if (!isNaN(value)) {
                            PVI.runInstructionS("ras.setuser", [value])
                            callback(true)
                        } else {
                            callback(false)
                        }
                    })
                }
            })
        } else {
            callback(true)
        }
    }

    /**
     * Solicita um Serial ao usuário
     * @param {*} callback 
     */
    getSerial(callback) {
        this.Context.Ui.setMsg("Informe o número de série do produto.")
        BarcodeScanner(this.Context.Ui.video, (value) => {
            //this.Context.Ui.imgTest.style.display = "none"
            if (value.match(/[1][0][0][0][0][0-9]{8}/) != null) {
                callback(value)
            } else {
                ResetBarcodeScanner(this.Context.Ui.video, () => {
                    this.Context.Ui.getInsertedValue("Informe o Número de Série", (value) => {
                        if (value != null) {
                            if (value.match(/[1][0][0][0][0][0-9]{8}/) != null) {
                                callback(value)
                            } else {
                                callback(null)
                            }
                        } else {
                            this.Context.Ui.setMsg("Teste Interrompido.\n\nClique no botão 'Restart' para reiniciar o teste.")
                        }
                    })
                })
            }
        })
    }

    /**
     * Verifica se é a primeira execução de teste
     * @param {*} callback função de retorno 
     */
    isFirstExec(callback) {
        if (pvi.getVar("_execcount") == 0) {
            callback(true)
        } else {
            callback(false)
        }
    }

    /**
     * retorna dados do servidor para OP ou numero de série
     * @param {*} value Numero de série ou op
     * @param {*} callback  função de retorno 
     */
    requestERP(value, callback) {
        this.callback = callback
        self = this
        if (value.toString().match(/[1][0][0][0][0][0-9]{8}/) != null) {
            var httpReq = new XMLHttpRequest();
            var URL = "http://rast.inova.ind.br/api/effective/products/" + value.toString();
            httpReq.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    let ERPData = JSON.parse(httpReq.responseText)

                    if (sessionStorage.getItem("ProductCode") != ERPData.Information.ProductCode) {
                        sessionStorage.clear()
                        location.reload()
                        sessionStorage.setItem("ProductCode", ERPData.Information.ProductCode)
                        sessionStorage.setItem("FirstExec", true)
                    } else {
                        sessionStorage.setItem("FirstExec", false)
                    }
                    self.callback(ERPData)
                    console.log("requisição HTTP: " + httpReq.statusText)
                } else if (this.status.toString().match(/[3-5][0-9]{2}/) != null) {
                    self.callback(null)
                }
            }
        } else if (value.toString().match(/[o|O][p|P][a-zA-Z]?[a-zA-Z]?[[a-zA-Z]?[-][0-9]{1,7}[-][0-1]/) != null) {
            var httpReq = new XMLHttpRequest();
            var URL = "http://rast.inova.ind.br/api/effective/orders/0/" + value.toString();
            httpReq.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    let ERPData = JSON.parse(httpReq.responseText)
                    self.callback(ERPData)
                    console.log("requisição HTTP: " + httpReq.statusText)
                } else if (this.status.toString().match(/[3-5][0-9]{2}/) != null) {
                    self.callback(null)
                }
            }
        }
        httpReq.open("GET", URL, true);
        httpReq.send();
    }

    /**
     * carrega as configurações do produto através do arquivo Json 
     * @param {*} codigo codigo do produto
     * @param {*} callback função de retorno 
     */
    configuraTest(codigo, callback) {
        var callback = callback
        var toConfigTest = setTimeout(() => {
            callback(null)
        }, 1000);

        if (codigo != "" && !isNaN(codigo)) {
            fetch("Produtos/" + codigo + ".json")
                .then(response => response.json())
                .then((json) => {
                    clearTimeout(toConfigTest)
                    this.Context.Ui.setImage("Imagens/padrao.png")
                    callback(json)
                })
        }

    }
    
    /**
     * Seta a etapa na maquina de estados 
     * @param {String} Etapa 
     * @param {Number} timeOut 
     */
    setState(Etapa = "default", timeOut = 0) {
        setTimeout(() => {
            console.group(Etapa)
            this.Context.MaquinaDeEstados(Etapa)
        }, timeOut)

    }
}

