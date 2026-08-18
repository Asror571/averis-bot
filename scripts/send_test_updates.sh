#!/usr/bin/env bash
set -euo pipefail

URL=${1:-http://localhost:3000/api/telegram/webhook}

echo "Sending /start message"
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{"update_id":1001,"message":{"message_id":1,"from":{"id":1111,"is_bot":false,"first_name":"Test"},"chat":{"id":1111,"type":"private"},"text":"/start"}}' | jq || true

echo "Sending callback grade (7-sinf)"
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{"update_id":1002,"callback_query":{"id":"cb1","from":{"id":1111,"is_bot":false,"first_name":"Test"},"message":{"message_id":1,"chat":{"id":1111}},"data":"grade:7-sinf"}}' | jq || true

echo "Sending name message"
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{"update_id":1003,"message":{"message_id":2,"from":{"id":1111,"is_bot":false,"first_name":"Test"},"chat":{"id":1111,"type":"private"},"text":"Muhammad Aliyev"}}' | jq || true

echo "Sending phone message"
curl -s -X POST "$URL" -H "Content-Type: application/json" -d '{"update_id":1004,"message":{"message_id":3,"from":{"id":1111,"is_bot":false,"first_name":"Test"},"chat":{"id":1111,"type":"private"},"text":"+998901234567"}}' | jq || true

echo "Done"
