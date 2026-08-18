# 🏫 Averis Academy — Qabul Bot

Telegram orqali o'quvchilarni qabul qilish uchun bot. Next.js asosida qurilgan, Vercel-ga deploy qilish uchun optimallashtirilgan.

## Bot oqimi (Flow)

```
/start
  └─► Xush kelibsiz rasmli xabar
       └─► Sinf tanlash (1–11) [Inline keyboard]
            └─► Ism va familiya kiritish
                 └─► Telefon raqam (Contact button yoki qo'lda)
                      └─► ✅ Tasdiqlash xabari (foydalanuvchiga)
                          + 📢 Guruhga lid xabari (admin chat)
```

## Sozlash

### 1. `.env.local` yaratish

```bash
cp .env.example .env.local
```

Quyidagi qiymatlarni to'ldiring:

| O'zgaruvchi | Tavsif |
|---|---|
| `BOT_TOKEN` | BotFather'dan olingan token |
| `ADMIN_CHAT_ID` | Guruh ID (masalan: `-1003997682543`) |
| `NEXT_PUBLIC_APP_URL` | Deploy qilingan URL (masalan: `https://averis-bot.vercel.app`) |
| `TELEGRAM_WEBHOOK_SECRET` | Xavfsizlik uchun maxfiy kalit (istalgan so'z) |

### 2. Local ishga tushirish

```bash
npm install
npm run dev
```

Bot local'da webhook bilan ishlamaydi. Test uchun `ngrok` yoki Vercel preview deploy ishlating.

### 3. Vercel'ga deploy

```bash
# Vercel CLI o'rnatish
npm i -g vercel

# Deploy
vercel --prod
```

Vercel dashboard'da **Environment Variables** bo'limiga yuqoridagi o'zgaruvchilarni qo'shing.

### 4. Webhook o'rnatish

Deploy tugagandan so'ng:

```bash
chmod +x scripts/setup_webhook.sh
./scripts/setup_webhook.sh https://averis-bot.vercel.app
```

## Tekshirish

1. Telegram'da botni toping
2. `/start` yuboring
3. Sinf tanlang → Ism kiriting → Telefon yuboring
4. Admin guruhida yangi lid xabarini ko'ring ✅

## Fayl tuzilmasi

```
averis-bot/
├── app/
│   └── api/
│       └── telegram/
│           └── webhook/
│               └── route.ts      # Asosiy webhook handler
├── lib/
│   ├── telegram/
│   │   ├── bot.ts                # Telegram API funksiyalari
│   │   └── keyboards.ts          # Klaviatura konfiguratsiyalari
│   └── validation/
│       └── application.ts        # Kiritish tekshiruvi
├── models/
│   └── Application.ts            # Ariza modeli
├── public/
│   └── start.jpg                 # Xush kelibsiz rasmı
├── scripts/
│   └── setup_webhook.sh          # Webhook o'rnatish skripti
└── .env.local                    # Muhit o'zgaruvchilari
```
