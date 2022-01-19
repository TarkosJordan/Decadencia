class Validations {
    constructor(context) {
        this.Context = context;
    }

    /*VALIDATIONS*/

    ValidaSaidaTriac(tensao, callback) {
        if (tensao == 110) {
            var ValidationMap = new Map(
                Object.entries(this.Context.ConfigTest.Validations.Saida110)
            );
            var mapTarget = this.Context.RelatorioSaida110;
        } else if (tensao == 220) {
            var ValidationMap = new Map(
                Object.entries(this.Context.ConfigTest.Validations.Saida220)
            );
            var mapTarget = this.Context.RelatorioSaida220;
        }

        let Init = mapTarget.get("Init");
        let Stop = mapTarget.get("Stop");
        let Min = mapTarget.get("Min");
        let Medio = mapTarget.get("Medio");
        let Max = mapTarget.get("Max");
        let SobreTemperatura = mapTarget.get("SobreTemperatura");
        let RearmeSobreTemperatura = mapTarget.get("RearmeSobreTemperatura");

        ValidationMap.forEach((Obj, Param) => {

            if (Param == "Init") {

                if (Init != null && Init != undefined) {

                    if (!(Init >= Obj.Target - Obj.Tolerance && Init <= Obj.Target + Obj.Tolerance)) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${Init}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Init, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Init, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Falha Na Leitura de Tensão`);
                }

            } else if (Param == "Stop") {

                if (Stop != null && Stop != undefined) {

                    if (!(Stop >= Obj.Target - Obj.Tolerance && Stop <= Obj.Target + Obj.Tolerance)) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${Stop}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Stop, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Stop, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Falha Na Leitura de Tensão`);
                }

            } else if (Param == "Min") {

                if (Min != null && Min != undefined) {

                    if (!(Min >= Obj.Target - Obj.Tolerance && Min <= Obj.Target + Obj.Tolerance)) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${Min}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Min, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Min, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Falha Na Leitura de Tensão`);
                }

            } else if (Param == "Medio") {

                if (Medio != null && Medio != undefined) {

                    if (!(Medio >= Obj.Target - Obj.Tolerance && Medio <= Obj.Target + Obj.Tolerance)) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${Medio}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Medio, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Medio, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Falha Na Leitura de Tensão`);
                }

            } else if (Param == "Max") {

                if (Max != null && Max != undefined) {

                    if (!(Max >= Obj.Target - Obj.Tolerance && Max <= Obj.Target + Obj.Tolerance)) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${Max}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Max, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, Max, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "I", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Falha Na Leitura de Tensão`);
                }

            } else if (ValidationMap.has("SobreTemperatura") && Param == "SobreTemperatura") {

                if (SobreTemperatura != null && SobreTemperatura != undefined) {

                    if (!(SobreTemperatura >= Obj.Target - Obj.Tolerance && SobreTemperatura <= Obj.Target + Obj.Tolerance)
                    ) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${SobreTemperatura}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, SobreTemperatura, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "J", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, SobreTemperatura, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "J", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Sobre temperatura`, `Falha Na Leitura de Tensão`);
                }
            } else if (ValidationMap.has("RearmeSobreTemperatura") && Param == "RearmeSobreTemperatura") {

                if (RearmeSobreTemperatura != null && RearmeSobreTemperatura != undefined) {

                    if (!(RearmeSobreTemperatura >= Obj.Target - Obj.Tolerance && RearmeSobreTemperatura <= Obj.Target + Obj.Tolerance)
                    ) {
                        this.Context.Falhas.set(`Saída Triac ${tensao}V ${Param}`, `Esperado: ${Obj.Target}V Obtido: ${RearmeSobreTemperatura}V`);
                        this.Context.TesteAtivo = false;
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, RearmeSobreTemperatura, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "J", -1, false);
                    } else {
                        this.Context.RelatorioRastreamento.AddTesteComponente(-1, RearmeSobreTemperatura, `ALIM:${tensao}V - POT:${Param}`, Obj.Target, Obj.Tolerance, "J", -1, true);
                    }
                } else {
                    this.Context.Falhas.set(`Rearme Sobre temperatura`, `Falha Na Leitura de Tensão`);
                }
            }
        });

        callback();
    }



    TransferenciaDeFalhas(callback) {

        let segundosTempoTeste = (new Date() - this.Context.TempoTeste) / 1000;
        let segundosTempoSetup = ((new Date() - this.Context.TempoSetup) / 1000) - segundosTempoTeste;

        this.Context.RelatorioRastreamento.TempoSetup = Number(segundosTempoSetup.toFixed(2));
        this.Context.RelatorioRastreamento.TempoTeste = Number(segundosTempoTeste.toFixed(2));

        this.Context.RelatorioGeral.forEach((Valor, Chave) => {

            if (Valor == null) {
                this.Context.RelatorioGeral.set(Chave, "Não foi possível avançar até esta etapa.");
                this.Context.Falhas.set(Chave, "Não foi possível avançar até esta etapa.");
                this.Context.RelatorioRastreamento.AddTesteFuncional("Não foi possível avançar até esta etapa.", Chave, -1, false);

            } else if (Valor !== true) {
                this.Context.RelatorioGeral.set(Chave, "Falha");
                this.Context.Falhas.set(Chave, "Falha");
                this.Context.RelatorioRastreamento.AddTesteFuncional("", Chave, -1, false);

            } else {
                this.Context.RelatorioGeral.set(Chave, Valor);
                this.Context.RelatorioRastreamento.AddTesteFuncional("", Chave, -1, true);
            }
        });

        callback();
    }
}