let port;
let reader;
let inputDone;
let outputStream;

// Criar botões G1 a G8
const gearContainer = document.getElementById("gearButtons");
for (let i = 1; i <= 8; i++) {
  const div = document.createElement("div");
  div.className = "gearBox";
  div.innerHTML = `
    <h3>Marcha ${i}</h3>
    <button onclick="sendGear(${i})">Set M${i}</button>
  `;
  gearContainer.appendChild(div);
}

// Conectar
document.getElementById('connectBtn').addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    document.getElementById('status').textContent = "✅ Dispositivo conectado";
    document.getElementById('connectBtn').disabled = true;
    document.getElementById('disconnectBtn').disabled = false;

    // Iniciar leitura
    const decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();
    readLoop();

    // Preparar escrita
    const encoder = new TextEncoderStream();
    outputStream = encoder.writable;
    encoder.readable.pipeTo(port.writable);

  } catch (err) {
    document.getElementById('status').textContent = "❌ Erro: " + err;
  }
});

// Desconectar
document.getElementById('disconnectBtn').addEventListener('click', async () => {
  if (reader) {
    await reader.cancel();
    reader.releaseLock();
  }
  if (port) {
    await port.close();
    port = null;
  }
  document.getElementById('status').textContent = "🔌 Desconectado";
  document.getElementById('connectBtn').disabled = false;
  document.getElementById('disconnectBtn').disabled = true;
});

// Loop leitura
async function readLoop() {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const textArea = document.getElementById('receivedData');
      textArea.value += value + "\n";

      // Auto-scroll se estiver ativado
      if (document.getElementById('autoScroll').checked) {
        textArea.scrollTop = textArea.scrollHeight;
      }
    }
  }
}

// Enviar comando de marcha
async function sendGear(n) {
  await sendData("G" + n);
}

// Enviar texto manual
document.getElementById('sendBtn').addEventListener('click', async () => {
  const text = document.getElementById('dataToSend').value;
  await sendData(text);
});

// Função genérica para enviar dados
async function sendData(text) {
  if (!outputStream) return;
  const writer = outputStream.getWriter();
  await writer.write(text + "\n");
  writer.releaseLock();
}
