let port;
let reader;
let inputDone;
let outputStream;

// Sidebar Tabs
document.querySelectorAll('.tabBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabContent').forEach(tab => tab.style.display = 'none');
    document.getElementById(btn.dataset.tab).style.display = 'block';
  });
});

// Criar botões de marcha (G1–G6 do seu Arduino)
const gearContainer = document.getElementById("gearButtons");
for (let i = 1; i <= 6; i++) {
  const div = document.createElement("div");
  div.className = "gearBox";
  div.innerHTML = `
    <h3>Marcha ${i}</h3>
    <button onclick="sendData('SETG${i}')">SETG${i}</button>
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

    // Escrita
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
      if (document.getElementById('autoScroll').checked) {
        textArea.scrollTop = textArea.scrollHeight;
      }
    }
  }
}

// Enviar dados genéricos
async function sendData(text) {
  if (!outputStream) return;
  const writer = outputStream.getWriter();
  await writer.write(text + "\n");
  writer.releaseLock();
}

// Deadzones
function setDZ(type) {
  if (type === "H") {
    const val = document.getElementById("dzH").value;
    sendData("SET_DZH " + val);
  } else if (type === "SEQ") {
    const val = document.getElementById("dzSeq").value;
    sendData("SET_DZSEQ " + val);
  }
}

// Envio manual
document.getElementById('sendBtn').addEventListener('click', async () => {
  const text = document.getElementById('dataToSend').value;
  await sendData(text);
});
