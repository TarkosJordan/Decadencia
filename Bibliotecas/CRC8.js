TAG = 0x07,
crc8Table = [256],

CRC8 = {
    Init: function () {

        let crc = 0

        for (let i = 0; i < 256; i++) {
            crc = i
            for (let j = 0; j < 8; j++) {
                crc = (crc << 1) ^ (((crc & 0x80) > 0) ? TAG : 0);
            }
            crc8Table[i] = crc & 0xFF
        }

    },

    Calculate: function (buffer) {

        function HextoDecimal(d) {
            return Number.parseInt("0x" + d.replace(/[\t ]/g, ''))
        }

        function DecimalToHex(d) {
            var hex = Number(parseInt(d)).toString(16)
            hex = hex.toUpperCase()
            return hex
        }

        let prevCrc = 0xFF
        var newArray = []

        buffer.forEach(element => {
            if (element == undefined) {
                newArray.push(255)
            } else {
                newArray.push(HextoDecimal(element))
            }
        });

        for (let i = 0; i < newArray.length; i++) {
            prevCrc = crc8Table[(prevCrc) ^ (newArray[i])]

        }

        //console.log("CRC encontrado: " + DecimalToHex(prevCrc))
        return DecimalToHex(prevCrc)
    }
}

