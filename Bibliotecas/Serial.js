class Serial {

   constructor(Context, Baud = 9600, Parit = 0, ComPort = null) {

      this.Context = Context
      this.serialDataBuffer = ""
      this.BAUD = Baud
      this.COMPORT = ComPort
      this.PARIDADE = Parit
   }

   open(com = this.COMPORT, baud = this.BAUD, paridade = this.PARIDADE) {
      return pvi.runInstruction("serial.open", ['"' + com + '"', '"' + baud + '"', '"' + paridade + '"']) == 1;
   }

   /** Close the serial port */
   close(com = this.COMPORT) {
      return pvi.runInstruction("serial.close", ['"' + com + '"']) == 1;
   }

   /** return true if the port is opened. */
   isOpen(com = this.COMPORT) {
      return pvi.runInstruction("serial.isopen", ['"' + com + '"']) == 1;
   }

   getPortList() {
      return DAQ.runInstructionS("serial.getportscsv", []).split(";")
   }

   setPortCom(ComPort) {
      this.COMPORT = ComPort
   }

   getComPort() {
      return this.COMPORT
   }
   getConnectedPortCom_funcRequest = (funcRequest, regex, tentativasCom, callback) => {
      var portList = this.getPortList()
      var tentativasCom = tentativasCom
      var numeroTentativasRealizadas = 0
      var testandoPorta = true
      const tempoResposta = 1000
      let indexPort = 0

      funcRequest()

      setTimeout(()=>{
         let getPort = setInterval(() => {
            if(testandoPorta){
               testandoPorta = false
               if (indexPort < portList.length && portList[indexPort] != "") {
                  var PORT = portList[indexPort]
   
                  if(numeroTentativasRealizadas < tentativasCom){
                     
                     console.log(`Tentaviva ${numeroTentativasRealizadas+1} de se comunicar com a porta ${PORT}`)
                     this.open(PORT, this.BAUD, this.PARIDADE)
                     
                     if(this.isOpen(PORT) == 1){
                        console.log("PORTA ABERTA", PORT)

                        this.ReadData(PORT) //Limpa buffer inicial da porta
            
                        setTimeout(() => {
                           var byteData = this.ReadData(PORT)
         
                           if (byteData.match(regex)) {
                              console.log(`${PORT} Match: ${byteData}`)
                              clearInterval(getPort)
                              this.setPortCom(PORT)
                              this.close(PORT)
                              callback(true, PORT)
                           } else {
                              console.log(`${PORT} Unmatch: ${byteData}`)
                              this.close(PORT)
                              numeroTentativasRealizadas++
                              testandoPorta = true
                           }
                        }, tempoResposta);
            
                     } else{
                        console.log("Porta COM não foi aberta corretamente PORTA:", PORT)
                        numeroTentativasRealizadas++
                        this.close(PORT)
                        testandoPorta = true
                     }
                  } else {
                     console.log("Numero de tentativas esgotadas para PORTA:", PORT)
                     this.close(PORT)
                     indexPort++
                     testandoPorta = true
                  }
               } else{
                  console.log(`Não encontrou nenhuma porta COM disponivel`)
                  clearInterval(getPort)
                  callback(false, "null")
               }
            }
         }, 100)
      }, 500)
   }

   getConnectedPortCom = (dataSend, regex, tentativasCom,  callback) => {
      var portList = this.getPortList()
      var tentativasCom = tentativasCom
      var numeroTentativasRealizadas = 0
      var testandoPorta = true
      const tempoResposta = 1500
      let indexPort = 0

      setTimeout(()=>{
         let getPort = setInterval(() => {
            if(testandoPorta){
               testandoPorta = false
               if (indexPort < portList.length && portList[indexPort] != "") {
                  var PORT = portList[indexPort]
   
                  if(numeroTentativasRealizadas < tentativasCom){
                     
                     console.log(`Tentaviva ${numeroTentativasRealizadas+1} de se comunicar com a porta ${PORT}`)
                     this.open(PORT, this.BAUD, this.PARIDADE)
                     
                     if(this.isOpen(PORT) == 1){
                        console.log("PORTA ABERTA", PORT)
                        if (this.SendData(dataSend, PORT) == 1) {
            
                           setTimeout(() => {
                              var byteData = this.ReadData(PORT)
            
                              if (byteData.match(regex)) {
                                 console.log(`${PORT} Match: ${byteData}`)
                                 clearInterval(getPort)
                                 this.setPortCom(PORT)
                                 this.close(PORT)
                                 callback(true, PORT)
                              } else {
                                 console.log(`${PORT} Unmatch: ${byteData}`)
                                 this.close(PORT)
                                 numeroTentativasRealizadas++
                                 testandoPorta = true
                              }
                           }, tempoResposta);
            
                        } else {
                           console.log(`${PORT} Não Enviou`)
                           this.close(PORT)
                           numeroTentativasRealizadas++
                           testandoPorta = true
                        }
                     } else{
                        console.log("Porta COM não foi aberta corretamente PORTA:", PORT)
                        numeroTentativasRealizadas++
                        this.close(PORT)
                        testandoPorta = true
                     }
                  } else {
                     console.log("Numero de tentativas esgotadas para PORTA:", PORT)
                     this.close(PORT)
                     indexPort++
                     testandoPorta = true
                  }
               } else{
                  console.log(`Não encontrou nenhuma porta COM disponivel`)
                  clearInterval(getPort)
                  callback(false, "null")
               }
            }
         }, 100)
      }, 500)
   }

   estabeleceComunicacaoCOM_funcRequest = (portaCom, funcRequest, regex, tentativasCom, callback) => {

      var tentativasCom = tentativasCom
      var numeroTentativasRealizadas = 0
      var testandoPorta = true
      const tempoResposta = 1000
      
      funcRequest()

      setTimeout(()=>{
         let getPort = setInterval(() => {
            if(testandoPorta){
               testandoPorta = false
               if(numeroTentativasRealizadas < tentativasCom){
                  
                  console.log(`Tentaviva ${numeroTentativasRealizadas+1} de se comunicar com a porta ${portaCom}`)
                  this.open(portaCom, this.BAUD, this.PARIDADE)
                  
                  if(this.isOpen(portaCom) == 1){
                     console.log("PORTA ABERTA", portaCom)

                     this.ReadData(portaCom) //Limpa buffer inicial da porta
         
                     setTimeout(() => {
                        var byteData = this.ReadData(portaCom)
      
                        if (byteData.match(regex)) {
                           console.log(`${portaCom} Match: ${byteData}`)
                           clearInterval(getPort)
                           this.setPortCom(portaCom)
                           this.close(portaCom)
                           callback(true, portaCom)
                        } else {
                           console.log(`${portaCom} Unmatch: ${byteData}`)
                           this.close(portaCom)
                           numeroTentativasRealizadas++
                           testandoPorta = true
                        }
                     }, tempoResposta);
   
                  } else{
                     console.log("Porta COM não foi aberta corretamente PORTA:", portaCom)
                     numeroTentativasRealizadas++
                     this.close(portaCom)
                     testandoPorta = true
                  }
               } else {
                  console.log("Numero de tentativas esgotadas para PORTA:", portaCom)
                  this.close(portaCom)
                  clearInterval(getPort)
                  callback(false, null)
               } 
            }
         }, 100)
      },500)
   }

   estabeleceComunicacaoCOM = (portaCom, dataSend, regex, tentativasCom, callback) => {

      var tentativasCom = tentativasCom
      var numeroTentativasRealizadas = 0
      var testandoPorta = true
      const tempoResposta = 1400

      setTimeout(()=>{
         let getPort = setInterval(() => {
            if(testandoPorta){
               testandoPorta = false
               if(numeroTentativasRealizadas < tentativasCom){
                  
                  console.log(`Tentaviva ${numeroTentativasRealizadas+1} de se comunicar com a porta ${portaCom}`)
                  this.open(portaCom, this.BAUD, this.PARIDADE)
                  
                  if(this.isOpen(portaCom) == 1){
                     console.log("PORTA ABERTA", portaCom)
                     if (this.SendData(dataSend, portaCom) == 1) {
         
                        setTimeout(() => {
                           var byteData = this.ReadData(portaCom)
         
                           if (byteData.match(regex)) {
                              console.log(`${portaCom} Match: ${byteData}`)
                              clearInterval(getPort)
                              this.setPortCom(portaCom)
                              this.close(portaCom)
                              callback(true, portaCom)
                           } else {
                              console.log(`${portaCom} Unmatch: ${byteData}`)
                              this.close(portaCom)
                              numeroTentativasRealizadas++
                              testandoPorta = true
                           }
                        }, tempoResposta);
   
                     } else {
                        console.log(`${portaCom} Não Enviou`)
                        this.close(portaCom)
                        numeroTentativasRealizadas++
                        testandoPorta = true
                     }
                  } else{
                     console.log("Porta COM não foi aberta corretamente PORTA:", portaCom)
                     numeroTentativasRealizadas++
                     this.close(portaCom)
                     testandoPorta = true
                  }
               } else {
                  console.log("Numero de tentativas esgotadas para PORTA:", portaCom)
                  this.close(portaCom)
                  clearInterval(getPort)
                  callback(false, null)
               } 
            }
         }, 100)
      },500)
   }

   ReadData(port = this.COMPORT, log = true) {
      let buffer = DAQ.runInstructionS("serial.readbytedata", [port])
      if (log) {
         console.log(`PVI <= ${buffer}`)
      }
      return buffer
   }

   SendData(DataSend, porta = this.COMPORT, log = true) {
      if (log) {
         console.log(`PVI => ${DataSend}`)
      }
      return DAQ.runInstructionS("serial.sendbyte", [porta, DataSend])
   }

   SplitData(SerialData, spliter = " 0D ") {
      return SerialData.split(spliter)
   }

   ConvertAscii(hex) {
      hex = hex.match(/[0-9A-Fa-f]*/g).filter(function (el) {
         return el != "";
      })
      hex = hex.map(function (item) {
         return parseInt(item, 16)
      })
      var bytes = new Uint8Array(hex)
      return new TextDecoder("ASCII", { NONSTANDARD_allowLegacyEncoding: true }).decode(bytes)
   }
   /**
    * Converte um object para um Map
    * @param {Map} mapa map que será retonado
    * @param {Object} reg Objeto de onde são tirados os dador para criar o Map
    */
   mapReturn(mapa, reg) {
      var w = Object.entries(reg)
      w.forEach((data) => {
         mapa.set(data[0], data[1])
      });
      return mapa
   }

   /**
    * 
    * @param {Map} ByteArray ByteArray de bytes a ter string de requisição gerada com CRC calculado.
    * @param {RegExp} regex Validação do formato através de expressão regular. [OPCIONAL]
    * @param {bool} calculaCRC Habilita cálculo do CRC
    * @returns String de requisição
    */
   geraStringReq(ByteArray, regex = null, calculaCRC = true) {

      let crc = "00"
      let stringReq = ""
      let bufferString = ""

      if (calculaCRC) {
         crc = CRC8.Calculate(ByteArray)
      }

      ByteArray.forEach((byte) => {
         bufferString += byte + " "
      })

      bufferString += crc

      if (regex != null) {
         if (bufferString.match(regex)) {
            stringReq = bufferString
         } else {
            console.error("Formato da requisição inválido!")
         }
      } else {
         stringReq = bufferString
      }

      return (stringReq)
   }


   /**
    * 
    * @param {Map} resMap Mapa que terá dados recebidos inseridos e retornado no callback
    * @param {string} req String de requisição
    * @param {RegExp} Regex Expressão regular que valida dados recebidos
    * @param {bool} log Habilita log dos pacotes trafegados
    * @param {function} callback função de callback
    */
   LeValor(resMap, req, Regex, log, timeOut, callback) {

      this.ReadData(this.COMPORT, false) //Limpa buffer

      this.SendData(req, this.COMPORT, log)

      setTimeout(() => {

         this.serialDataBuffer = ""
         this.serialDataBuffer += this.ReadData(this.COMPORT, log)

         var recievedData = this.serialDataBuffer.match(Regex)

         if (recievedData != null) {

            recievedData = recievedData.input.split(" ")

            let indice = 0

            if (recievedData.length > 3) {
               resMap.forEach((byteValue, byteName) => {
                  resMap.set(byteName, recievedData[indice])
                  indice++
               });
            }

            callback(resMap)

         } else {
            callback(false)
         }
      }, timeOut);
   }
   requisicaoResposta_funcRequest(funcRequest, regexResposta, tempoResposta, numeroTentativas, callback){ 
      var resposta = null, flagStatusComando = false, tentativas = 0
      var executandoComunicacao = false
      var controlaComunicacao = setInterval(()=>{
         if(!executandoComunicacao){
            console.log("Tentativa Requisição e Resposta", tentativas+1)
            executandoComunicacao = true
            
            this.ReadData()   //Limpa buffer serial do PVI
            funcRequest()

            setTimeout(()=>{
               resposta = this.ReadData()
               if(resposta != null){
                  resposta = resposta.match(regexResposta)
                  if(resposta != null){
                     resposta = resposta.input.split(" ")
                     flagStatusComando = true
                  } else{
                     tentativas++
                     console.log("O regex não conseguiu ser aplicado a resposta do controlador")
                     executandoComunicacao = false
                  }
               } else{
                  tentativas++
                  console.error("Leitura na serial falhou")
                  executandoComunicacao = false
               }
               // Condicao de saida do metodo seja por quantidade de tentativas atinjidas ou por resposta coerente
               if(tentativas >= numeroTentativas || flagStatusComando){
                  clearInterval(controlaComunicacao)
                  this.ReadData()   //Limpa buffer na saida
                  callback(flagStatusComando, resposta)
                  return resposta
               } 
            }, tempoResposta)
         } 
      }, 500)
   }

   requisicaoResposta(requisicao, regexResposta, tempoResposta, numeroTentativas, callback){ 
      var resposta = null, flagStatusComando = false, tentativas = 0
      var executandoComunicacao = false
      var controlaComunicacao = setInterval(()=>{
         if(!executandoComunicacao){
            console.log("Tentativa Requisição e Resposta", tentativas+1)
            executandoComunicacao = true
            this.ReadData()   //Limpa buffer serial do PVI
      
            if(this.SendData(requisicao)){
               setTimeout(()=>{
                  resposta = this.ReadData()
                  if(resposta != null){
                     resposta = resposta.match(regexResposta)
                     if(resposta != null){
                        resposta = resposta.input.split(" ")
                        flagStatusComando = true
                     } else{
                        tentativas++
                        console.error("O regex não conseguiu ser aplicado a resposta do controlador")
                        executandoComunicacao = false
                     }
                  } else{
                     tentativas++
                     console.error("Leitura na serial falhou")
                     executandoComunicacao = false
                  }
                  // Condicao de saida do metodo seja por quantidade de tentativas atinjidas ou por resposta coerente
                  if(tentativas >= numeroTentativas || flagStatusComando){
                     clearInterval(controlaComunicacao)
                     this.ReadData()   //Limpa buffer na saida
                     callback(flagStatusComando, resposta)
                     return resposta
                  } 
               }, tempoResposta)
            } else{
               tentativas++
               console.error("Requisição não foi enviada corretamente")
               executandoComunicacao = false
            }
         } 
      }, 500)
   }

   //#region STATIC FUNCTIONS

   static BinaryToHex(d) {
      try {
         var hex = Number(parseInt(d, 2)).toString(16)
         hex = hex.toUpperCase()
         while (hex.length < 4) {
            hex = "0" + hex;
         }
         return hex.substring(0, 2) + " " + hex.substring(2)
      } catch (error) {
         console.error("Erro ao converter binario para hexadecimal")
      }
   }

   static DecimalToHex(d) {
      try {
         var hex = Number(parseInt(d)).toString(16)
         hex = hex.toUpperCase()
         while (hex.length < 4) {
            hex = "0" + hex;
         }
         return hex.substring(0, 2) + " " + hex.substring(2)
      } catch (error) {
         console.error("Erro ao converter decimal para hexadecimal")
      }
   }

   static HextoDecimal(d) {
      try {
         return Number.parseInt("0x" + d.replace(/[\t ]/g, ''))
      } catch (error) {
         console.error("Erro ao converter hexadecimal para decimal")
      }

   }

   static hex2bin(hex) {
      try {
         return (parseInt(hex, 16).toString(2)).padStart(8, '0');
      } catch (error) {
         console.error("Erro ao converter hexadecimal para binario")
      }
   }

   static closeAllPorts() {
      let ports = DAQ.runInstructionS("serial.getportscsv", []).split(";")
      ports.forEach(port => {
         pvi.runInstruction("serial.close", ['"' + port + '"']) == 1;
      });
   }
   //#endregion

}