const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function post(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");

  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[TG ${method} ERROR]`, res.status, text);
    throw new Error(`Telegram API error: ${res.status} ${text}`);
  }

  return res.json();
}

export async function sendMessage(
  chatId: string | number,
  text: string,
  options: Record<string, unknown> = {}
) {
  return post("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...options,
  });
}

export async function sendPhoto(
  chatId: string | number,
  photo: string,
  caption?: string,
  options: Record<string, unknown> = {}
) {
  return post("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
    ...options,
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  return post("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}
