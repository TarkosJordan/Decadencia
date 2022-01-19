# INV-304

# Firmware de Teste INV-304

## Definição do protocolo

ADDR|CMD|REG|DATA1|DATA2|CRC

#define dREAD                             0x03                  /*!< Comando para realizar uma leitura >!*/
#define dWRITE                            0x06                  /*!< Comando para realizar a escrita em um registrador >!*/
#define dNACK                             0x10                  /*!< Responde caso o comando ou operação sejam inválidos ou proibidos >!*/
#define dACK                              0x12                  /*!< Reponde caso tenha entendido e executado o comando >!*/

#define d304_ADD                          0x0A                  /*!< Endereço da placa >!*/
#define dJG_ADD                           0x0C                  /*!< Endereço da jiga >!*/

## Definição dos "registradores" Retirado do Firmware de Teste

WO -> Somente escrita
RO -> Somente leitura

#define dTEST_CMD_WO                      0x01                  /*!< Comando para entrar no modo de teste. Faz a aplicação não responder mais às entradas e nem ao potenciômetro >!*/
#define dINPUTS_STATUS_RO                 0x02                  /*!< Lê as entradas. A resposta é um byte só: |x|x|x|x| |x|E3|E2|E1| >!*/
#define dPOTENTIOMETER_VALUE_RO           0x03                  /*!< Lê o valor do AD puro do potenciômetro >!*/
#define dTEMPERATURE_VALUE_RO             0x04                  /*!< Lê a temperatura em ºC inteiros (Ex.: 22 >!*/
#define dVIN_VALUE_RO                     0x05                  /*!< Lê a tensão de entrada tratada já em V>!*/
#define dTRIGGER_ANGLE_WO                 0x06                  /*!< Setar o ângulo de disparo do triac. Quanto menor, maior a tensão >!*/
#define dMOTOR_CMD_WO                     0x07                  /*!< Habilita/desabilita acionamento do triac >!*/
#define dLED1_CMD_WO                      0x08                  /*!< Comando para ligar ou desligar o LED1 >!*/
#define dLED1_BLINK_WO                    0x09                  /*!< Comando para piscar o LED1. Passar o período nos dois bytes de dado MSB|LSB >!*/
#define dLED2_CMD_WO                      0x0A                  /*!< Comando para ligar ou desligar o LED2 >!*/
#define dLED2_BLINK_WO                    0x0B                  /*!< Comando para piscar o LED2. Passar o período nos dois bytes de dado MSB|LSB >!*/

````````
Bloco de definições copiado do Firmware de teste biblioteca COM.h
````````

Exemplo:

Jiga manda:
dMY_ADD|dWRITE|dTEST_CMD_WO|0x00|0x01|CRC
Isso faz com que a peça entre no modo de teste. Os LEDs são desligados, os botões não comandam mais nada e o potenciômetro não controla mais o motor

Placa responde:
dJG_ADD|dWRITE|0x00|0x00|(N)ACK|CRC

## Exemplos de Comandos pela Serial

### Entrar modo de teste:

0x0A 0x06 0x01 0x00 0x00 0x98

### Leitura do Status das Entradas:

0x0A 0x03 0x02 0x00 0x00 0x98   // Cada entrada acionada 'seta' um bit do nible inferior do byte de dados 1 (representado pelo 5° byte)

### Controle dos Leds

0x0A 0x06 0x09 0x00 0xFF 0x98 -> Faz led1 piscar verde
0x0A 0x06 0x08 0x00 0x00 0x98 -> Liga ou desliga led1 através do valor do byte 5

0x0A 0x06 0x0B 0x00 0xFF 0x98 -> Faz led2 piscar amarelo
0x0A 0x06 0x0A 0x00 0x00 0x98 -> Liga ou desliga led2 através do valor do byte 5

### Leitura da entrada analogica do poteciometro

0x0A 0x03 0x03 0x00 0x00 0x98 -> Retorna valor lido pela peça nos bytes de dados AD de 10bits portanto um valor de 0 - 1023 (composto pelos bytes de dados numeros 4 e 5 na resposta)

### Leitura da temperatura lida pelo controlador através do sensor NTC

0x0A 0x03 0x04 0x00 0x00 0x98 -> Resposta do controlador vem com o valor de temperatura já convertido em °C

### Leitura da tensão de alimentação lida pelo controlador

0x0A 0x03 0x05 0x00 0x00 0x00 -> Resposta do controlador vem com o valor de tensão em Volts

### Setar saida motor através da comunicação (configura o angulo de disparo do Triac)

0x0A 0x06 0x06 0x00 0xANGLE 0x98   -> Angulo configuravel 0 a 180° sendo que quanto menor o angulo maior a tensão de saida
