// Configuração do ThingSpeak
let THINGSPEAK_CHANNEL_ID = localStorage.getItem('channelId') || '';
let THINGSPEAK_API_KEY = localStorage.getItem('apiKey') || '';
const THINGSPEAK_URL = (id, key) => `https://api.thingspeak.com/channels/${id}/feeds.json?api_key=${key}&results=20`;

// Configuração do histórico
const MAX_HISTORY = 20;
let dataHistory = {
  timestamps: [],
  temperatures: [],
  humidity: []
};

let chart = null;
let updateInterval = null;

// Carregar configuração salva ao iniciar
window.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  initChart();
  setupEventListeners();
  
  if (THINGSPEAK_CHANNEL_ID && THINGSPEAK_API_KEY) {
    startFetching();
  } else {
    setConnectionStatus(false);
    document.getElementById('status').textContent = 'Configure suas credenciais ThingSpeak';
  }
});

// Carregar configuração do localStorage
function loadConfig() {
  const channelId = localStorage.getItem('channelId');
  const apiKey = localStorage.getItem('apiKey');
  
  if (channelId) {
    document.getElementById('channelId').value = channelId;
    THINGSPEAK_CHANNEL_ID = channelId;
  }
  if (apiKey) {
    document.getElementById('apiKey').value = apiKey;
    THINGSPEAK_API_KEY = apiKey;
  }
}

// Setup dos event listeners
function setupEventListeners() {
  const saveBtn = document.getElementById('saveConfig');
  saveBtn.addEventListener('click', saveConfig);
  
  // Permitir salvar com Enter
  document.getElementById('channelId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveConfig();
  });
  document.getElementById('apiKey').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveConfig();
  });
}

// Salvar configuração
function saveConfig() {
  const channelId = document.getElementById('channelId').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!channelId || !apiKey) {
    alert('Por favor, preencha Channel ID e API Key');
    return;
  }
  
  // Salvar no localStorage
  localStorage.setItem('channelId', channelId);
  localStorage.setItem('apiKey', apiKey);
  
  // Atualizar variáveis globais
  THINGSPEAK_CHANNEL_ID = channelId;
  THINGSPEAK_API_KEY = apiKey;
  
  // Mostrar mensagem de sucesso
  const btn = document.getElementById('saveConfig');
  const originalText = btn.textContent;
  btn.textContent = '✓ Salvo!';
  btn.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 2000);
  
  // Limpar histórico anterior
  dataHistory = {
    timestamps: [],
    temperatures: [],
    humidity: []
  };
  document.getElementById('history-list').innerHTML = '<p class="placeholder">Aguardando dados...</p>';
  
  // Iniciar busca de dados
  startFetching();
}

// Iniciar busca periódica de dados
function startFetching() {
  // Buscar imediatamente
  fetchThingSpeakData();
  
  // Configurar para buscar a cada 15 segundos (respeita limite de ThingSpeak)
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(fetchThingSpeakData, 15000);
}

// Buscar dados do ThingSpeak
async function fetchThingSpeakData() {
  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_API_KEY) {
    setConnectionStatus(false);
    return;
  }
  
  try {
    const url = THINGSPEAK_URL(THINGSPEAK_CHANNEL_ID, THINGSPEAK_API_KEY);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.feeds && data.feeds.length > 0) {
      // Processar últimos 5 dados para atualizar
      const recentFeeds = data.feeds.slice(-5);
      
      recentFeeds.forEach(feed => {
        const temp = parseFloat(feed.field1);
        const humidity = parseFloat(feed.field2);
        
        if (!isNaN(temp) && !isNaN(humidity)) {
          updateHistory(temp, humidity, feed.created_at);
        }
      });
      
      // Atualizar com o último dado
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
      document.getElementById('status').textContent = 'Nenhum dado disponível';
    }
  } catch (erro) {
    console.error('Erro ao buscar dados do ThingSpeak:', erro);
    setConnectionStatus(false);
    document.getElementById('status').textContent = 'Erro ao conectar com ThingSpeak';
  }
}

// Atualizar display das métricas
function updateMetricsDisplay(temperature, humidity) {
  document.getElementById('temp').textContent = temperature.toFixed(1) + ' °C';
  document.getElementById('umi').textContent = humidity.toFixed(1) + ' %';
  
  document.getElementById('temp-status').textContent = 
    temperature > 25 ? '⚠️ Elevada' : temperature < 10 ? '❄️ Baixa' : '✓ Normal';
  document.getElementById('umi-status').textContent = 
    humidity > 90 ? '⚠️ Elevada' : humidity < 60 ? '💧 Baixa' : '✓ Normal';
}

// Inicializar gráfico
function initChart() {
  const ctx = document.getElementById('dataChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataHistory.timestamps,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: dataHistory.temperatures,
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          pointBackgroundColor: '#ff6b6b',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Umidade (%)',
          data: dataHistory.humidity,
          borderColor: '#4ecdc4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1',
          pointBackgroundColor: '#4ecdc4',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
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
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Umidade (%)'
          },
          min: 0,
          max: 100,
          grid: {
            drawOnChartArea: false,
          }
        }
      }
    }
  });
}

// Atualizar histórico de dados
function updateHistory(temperature, humidity, timestamp) {
  // Converter timestamp do ThingSpeak para hora local
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // Verificar se já existe este horário no histórico
  const exists = dataHistory.timestamps.some(t => t === timeStr);
  if (exists) return;
  
  dataHistory.timestamps.push(timeStr);
  dataHistory.temperatures.push(temperature);
  dataHistory.humidity.push(humidity);

  // Manter apenas os últimos MAX_HISTORY registros
  if (dataHistory.timestamps.length > MAX_HISTORY) {
    dataHistory.timestamps.shift();
    dataHistory.temperatures.shift();
    dataHistory.humidity.shift();
  }

  // Atualizar gráfico
  if (chart) {
    chart.data.labels = dataHistory.timestamps;
    chart.data.datasets[0].data = dataHistory.temperatures;
    chart.data.datasets[1].data = dataHistory.humidity;
    chart.update('none');
  }

  // Atualizar histórico visual
  updateHistoryList(temperature, humidity, timeStr);
}

// Atualizar lista de histórico
function updateHistoryList(temperature, humidity, timeStr) {
  const historyList = document.getElementById('history-list');
  
  // Verificar se este item já existe
  const existingItems = historyList.querySelectorAll('.history-item');
  for (let item of existingItems) {
    if (item.textContent.includes(timeStr)) {
      return; // Item já existe, não adicionar novamente
    }
  }

  const historyItem = document.createElement('div');
  historyItem.className = 'history-item';
  historyItem.innerHTML = `
    <span class="history-time">${timeStr}</span>
    <span class="history-data">🌡️ ${temperature.toFixed(1)}°C | 💧 ${humidity.toFixed(1)}%</span>
  `;

  historyList.insertBefore(historyItem, historyList.firstChild);

  // Manter apenas os últimos 10 itens visíveis
  const items = historyList.querySelectorAll('.history-item');
  items.forEach((item, index) => {
    if (index >= 10) {
      item.remove();
    }
  });

  // Remover placeholder se houver itens
  const placeholder = historyList.querySelector('.placeholder');
  if (placeholder && items.length > 0) {
    placeholder.remove();
  }
}

// Gerar alertas
function generateAlerts(temperature, humidity) {
  const alertsContainer = document.getElementById('alerts-container');
  const alerts = [];

  if (temperature > 25) {
    alerts.push({
      type: 'warning',
      message: `⚠️ Temperatura alta: ${temperature.toFixed(1)}°C`
    });
  } else if (temperature < 10) {
    alerts.push({
      type: 'warning',
      message: `⚠️ Temperatura baixa: ${temperature.toFixed(1)}°C`
    });
  }

  if (humidity > 95) {
    alerts.push({
      type: 'critical',
      message: `🔴 Umidade crítica: ${humidity.toFixed(1)}%`
    });
  } else if (humidity < 50) {
    alerts.push({
      type: 'warning',
      message: `⚠️ Umidade baixa: ${humidity.toFixed(1)}%`
    });
  }

  // Limpar alertas anteriores
  alertsContainer.innerHTML = '';

  if (alerts.length === 0) {
    alertsContainer.innerHTML = '<p class="no-alerts">Nenhum alerta no momento</p>';
  } else {
    alerts.forEach(alert => {
      const alertItem = document.createElement('div');
      alertItem.className = `alert-item ${alert.type}`;
      alertItem.textContent = alert.message;
      alertsContainer.appendChild(alertItem);
    });
  }
}

// Atualizar status
function updateStatus(temperature, humidity) {
  let status = 'Ambiente Ideal';

  if (temperature > 25) {
    status = '🌡️ Temperatura elevada - Ventilação recomendada';
  } else if (temperature < 10) {
    status = '❄️ Temperatura baixa - Aquecimento recomendado';
  } else if (humidity > 90) {
    status = '💨 Umidade alta - Deumidificação recomendada';
  } else if (humidity < 60) {
    status = '💧 Umidade baixa - Umidificação recomendada';
  }

  document.getElementById('status').textContent = status;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR');
  document.getElementById('last-update').textContent = `Última atualização: ${timeStr}`;
}

// Atualizar indicador de conexão
function setConnectionStatus(connected) {
  const indicator = document.getElementById('connection-status');
  if (connected) {
    indicator.textContent = '● Conectado ao ThingSpeak';
    indicator.className = 'indicator online';
  } else {
    indicator.textContent = '● Desconectado';
    indicator.className = 'indicator offline';
  }
}

