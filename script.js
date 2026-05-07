/*const ipESP32 = "192.168.0.105";

async function atualizarDados() {

  try {

    const resposta = await fetch(
      `http://${ipESP32}/dados`
    );

    const dados = await resposta.json();

    document.getElementById("temp").innerText =
      dados.temperatura + " °C";

    document.getElementById("umi").innerText =
      dados.umidade + " %";

    if (dados.temperatura > 18) {

      document.getElementById("status").innerText =
        "Ventilação Ativada";

    } else if (dados.umidade < 80) {

      document.getElementById("status").innerText =
        "Umidificador Ativado";

    } else {

      document.getElementById("status").innerText =
        "Ambiente Ideal";
    }

  } catch (erro) {

    document.getElementById("status").innerText =
      "ESP32 desconectado";

    console.log(erro);
  }
}

setInterval(atualizarDados, 2000);

atualizarDados();*/

const client = mqtt.connect(
  "wss://broker.hivemq.com:8884/mqtt"
);

client.on("connect", () => {

  console.log("MQTT conectado!");

  client.subscribe("shimeji/dados");
});

client.on("message", (topic, message) => {

  const dados = JSON.parse(message.toString());

  document.getElementById("temp").innerText =
    dados.temperatura + " °C";

  document.getElementById("umi").innerText =
    dados.umidade + " %";
});

