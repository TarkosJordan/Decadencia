Observers = {

    Rastreamento(message, param) {

        var result = param[0];
        var info = JSON.parse(param[1])

        if (message.includes("rastreamento.init")) {

            var ns = message.match(/[1][0]{4}[0-9]{8}/)

            if (main.SerialNumber == ns) {

                if (!result) {

                    main.TesteAtivo = false
                    main.Falhas.set(info.ResultError, info.Message)
                }
                console.log(info)
            }
        }

        if (message.includes("rastreamento.end")) {

            var ns = message.match(/[1][0]{4}[0-9]{8}/)

            if (main.SerialNumber == ns) {

                if (!result) {

                    main.TesteAtivo = false
                    main.Falhas.set(info.ResultError, info.Message)

                }
                console.log(info)
            }
        }
    },
}