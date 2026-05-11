/*
 * Smart Mushroom - Sistema de Monitoramento IoT para Shimeji
 * Código para ESP32 com Sensor DHT22
 * Plataforma: Wokwi / Arduino IDE
 * 
 * Este código coleta dados de temperatura e umidade de um sensor DHT22
 * e envia para a plataforma ThingSpeak para armazenamento e visualização.
 */

#include <WiFi.h>
#include <ThingSpeak.h>
#include <DHT.h>

// ===== CONFIGURAÇÕES NECESSÁRIAS - ALTERE ESTES VALORES =====

// Credenciais WiFi
const char* ssid = "SEU_SSID";              // Nome da rede WiFi
const char* password = "SUA_SENHA";         // Senha da rede WiFi

// Configurações ThingSpeak
unsigned long channelID = 1234567;          // Seu Channel ID (número)
const char* apiKey = "SUA_API_KEY";         // Sua Write API Key

// ============================================================

// Configurações do Sensor DHT22
#define DHTPIN 4                            // Pino GPIO 4 para o sensor
#define DHTTYPE DHT22                       // Tipo de sensor DHT22
DHT dht(DHTPIN, DHTTYPE);

// Cliente WiFi
WiFiClient client;

// Variáveis de controle
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 20000;  // Enviar a cada 20 segundos
int connectionAttempts = 0;
const int maxConnectionAttempts = 20;

// ===== SETUP =====
void setup() {
  // Inicializar comunicação serial para debug
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\nSmartMushroom - Inicializando...");
  Serial.println("================================");
  
  // Inicializar sensor DHT
  Serial.println("Inicializando sensor DHT22...");
  dht.begin();
  delay(2000);  // Aguardar estabilização
  
  // Conectar ao WiFi
  connectToWiFi();
  
  // Inicializar ThingSpeak
  Serial.println("Inicializando ThingSpeak...");
  ThingSpeak.begin(client);
  
  Serial.println("Setup completo! Sistema pronto para leitura.");
  Serial.println("================================\n");
}

// ===== LOOP PRINCIPAL =====
void loop() {
  // Verificar conexão WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Tentando reconectar...");
    connectToWiFi();
  }
  
  // Verificar se é hora de enviar dados
  if (millis() - lastSendTime >= sendInterval) {
    readAndSendData();
    lastSendTime = millis();
  }
  
  delay(1000);  // Pequena pausa para não sobrecarregar o processador
}

// ===== FUNÇÃO: CONECTAR AO WiFi =====
void connectToWiFi() {
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  connectionAttempts = 0;
  
  while (WiFi.status() != WL_CONNECTED && connectionAttempts < maxConnectionAttempts) {
    delay(500);
    Serial.print(".");
    connectionAttempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Conectado com Sucesso!");
    Serial.print("IP Local: ");
    Serial.println(WiFi.localIP());
    Serial.print("Força do Sinal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("Falha ao conectar ao WiFi. Tentando novamente...");
  }
}

// ===== FUNÇÃO: LER E ENVIAR DADOS =====
void readAndSendData() {
  // Ler temperatura
  float temperatura = dht.readTemperature();
  
  // Ler umidade
  float umidade = dht.readHumidity();
  
  // Verificar se a leitura foi bem-sucedida
  if (isnan(temperatura) || isnan(umidade)) {
    Serial.println("ERRO: Falha ao ler dados do sensor DHT22!");
    Serial.println("Verifique a conexão do sensor.");
    return;
  }
  
  // Exibir leitura no serial
  Serial.println("------------------------------------");
  Serial.print("Leitura realizada em: ");
  printTimeStamp();
  Serial.print("Temperatura: ");
  Serial.print(temperatura, 2);
  Serial.println("°C");
  Serial.print("Umidade: ");
  Serial.print(umidade, 2);
  Serial.println("%");
  
  // Validar valores razoáveis
  if (temperatura < -40 || temperatura > 80) {
    Serial.println("AVISO: Temperatura fora do intervalo esperado!");
  }
  if (umidade < 0 || umidade > 100) {
    Serial.println("AVISO: Umidade fora do intervalo esperado!");
  }
  
  // Enviar para ThingSpeak
  Serial.println("Enviando dados para ThingSpeak...");
  
  // Definir campos a enviar
  ThingSpeak.setField(1, temperatura);  // Field 1: Temperatura
  ThingSpeak.setField(2, umidade);      // Field 2: Umidade
  
  // Escrever os campos
  int httpCode = ThingSpeak.writeFields(channelID, apiKey);
  
  // Verificar resposta
  if (httpCode == 200) {
    Serial.println("Dados enviados com sucesso para ThingSpeak!");
  } else {
    Serial.print("Erro ao enviar dados. Código HTTP: ");
    Serial.println(httpCode);
  }
  
  Serial.println("------------------------------------\n");
}

// ===== FUNÇÃO AUXILIAR: IMPRIMIR TIMESTAMP =====
void printTimeStamp() {
  unsigned long seconds = millis() / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  Serial.print(hours % 24);
  Serial.print(":");
  
  if ((minutes % 60) < 10) Serial.print("0");
  Serial.print(minutes % 60);
  Serial.print(":");
  
  if ((seconds % 60) < 10) Serial.print("0");
  Serial.print(seconds % 60);
  Serial.println();
}

/* 
 * ===== INSTRUÇÕES DE USO =====
 * 
 * 1. Substitua SEU_SSID e SUA_SENHA pelas suas credenciais WiFi
 * 
 * 2. Substitua 1234567 pelo seu Channel ID do ThingSpeak
 * 
 * 3. Substitua SUA_API_KEY pela sua Write API Key do ThingSpeak
 * 
 * 4. No Wokwi:
 *    - Adicione a biblioteca "ThingSpeak" via Library Manager
 *    - Adicione a biblioteca "DHT sensor library" via Library Manager
 *    - Configure o sensor DHT22 no pino GPIO 4
 * 
 * 5. Faça upload do código para a ESP32
 * 
 * 6. Abra o Serial Monitor (115200 baud) para ver o progresso
 * 
 * 7. Os dados serão enviados a cada 20 segundos para ThingSpeak
 * 
 * ===== SOLUÇÃO DE PROBLEMAS =====
 * 
 * Sensor não detectado:
 *    - Verifique conexão do DHT22
 *    - Confirme se está usando GPIO 4
 *    - Tente aumentar o delay em setup() para 3000
 * 
 * WiFi não conecta:
 *    - Verifique credenciais (SSID e Senha)
 *    - Certifique-se de que é uma rede 2.4GHz
 *    - Aumente maxConnectionAttempts para 40
 * 
 * Não envia para ThingSpeak:
 *    - Verifique Channel ID e API Key
 *    - Certifique-se de que o Field 1 é Temperatura
 *    - Certifique-se de que o Field 2 é Umidade
 * 
 * ===== PINOS RECOMENDADOS =====
 * 
 * ESP32 -> DHT22:
 * GPIO 4  -> OUT (saída digital)
 * 3.3V    -> VCC (alimentação)
 * GND     -> GND (terra)
 * 
 * No Wokwi, configure o sensor correspondente para GPIO 4
 */
