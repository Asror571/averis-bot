import { NextRequest, NextResponse } from "next/server";
import { sendMessage, sendPhoto, answerCallbackQuery } from "../../../../lib/telegram/bot";
import { gradeInlineKeyboard, contactKeyboard, removeKeyboard } from "../../../../lib/telegram/keyboards";
import { validateName, normalizePhone } from "../../../../lib/validation/application";

const TELEGRAM_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID!;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

// ─── In-memory state (Vercel serverless: har restartda tozalanadi) ─────────────
interface UserState {
  state: "WAITING_FOR_GRADE" | "WAITING_FOR_NAME" | "WAITING_FOR_PHONE" | "COMPLETED";
  grade?: string;
  studentName?: string;
}

const stateStore = new Map<number, UserState>();

function getState(userId: number) {
  return stateStore.get(userId);
}

function setState(userId: number, state: UserState) {
  stateStore.set(userId, state);
}

function getUsername(from: any): string {
  if (from.username) return `@${from.username}`;
  return [from.first_name, from.last_name].filter(Boolean).join(" ") || "Noma'lum";
}

// ─── Main update handler ───────────────────────────────────────────────────────
async function handleUpdate(body: any) {

  // ── /start ────────────────────────────────────────────────────────────────
  if (body.message?.text === "/start") {
    const { chat, from } = body.message;

    setState(from.id, { state: "WAITING_FOR_GRADE" });

    const caption =
      `🏫 <b>Averis Academy</b>ga xush kelibsiz!\n\n` +
      `Zamonaviy xususiy maktab — yuqori sifatli ta'lim va individual yondashuv bilan farzandingizni kelajakka tayyorlaymiz.\n\n` +
      `📋 <b>Farzandingiz qaysi sinfga qabul qilinadi?</b>`;

    try {
      await sendPhoto(chat.id, `${APP_URL}/start.jpg`, caption, {
        reply_markup: gradeInlineKeyboard(),
      });
    } catch {
      await sendMessage(chat.id, caption, { reply_markup: gradeInlineKeyboard() });
    }
    return;
  }

  // ── Matnli xabarlar ───────────────────────────────────────────────────────
  if (body.message) {
    const { message } = body;
    const { chat, from } = message;
    const state = getState(from.id);

    // Ism kutilmoqda
    if (state?.state === "WAITING_FOR_NAME" && message.text) {
      const name = message.text.trim();
      const err = validateName(name);
      if (err) {
        await sendMessage(chat.id,
          `❌ ${err}\n\nIltimos, to'liq ism va familiyani kiriting.\n<i>Masalan: Laylo Karimova</i>`
        );
        return;
      }
      setState(from.id, { ...state, state: "WAITING_FOR_PHONE", studentName: name });
      await sendMessage(
        chat.id,
        `✅ Ajoyib!\n\n📞 <b>Siz bilan bog'lanish uchun telefon raqamingizni qoldiring</b>\n\nQuyidagi tugmani bosing yoki raqamni qo'lda kiriting:\n<code>+998901234567</code>`,
        { reply_markup: contactKeyboard() }
      );
      return;
    }

    // Telefon kutilmoqda
    if (state?.state === "WAITING_FOR_PHONE") {
      // Contact tugmasi yoki qo'lda kiritilgan raqam
      const raw = message.contact?.phone_number ?? message.text ?? "";
      const phone = normalizePhone(raw);

      if (!phone) {
        await sendMessage(chat.id,
          `❌ Telefon raqam noto'g'ri.\n\nIltimos, quyidagi formatda kiriting:\n<code>+998901234567</code>`
        );
        return;
      }

      // Admin guruhiga xabar
      const now = new Date().toLocaleString("uz-UZ", {
        timeZone: "Asia/Tashkent",
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      const adminText =
        `🆕 <b>YANGI QABUL ARIZASI</b>\n` +
        `${"─".repeat(28)}\n\n` +
        `🎓 <b>Sinf:</b> ${state.grade}\n` +
        `👦 <b>O'quvchi:</b> ${state.studentName}\n` +
        `📞 <b>Telefon:</b> <code>${phone}</code>\n` +
        `👤 <b>Telegram:</b> ${getUsername(from)}\n\n` +
        `🕐 <b>Vaqt:</b> ${now}\n` +
        `${"─".repeat(28)}\n` +
        `✅ <i>Arizada ko'rsatilgan raqamga qo'ng'iroq qiling!</i>`;

      try {
        await sendMessage(ADMIN_CHAT_ID, adminText);
      } catch (e) {
        console.error("[ADMIN NOTIFY ERROR]", e);
      }

      // Foydalanuvchiga tasdiqlash
      await sendMessage(
        chat.id,
        `🎉 <b>Arizangiz qabul qilindi!</b>\n\n` +
        `Averis Academy qabul menejeri tez orada siz bilan bog'lanadi va maktab bilan tanishish uchun qulay vaqtni kelishadi.\n\n` +
        `📋 <b>Ariza ma'lumotlari:</b>\n` +
        `🎓 Sinf: <b>${state.grade}</b>\n` +
        `👦 O'quvchi: <b>${state.studentName}</b>\n` +
        `📞 Telefon: <code>${phone}</code>\n\n` +
        `❓ Savollar bo'lsa: /start bosing`,
        { reply_markup: removeKeyboard() }
      );

      setState(from.id, { ...state, state: "COMPLETED" });
      return;
    }

    // Boshqa xabarlar
    if (!state || state.state === "COMPLETED") {
      await sendMessage(chat.id,
        `👋 Salom! Qabul arizasini to'ldirish uchun /start bosing.`
      );
    }
    return;
  }

  // ── Callback query (sinf tanlash) ─────────────────────────────────────────
  if (body.callback_query) {
    const { callback_query: cb } = body;
    const chatId = cb.message?.chat.id;

    await answerCallbackQuery(cb.id);

    if (cb.data?.startsWith("grade:")) {
      const grade = cb.data.replace("grade:", "");
      setState(cb.from.id, { state: "WAITING_FOR_NAME", grade });

      if (chatId) {
        await sendMessage(
          chatId,
          `✅ Tanlangan sinf: <b>${grade}</b>\n\n` +
          `👦 <b>Farzandingizning ismi va familiyasini kiriting:</b>\n` +
          `<i>Masalan: Laylo Karimova</i>`
        );
      }
    }
  }
}

// ─── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (TELEGRAM_SECRET && secret !== TELEGRAM_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = await req.json();
    await handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WEBHOOK ERROR]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
