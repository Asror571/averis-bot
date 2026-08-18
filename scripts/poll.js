#!/usr/bin/env node
/**
 * Local polling runner for Averis Bot
 * Polls Telegram getUpdates and forwards to local Next.js server
 * Run: node scripts/poll.js
 */

const BOT_TOKEN = process.env.BOT_TOKEN || "8870756891:AAH1cCLMDNSS3oa1xSB5RJ2m6zzIDYR1nNY";
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "averis_secret_2024";
const LOCAL_URL = process.env.LOCAL_URL || "http://localhost:3002/api/telegram/webhook";

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;

async function getUpdates() {
  const res = await fetch(`${TG}/getUpdates?offset=${offset}&timeout=10&allowed_updates=["message","callback_query"]`);
  const data = await res.json();
  return data;
}

async function forwardToLocal(update) {
  try {
    const res = await fetch(LOCAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-bot-api-secret-token": SECRET,
      },
      body: JSON.stringify(update),
    });
    const body = await res.json().catch(() => ({}));
    const emoji = body.ok ? "✅" : "❌";
    console.log(`${emoji} Update ${update.update_id} → ${res.status}`, body.ok ? "" : JSON.stringify(body));
  } catch (err) {
    console.error("❌ Forward error:", err.message);
  }
}

async function poll() {
  console.log("🤖 Averis Bot — Polling mode started");
  console.log(`📡 Forwarding to: ${LOCAL_URL}`);
  console.log("─".repeat(50));

  while (true) {
    try {
      const result = await getUpdates();
      if (!result.ok) {
        console.error("❌ getUpdates error:", result.description);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      for (const update of result.result) {
        offset = update.update_id + 1;

        // Log incoming update
        if (update.message) {
          const from = update.message.from;
          const text = update.message.text || update.message.contact ? "[contact]" : "[media]";
          console.log(`📨 @${from.username || from.first_name} (${from.id}): ${text}`);
        } else if (update.callback_query) {
          const from = update.callback_query.from;
          console.log(`🔘 @${from.username || from.first_name} (${from.id}): [callback: ${update.callback_query.data}]`);
        }

        await forwardToLocal(update);
      }
    } catch (err) {
      console.error("❌ Poll error:", err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll();
