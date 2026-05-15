// =====================================================
// CONFIGURAÇÃO THINGSPEAK
// =====================================================

// Channel ID do ThingSpeak
const THINGSPEAK_CHANNEL_ID = '3378723';

// Read API Key do ThingSpeak
const THINGSPEAK_API_KEY = 'NMAZUMB7D5CEH27G';

// URL da API
const THINGSPEAK_URL =
  `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=20`;

// =====================================================
// CONFIGURAÇÃO HISTÓRICO
// =====================================================

const MAX_HISTORY = 20;

let dataHistory = {
  timestamps: [],
  temperatures: [],
  humidity: []
};

let chart = null;
let updateInterval = null;

// =====================================================
// INICIALIZAÇÃO
// =====================================================

window.addEventListener('DOMContentLoaded', () => {

  initChart();

  startFetching();

});

// =====================================================
// BUSCA PERIÓDICA
// =====================================================

function startFetching() {

  // Buscar imediatamente
  fetchThingSpeakData();

  // Atualizar a cada 15 segundos
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  updateInterval = setInterval(fetchThingSpeakData, 15000);

}

// =====================================================
// BUSCAR DADOS DO THINGSPEAK
// =====================================================

async function fetchThingSpeakData() {

  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_API_KEY) {

    setConnectionStatus(false);
    return;

  }

  try {

    const response = await fetch(THINGSPEAK_URL);

    if (!response.ok) {

      throw new Error(`HTTP error! status: ${response.status}`);

    }

    const data = await response.json();

    if (data.feeds && data.feeds.length > 0) {

      // Limpar histórico antes de atualizar
      dataHistory.timestamps = [];
      dataHistory.temperatures = [];
      dataHistory.humidity = [];

      // Processar dados
      data.feeds.forEach(feed => {

        const temp = parseFloat(feed.field1);
        const humidity = parseFloat(feed.field2);

        if (!isNaN(temp) && !isNaN(humidity)) {

          updateHistory(temp, humidity, feed.created_at);

        }

      });

      // Último registro
      const lastFeed = data.feeds[data.feeds.length - 1];

      const temp = parseFloat(lastFeed.field1);
      const humidity = parseFloat(lastFeed.field2);

      if (!isNaN(temp) && !isNaN(humidity)) {

        updateStatus(temp, humidity);

        generateAlerts(temp, humidity);

        updateMetricsDisplay(temp, humidity);

      }

      setConnectionStatus(true);

    } else {

      setConnectionStatus(true);

      document.getElementById('status').textContent =
        'Nenhum dado disponível';

    }

  } catch (erro) {

    console.error('Erro ao buscar dados:', erro);

    setConnectionStatus(false);

    document.getElementById('status').textContent =
      'Erro ao conectar com ThingSpeak';

  }

}

// =====================================================
// MÉTRICAS
// =====================================================

function updateMetricsDisplay(temperature, humidity) {

  document.getElementById('temp').textContent =
    temperature.toFixed(1) + ' °C';

  document.getElementById('umi').textContent =
    humidity.toFixed(1) + ' %';

  document.getElementById('temp-status').textContent =
    temperature > 25
      ? '⚠️ Elevada'
      : temperature < 10
      ? '❄️ Baixa'
      : '✓ Normal';

  document.getElementById('umi-status').textContent =
    humidity > 90
      ? '⚠️ Elevada'
      : humidity < 60
      ? '💧 Baixa'
      : '✓ Normal';

}

// =====================================================
// GRÁFICO
// =====================================================

function initChart() {

  const ctx = document
    .getElementById('dataChart')
    .getContext('2d');

  chart = new Chart(ctx, {

    type: 'line',

    data: {

      labels: dataHistory.timestamps,

      datasets: [

        {
          label: 'Temperatura (°C)',
          data: dataHistory.temperatures,
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255,107,107,0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y'
        },

        {
          label: 'Umidade (%)',
          data: dataHistory.humidity,
          borderColor: '#4ecdc4',
          backgroundColor: 'rgba(78,205,196,0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1'
        }

      ]

    },

    options: {

      responsive: true,

      interaction: {
        mode: 'index',
        intersect: false
      },

      scales: {

        y: {

          type: 'linear',

          position: 'left',

          title: {
            display: true,
            text: 'Temperatura (°C)'
          },

          min: 0,
          max: 50

        },

        y1: {

          type: 'linear',

          position: 'right',

          title: {
            display: true,
            text: 'Umidade (%)'
          },

          min: 0,
          max: 100,

          grid: {
            drawOnChartArea: false
          }

        }

      }

    }

  });

}

// =====================================================
// HISTÓRICO
// =====================================================

function updateHistory(temperature, humidity, timestamp) {

  const date = new Date(timestamp);

  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  dataHistory.timestamps.push(timeStr);

  dataHistory.temperatures.push(temperature);

  dataHistory.humidity.push(humidity);

  // Limitar histórico
  if (dataHistory.timestamps.length > MAX_HISTORY) {

    dataHistory.timestamps.shift();
    dataHistory.temperatures.shift();
    dataHistory.humidity.shift();

  }

  // Atualizar gráfico
  if (chart) {

    chart.data.labels = dataHistory.timestamps;

    chart.data.datasets[0].data =
      dataHistory.temperatures;

    chart.data.datasets[1].data =
      dataHistory.humidity;

    chart.update();

  }

}

// =====================================================
// ALERTAS
// =====================================================

function generateAlerts(temperature, humidity) {

  const alertsContainer =
    document.getElementById('alerts-container');

  alertsContainer.innerHTML = '';

  let alerts = [];

  if (temperature > 25) {

    alerts.push(`⚠️ Temperatura alta: ${temperature.toFixed(1)}°C`);

  }

  if (temperature < 10) {

    alerts.push(`❄️ Temperatura baixa: ${temperature.toFixed(1)}°C`);

  }

  if (humidity > 90) {

    alerts.push(`💨 Umidade alta: ${humidity.toFixed(1)}%`);

  }

  if (humidity < 60) {

    alerts.push(`💧 Umidade baixa: ${humidity.toFixed(1)}%`);

  }

  if (alerts.length === 0) {

    alertsContainer.innerHTML =
      '<p>Nenhum alerta no momento</p>';

    return;

  }

  alerts.forEach(alert => {

    const div = document.createElement('div');

    div.className = 'alert-item';

    div.textContent = alert;

    alertsContainer.appendChild(div);

  });

}

// =====================================================
// STATUS
// =====================================================

function updateStatus(temperature, humidity) {

  let status = 'Ambiente Ideal';

  if (temperature > 25) {

    status =
      '🌡️ Temperatura elevada - Ventilação recomendada';

  } else if (temperature < 10) {

    status =
      '❄️ Temperatura baixa - Aquecimento recomendado';

  } else if (humidity > 90) {

    status =
      '💨 Umidade alta - Desumidificação recomendada';

  } else if (humidity < 60) {

    status =
      '💧 Umidade baixa - Umidificação recomendada';

  }

  document.getElementById('status').textContent = status;

  const now = new Date();

  document.getElementById('last-update').textContent =
    `Última atualização: ${now.toLocaleTimeString('pt-BR')}`;

}

// =====================================================
// STATUS DE CONEXÃO
// =====================================================

function setConnectionStatus(connected) {

  const indicator =
    document.getElementById('connection-status');

  if (connected) {

    indicator.textContent =
      '● Conectado ao ThingSpeak';

    indicator.className =
      'indicator online';

  } else {

    indicator.textContent =
      '● Desconectado';

    indicator.className =
      'indicator offline';

  }

}
