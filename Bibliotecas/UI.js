class UI {
    constructor() {
        this.programPath = decodeURIComponent(
            location.pathname.slice(
                location.pathname.indexOf("://") > -1 ?
                    location.pathname.lastIndexOf("://") + 3 : 1,
                location.pathname.lastIndexOf("/")
            )
        );
        this.programPath = this.programPath.replace(/[/]/g, "\\\\");
        this.imagePath = this.programPath + "\\\\imagens\\\\";


        /* Buttons */
        this.btnRestart = document.getElementById("btnRestart")
        this.btnAux1 = document.getElementById("btnAux1")
        this.btnAux2 = document.getElementById("btnAux2")
        this.btnAux3 = document.getElementById("btnAux3")
        this.btnSim = document.getElementById("btnSim")
        this.btnNao = document.getElementById("btnNao")
        this.btnAvanca = document.getElementById("btnAvanca")

        this.testTitle = document.getElementById("testTitle")
        this.testMsg = document.getElementById("testMsg")
        this.imgTest = document.getElementById("imgTest")
        this.divConsole = document.getElementById("divConsole")

        this.video = document.getElementById("video")

        //tempo para mostrar os botoes de resposta
        this.buttonAvancaTime = 100
        this.buttonOkNoTime = 100


        /* config inicial Buttons*/
        this.btnAux1.style.visibility = "hidden" // ui.btnAux1.style.visibility = "visible"
        this.btnAux2.style.visibility = "hidden"
        this.btnAux3.style.visibility = "hidden"
        this.btnSim.style.visibility = "hidden"
        this.btnNao.style.visibility = "hidden"
        this.btnAvanca.style.visibility = "hidden"
        //this.imgTest.style.display = "none"

        this.imgTest.src = "Imagens/padrao.png"
        this.imgTest.style.display = "initial"

        /*
         * adiciona evento de reload na página 
         */
        btnRestart.addEventListener("click", () => {
            pvi.runInstructionS("RESET", [])
            location.reload()
        })
    }
    /**
     * 
     * @param {String} imagem imagem
     * @param {String} msg mensagem de aviso
     * @param {Function} callback  chamada que será executada depois
     */
    modalInfo(imagem, msg, callback) {
        document.getElementById("txtModal").disabled = true
        document.getElementById("modalImg").src = imagem
        document.getElementById("txtModal").value = msg
        document.getElementById("txtModal").style.minHeight = "200px"
        document.getElementById("modal").style.display = ""

        var btnModal = document.getElementById("btnOkModal")
        var evt = function () {
            btnModal.removeEventListener('click', evt)
            document.getElementById("modal").style.display = "none"
            callback()
        }
        btnModal.addEventListener('click', evt)
    }




    observerSimNao(callback, timeout = 300000) {
        setTimeout(() => {
            this.btnSim.style.visibility = "visible"
            this.btnNao.style.visibility = "visible"
            var resp = false
            var valida = function (value, opc) {
                if (!resp) {
                    resp = true
                    btnSim.style.visibility = "hidden"
                    btnNao.style.visibility = "hidden"

                    if (value) {
                        callback(true)
                    } else {
                        callback(false)
                    }
                }
            }

            this.waitAcTc("ArrowUp", (value, opc) => {
                valida(value, opc)
            }, timeout)

            this.waitAcTc("KeyS", (value, opc) => {
                valida(value, opc)
            }, timeout)

            this.waitAcTc("ArrowDown", (value, opc) => {
                valida(value, opc)
            }, timeout)

            this.waitAcTc("KeyN", (value, opc) => {
                valida(value, opc)
            }, timeout)
            this.waitAcBtnSN((value, opc) => {
                valida(value, opc)
            }, timeout)
        }, this.buttonOkNoTime);
    }

    /**
     * @param {Function} callback  recebe uma função
     * @param {Number} timeout  tempo que a função aguarda
     */
    observerAvanca(callback, timeout = 90000) {
        setTimeout(() => {
            btnAvanca.style.visibility = "visible"
            var resp = false
            var valida = function (value) {
                if (!resp) {
                    resp = true
                    btnAvanca.style.visibility = "hidden"
                    if (value) {
                        callback(true)
                    } else {
                        callback(false)
                    }
                }
            }

            this.waitAcTc("ArrowRight", (value) => {
                //console.log("wait ARROw", value);
                valida(value)
            }, timeout)

            this.waitAcTc("KeyA", (value) => {
                valida(value)
            }, timeout)

            this.waitAcBtnAvc((value) => {
                valida(value)
            }, timeout)
        }, this.buttonAvancaTime);
    }
    setImage(imagem) {
        this.imgTest.src = imagem
        this.imgTest.style.display = "initial"
    }
    closeImage() {
        this.imgTest.style.display = "none"
    }
    setMsg(msg) {
        this.testMsg.innerText = msg
    }
    setTitle(msg) {
        this.testTitle.innerText = msg
    }
    async waitAcBtnSN(callback, timeout = 10000) {
        var evtS = function () {
            btnSim.removeEventListener("click", evtS);
            btnNao.removeEventListener("click", evtN);
            clearInterval(to)
            callback(true, "yes")
        }
        var evtN = function () {
            btnSim.removeEventListener("click", evtS);
            btnNao.removeEventListener("click", evtN);
            clearInterval(to)
            callback(true, "no")
        }
        btnSim.addEventListener("click", evtS)
        this.btnNao.addEventListener("click", evtN)

        var to = setTimeout(() => {
            btnSim.removeEventListener("click", evtS);
            btnNao.removeEventListener("click", evtN);
            callback(false)
        }, timeout);
    }
    async waitAcBtnAvc(callback, timeout = 60000) {
        var evt = function () {
            btnAvanca.removeEventListener("click", evt);
            clearInterval(to)
            callback(true)
        }
        btnAvanca.addEventListener("click", evt)

        var to = setTimeout(() => {
            btnAvanca.removeEventListener("click", evt);
            callback(false)
        }, timeout);
    }
    /**
     * Função seta um Observer para verificar o acionamento das tecla e retorna true ou false 
     * @param {String} tecla passar o KeyCode da tecla que se espera o acionamento
     * @param {function} callback função que será executada no retorno
     * @param {Number} timeout tempo que a fuçao aguarda pelo acionamento da tecla
     */
    async waitAcTc(tecla, callback, timeout = 30000) {
        var evt = function () {
            //console.log(window.event.code )
            if (tecla == window.event.code) {
                document.removeEventListener("keydown", evt);
                clearInterval(to)
                callback(true, window.event.code)
            }
        }
        document.addEventListener('keydown', evt)

        var to = setTimeout(() => {
            document.removeEventListener("keydown", evt);
            callback(false, "NA")
        }, timeout);
    }

    getInsertedValue(msg, callback) {
        setTimeout(() => {
            callback(prompt(msg))
        }, 500);
    }

    finalizaTeste(falhas) {
        var Modal_title = document.getElementById("modalTitle")
        var TXT_Modal = document.getElementById("txtModal")
        var Imagem = document.getElementById("modalImg")
        var btnModal = document.getElementById("btnOkModal")

        TXT_Modal.disabled = true
        Modal_title.style.fontSize = "30px"

        var evt = ""
        var to = ""

        document.getElementById("modal").style.display = ""
        if (main.Falhas.size == 0) {
            Modal_title.innerText = "Aprovado"
            Modal_title.style.color = "green"
            Imagem.src = "Imagens/OK.png"
            TXT_Modal.style.display = "none"

            evt = function () {
                document.getElementById("modal").style.display = "none"
                btnModal.removeEventListener('click', evt)
                reload(1)
            }
            btnModal.addEventListener('click', evt)
            to = setTimeout(() => {
                btnModal.removeEventListener('click', evt)
                reload(0)
            }, 5000);


        } else {
            Modal_title.innerText = "Reprovado"
            Modal_title.style.color = "red"
            Imagem.src = "Imagens/NOK.png"
            TXT_Modal.style.display = ""
            let texto = ""
            falhas.forEach((valor, chave) => {
                texto += chave + " -> " + valor + "\n"
            });
            TXT_Modal.value = "Falha nos testes:\n" + texto
            evt = function () {
                document.getElementById("modal").style.display = "none"
                btnModal.removeEventListener('click', evt)
                reload(0)
            }
            btnModal.addEventListener('click', evt)
        }
        function reload(opc) {
            if (opc == 1) {
                clearTimeout(to)
            }
            pvi.runInstructionS("RESET", [])
            location.reload()
        }
    }
}