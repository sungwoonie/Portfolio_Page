#!/usr/bin/env bash
# 포트폴리오 리디자인 완료 조건 C1~C10 을 판정한다. 전부 통과하면 exit 0.
set -uo pipefail
cd "$(dirname "$0")"

status=0

echo "== 정적 검사 (C1~C9) =="
python3 .verify/checks.py || status=1

echo
echo "== 렌더 검사 (C10) =="
if [ ! -d .verify/node_modules/playwright ]; then
  echo "  Playwright 설치 중..."
  (cd .verify && npm install --silent) || { echo "  설치 실패"; exit 1; }
  (cd .verify && npx --no-install playwright install chromium) || { echo "  chromium 설치 실패"; exit 1; }
fi
node .verify/screenshots.mjs || status=1

echo
if [ $status -eq 0 ]; then
  echo "전부 통과"
else
  echo "실패한 조건이 있다"
fi
exit $status
