class Gravacao{
    constructor(context){
        this.Context = context
    }
    gravaFirmwareST(optionBytesDespr, firmwareHex, optionByteFinal, tentativasGravacao, callback){
        var tentativasRealizadas = 0
        var flagExecutandoGravacao = false   
        var respostaGravOpt = null 
        var respostaGravFW = null

        var controlaGravacao = setInterval(()=>{
            if(!flagExecutandoGravacao){
                flagExecutandoGravacao = true
                if(tentativasRealizadas < tentativasGravacao){
                    respostaGravOpt = pvi.runInstructionS("ST.writeoptionstm8_stlink", [optionBytesDespr, this.Context.ConfigTest.Microcontrolador])
                    console.log("Log Gravação do Option Bytes:\n", respostaGravOpt)
                    respostaGravFW = pvi.runInstructionS("ST.writefirmwarestm8_stlink", [firmwareHex, optionByteFinal, this.Context.ConfigTest.Microcontrolador])
                    console.log("Log Gravação do Firmware:\n", respostaGravFW)
                    setTimeout(() => { 
                        if (respostaGravFW.includes("Verifying PROGRAM MEMORY succeeds") && respostaGravFW.includes("Programming OPTION BYTE succeeds")) {
                            clearInterval(controlaGravacao)
                            callback()
                        } else {
                            tentativasRealizadas++
                            flagExecutandoGravacao = false
                        }
                    }, 800)
                } else{
                    clearInterval(controlaGravacao)
                    this.Context.setFalhaCritica("Gravacao", "Falha na gravação do Firmware")
                }
            }
        }, 100)
    }
}