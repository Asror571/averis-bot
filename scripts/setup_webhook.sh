#!/usr/bin/env bash
# ─── Averis Bot — Webhook Setup Script ───────────────────────────────────────
# Usage:
#   chmod +x scripts/setup_webhook.sh
#   ./scripts/setup_webhook.sh https://your-app.vercel.app
# ─────────────────────────────────────────────────────────────────────────────

BOT_TOKEN="${BOT_TOKEN:-8870756891:AAH1cCLMDNSS3oa1xSB5RJ2m6zzIDYR1nNY}"
SECRET="${TELEGRAM_WEBHOOK_SECRET:-averis_secret_2024}"

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <APP_URL>"
  echo "   Example: $0 https://averis-bot.vercel.app"
  exit 1
fi

APP_URL="${1%/}"  # remove trailing slash
WEBHOOK_URL="${APP_URL}/api/telegram/webhook"

echo "🔧 Setting Telegram webhook..."
echo "   URL: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s -X POST \
  "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"secret_token\": \"${SECRET}\",
    \"allowed_updates\": [\"message\", \"callback_query\"],
    \"drop_pending_updates\": true
  }")

echo "📡 Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Check if webhook was set successfully
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo ""
  echo "✅ Webhook muvaffaqiyatli o'rnatildi!"
  echo ""
  echo "─────────────────────────────────────────"
  echo "Bot test qilish: @$(echo $BOT_TOKEN | cut -d: -f1) bot topib /start yuboring"
else
  echo ""
  echo "❌ Webhook o'rnatishda xato yuz berdi!"
  exit 1
fi
