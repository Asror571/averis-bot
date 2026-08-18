import { NextRequest, NextResponse } from "next/server";
import { sendMessage, sendPhoto, answerCallbackQuery, getChatMember } from "../../../../lib/telegram/bot";
import { gradeInlineKeyboard, contactKeyboard, mainMenuKeyboard, subscriptionInlineKeyboard } from "../../../../lib/telegram/keyboards";
import { validateName, normalizePhone } from "../../../../lib/validation/application";

const TELEGRAM_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID!;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://averis-bot-mql6.vercel.app").replace(/\/$/, "");

// Kanal sozlamalari
const CHANNEL_ID = process.env.CHANNEL_ID || "@Averis_Academy_N1"; 
const CHANNEL_LINK = process.env.CHANNEL_LINK || "https://t.me/Averis_Academy_N1"; 

// ─── In-memory state ─────────────
interface UserState {
  state: "MAIN_MENU" | "WAITING_FOR_GRADE" | "WAITING_FOR_NAME" | "WAITING_FOR_PHONE" | "COMPLETED";
  grade?: string;
  studentName?: string;
}

const stateStore = new Map<number, UserState>();

function getState(userId: number): UserState {
  return stateStore.get(userId) || { state: "MAIN_MENU" };
}

function setState(userId: number, state: UserState) {
  stateStore.set(userId, state);
}

function getUsername(from: any): string {
  if (from.username) return `@${from.username}`;
  return [from.first_name, from.last_name].filter(Boolean).join(" ") || "Noma'lum";
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function checkSubscription(userId: number): Promise<boolean> {
  if (!CHANNEL_ID) return true; // Kanal ID kiritilmagan bo'lsa, tekshiruvni o'tkazib yuboramiz
  const member = await getChatMember(CHANNEL_ID, userId);
  if (!member) return false;
  return ["creator", "administrator", "member"].includes(member.status);
}

async function sendAbout(chatId: number) {
  const text = 
    `🏫 <b>Averis Academy — Farzandingiz nimaga qodirligini bilasizmi?</b>\n\n` +
    `Averis Academy — 1–11-sinf o'quvchilari uchun mo'ljallangan zamonaviy xususiy maktab. Biz Daho Uyg'otish Tizimi™, qobiliyat xaritasi va loyiha asosida ta'lim orqali har bir bolaning yashirin qobiliyatini kashf etamiz.\n\n` +
    `<b>Nega aynan Averis?</b>\n` +
    `🔹 <b>Amaliy loyihalar:</b> Har chorakda bitta katta loyiha (Mening ideal uyim, Aqlli bog', Kelajak shahri).\n` +
    `🔹 <b>To'liq sharoit:</b> 3 mahal muvozanatli ovqatlanish, transport, sport maydonchalari va 24/7 xavfsizlik.\n` +
    `🔹 <b>Chuqurlashtirilgan ta'lim:</b> Fan, til va IT sohalari.\n\n` +
    `Biz bolaga faqat javob berishni emas, javobni izlashni o'rgatamiz!\n\n` +
    `🌐 <b>Batafsil ma'lumot saytimizda:</b>\nhttps://averis-school.lovable.app/`;
  await sendMessage(chatId, text, { reply_markup: mainMenuKeyboard() });
}

async function sendContact(chatId: number) {
  const text = 
    `📞 <b>Bog'lanish uchun ma'lumotlar:</b>\n\n` +
    `Telefon: +998 99 546 67 07\n` +
    `Telegram: @SanjarSultonov07\n` +
    `Ish vaqti: Dushanba – Shanba, 08:00 – 18:00\n` +
    `Manzil: Toshkent shahri\n\n` +
    `Savollaringiz bo'lsa bemalol murojaat qilishingiz mumkin!`;
  await sendMessage(chatId, text, { reply_markup: mainMenuKeyboard() });
}

async function startApplication(chatId: number, userId: number) {
  setState(userId, { state: "WAITING_FOR_GRADE" });
  const text = `📋 <b>Farzandingiz qaysi sinfga qabul qilinadi?</b>\nQuyidagi tugmalardan birini tanlang:`;
  await sendMessage(chatId, text, { reply_markup: gradeInlineKeyboard() });
}

// ─── Main update handler ───────────────────────────────────────────────────────
async function handleUpdate(body: any) {

  // ── Matnli xabarlar ───────────────────────────────────────────────────────
  if (body.message) {
    const { message } = body;
    const { chat, from } = message;
    const text = message.text || "";
    const state = getState(from.id);

    // /start komandasi - kanal tekshiruvisiz menyu beramiz
    if (text === "/start") {
      setState(from.id, { state: "MAIN_MENU" });
      const caption = 
        `🏫 <b>Averis Academy</b>ga xush kelibsiz!\n\n` +
        `O'zingizga kerakli bo'limni tanlang:`;

      try {
        await sendPhoto(chat.id, `${APP_URL}/start.jpg`, caption, {
          reply_markup: mainMenuKeyboard(),
        });
      } catch {
        await sendMessage(chat.id, caption, { reply_markup: mainMenuKeyboard() });
      }
      return;
    }

    // Asosiy menyu tugmalari (Kanal a'zoligini tekshirish)
    if (text === "🏫 Averis Academy haqida" || text === "📞 Bog'lanish" || text === "📝 Ariza qoldirish") {
      const isSubbed = await checkSubscription(from.id);
      
      if (!isSubbed) {
        let action = "about";
        if (text === "📞 Bog'lanish") action = "contact";
        else if (text === "📝 Ariza qoldirish") action = "apply";
        
        await sendMessage(chat.id, `Kechirasiz, botdan to'liq foydalanish uchun avval rasmiy kanalimizga a'zo bo'lishingiz kerak. 👇`, {
          reply_markup: subscriptionInlineKeyboard(CHANNEL_LINK, action)
        });
        return;
      }

      // A'zo bo'lsa yoki tekshiruv o'chirilgan bo'lsa
      if (text === "🏫 Averis Academy haqida") {
        await sendAbout(chat.id);
      } else if (text === "📞 Bog'lanish") {
        await sendContact(chat.id);
      } else if (text === "📝 Ariza qoldirish") {
        await startApplication(chat.id, from.id);
      }
      return;
    }

    // Ism kutilmoqda
    if (state.state === "WAITING_FOR_NAME" && message.text) {
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
    if (state.state === "WAITING_FOR_PHONE") {
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
        `Asosiy menyuga qaytdingiz. 👇`,
        { reply_markup: mainMenuKeyboard() } // Ariza tugagach yana menyuni ko'rsatamiz
      );

      setState(from.id, { ...state, state: "MAIN_MENU" });
      return;
    }

    // Boshqa tushunarsiz xabarlar
    if (state.state === "MAIN_MENU") {
      await sendMessage(chat.id, `Iltimos, pastdagi menyudan kerakli bo'limni tanlang. 👇`, {
        reply_markup: mainMenuKeyboard()
      });
    }
    return;
  }

  // ── Callback query (Sinf tanlash & Kanal a'zoligini tasdiqlash) ─────────────
  if (body.callback_query) {
    const { callback_query: cb } = body;
    const chatId = cb.message?.chat.id;
    const data = cb.data || "";

    // Kanal a'zoligini tekshirish tugmasi bosilganda
    if (data.startsWith("check_sub:")) {
      const action = data.split(":")[1];
      const isSubbed = await checkSubscription(cb.from.id);
      
      if (!isSubbed) {
        // Agar a'zo bo'lmagan bo'lsa tepadan alert chiqaramiz
        await answerCallbackQuery(cb.id, "Kanalga a'zo bo'lmagansiz! Iltimos, a'zo bo'lib keyin tekshiring.", true);
        return;
      }
      
      // A'zo bo'lsa davom etadi
      await answerCallbackQuery(cb.id, "A'zoligingiz tasdiqlandi!");
      
      // Davom etish (qaysi tugmani bosganiga qarab)
      if (chatId) {
        if (action === "about") await sendAbout(chatId);
        else if (action === "contact") await sendContact(chatId);
        else if (action === "apply") await startApplication(chatId, cb.from.id);
      }
      return;
    }

    // Sinf tanlash tugmasi bosilganda
    if (data.startsWith("grade:")) {
      await answerCallbackQuery(cb.id);
      const grade = data.replace("grade:", "");
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
