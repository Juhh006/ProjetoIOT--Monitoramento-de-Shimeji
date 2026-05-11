## ⚡ Guia Rápido de Configuração

### 1️⃣ ThingSpeak Setup (5 minutos)

```bash
1. Ir para: https://thingspeak.com/
2. Sign Up → Criar conta gratuita
3. Depois de fazer login:
   - Clique em "Channels"
   - "New Channel"
   - Preencha:
     Name: Smart Mushroom
     Field 1: Temperatura
     Field 2: Umidade
   - "Save Channel"
4. Vá para aba "API Keys"
5. Copie:
   - Channel ID (número no topo)
   - Read API Key (use a primeira chave)
```

### 2️⃣ Código ESP32 (5 minutos)

```bash
1. Abra "ESP32_ThingSpeak.ino"
2. Altere estas 3 linhas:
   
   const char* ssid = "SEU_SSID";
   const char* password = "SUA_SENHA";
   unsigned long channelID = SEU_CHANNEL_ID;
   const char* apiKey = "SUA_API_KEY";

3. No Wokwi:
   - Adicione WiFi no simulador
   - Adicione sensor DHT22 no pino GPIO 4
   - Instale bibliotecas: ThingSpeak e DHT sensor library
   - Execute o código

4. Verifique o Serial Monitor (115200 baud)
   - Deve aparecer "WiFi Conectado"
   - Depois "Dados enviados com sucesso"
```

### 3️⃣ Dashboard Frontend (2 minutos)

```bash
1. Abra "index.html" em seu navegador
2. Procure por "Configuração ThingSpeak"
3. Preencha:
   - Channel ID: (o número que você copinou)
   - Read API Key: (a chave que você copiou)
4. Clique "Salvar Configuração"
5. Aguarde 30 segundos e os dados devem aparecer!
```

### ✅ Checklist Final

- [ ] Conta ThingSpeak criada
- [ ] Canal ThingSpeak configurado com Fields 1 e 2
- [ ] Channel ID e Read API Key obtidos
- [ ] ESP32_ThingSpeak.ino editado com suas credenciais
- [ ] Código ESP32 uploadado e rodando
- [ ] Dashboard aberto no navegador
- [ ] Credenciais inseridas no dashboard
- [ ] Dados aparecem no gráfico

### 🐛 Verificação Rápida

Se não ver dados:

```
1. Serial Monitor do ESP32 mostra erro?
   → Verifique WiFi e credenciais

2. ThingSpeak mostra dados quando acessa?
   → Dashboard ou API Key estão errados

3. Dashboard conectado mas sem gráfico?
   → Limpe cache (Ctrl+Shift+Delete)
   → Espere 1 minuto para primeiro dado

4. Status mostra "Desconectado"?
   → Channel ID ou API Key incorretos
```

### 📚 Documentação Completa

Veja `README.md` para explicação detalhada de cada passo.
