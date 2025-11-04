require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

const VERIFY_URL = process.env.VERIFY_URL || "http://localhost:3001/chatbot/verify-number";
const CHATBOT_URL = process.env.CHATBOT_URL || "http://localhost:3001/chatbot";

function formatWhatsAppNumber(raw) {
  const digits = raw.replace(/\D/g, "");

  let local = digits.startsWith("55") ? digits.slice(2) : digits;

  const area = local.slice(0, 2);
  let number = local.slice(2);

  if (number.length === 8) {
    number = "9" + number;
  }

  const formatted = `(${area}) ${number.slice(0, 5)}-${number.slice(5)}`;

  return formatted;
}

async function verifyNumber(formattedNumber) {
  console.log({ formattedNumber });
  try {
    const res = await axios.get(VERIFY_URL, {
      params: { number: formattedNumber },
    });
    console.log({ res });
    return res.data;
  } catch (err) {
    return { success: false, data: false, error: err?.message };
  }
}

async function sendToChatbot(input, phone) {
  try {
    const res = await axios.post(CHATBOT_URL, { input, phone });
    return res.data;
  } catch (err) {
    throw err;
  }
}

function isGroupChat(waId) {
  return /@g\.us$/.test(waId);
}

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth'
  }),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // CRÍTICO: evita múltiplos processos
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-blink-features=AutomationControlled"
    ]
  },
});

client.on("qr", (qr) => {
  console.log("Scan the QR code below to authenticate:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp client is ready.");
});

client.on("message", async (message) => {
  try {
    if (!message.from || isGroupChat(message.from)) return;
    const formatted = formatWhatsAppNumber(message.from);
    if (!formatted) {
      await message.reply("Não foi possível identificar seu número.");
      return;
    }

    console.log({ formatted });
    const verification = await verifyNumber(formatted);
    console.log({ verification });
    if (!verification || verification.success === false) {
      return;
    }

    if (verification.data !== true) {
      await message.reply("Você não faz parte do sistema.");
      return;
    }

    const chatResp = await sendToChatbot(message.body || "", formatted);

    const output = chatResp?.output ?? chatResp?.data?.output ?? null;

    if (typeof output === "string" && output.trim().length > 0) {
      await message.reply(output);
    } else {
      await message.reply("Não foi possível obter a resposta do chatbot.");
    }
  } catch (err) {
    console.error("Error handling message:", err?.message || err);
    try {
      await message.reply("Ocorreu um erro ao processar sua mensagem.");
    } catch (_) {}
  }
});

// Tratamento de erros globais
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

console.log("Initializing WhatsApp client...");
client.initialize();