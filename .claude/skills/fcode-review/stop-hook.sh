#!/usr/bin/env bash
# fcode-review 훅 — Stop 자동 발화 + PostToolUse 플래그 + 리뷰 완료 마킹.
#
# Stop 모드는 게이트 4종을 전부 통과하면 턴을 막고, Claude 가 fcode-review
# 스킬을 관점 질문 없이 바로 실행하게 만든다.
#
#   0) 이 세션이 Write/Edit 로 파일을 직접 수정했다 (--edited 가 세우는 플래그)
#   1) 이 세션의 마지막 발화로부터 15분 경과 (세션별 쿨다운)
#   2) 변경된 코드 파일 한정 해시가 마지막 마킹과 다르다
#      (코드와 무관한 파일이 생겨도 재발화하지 않는다)
#   3) 변경된 코드 파일 ≥2개 또는 ≥5줄 (미달이면 마킹하지 않는다 — 누적되면 발화)
#
# 상태는 TMPDIR 에 산다 — 레포 루트 경로 해시가 키. 재부팅하면 초기화된다.
#
# 사용:
#   (인자 없음)  Stop 훅 모드. stdin 으로 훅 JSON 을 받는다.
#   --edited     PostToolUse(Write|Edit|NotebookEdit) 훅 모드. 세션 플래그만 세운다.
#   --mark       현재 변경분을 "리뷰 완료"로 마킹. fcode-review 스킬이 끝날 때 호출.

set -uo pipefail

EXTS='cs|ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|kts|swift|rb|php|c|cc|cpp|h|hpp|m|mm|scala|lua|sh|bash|zsh|sql'
COOLDOWN_SEC=900
MIN_FILES=2
MIN_LINES=5

root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -n "$root" ] || exit 0

state_dir="${TMPDIR:-/tmp}/fcode-review-state/$(printf '%s' "$root" | shasum | cut -c1-16)"
mark_file="$state_dir/mark"

# stdin 훅 JSON 에서 session_id 를 뽑는다. UUID 라 이스케이프가 없어 sed 로 충분하다.
read_session_id() {
  sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1
}

# --edited: 편집마다 도는 핫패스. git status 를 뜨기 전에 여기서 끝낸다.
if [ "${1:-}" = "--edited" ]; then
  session_id="$(read_session_id)"
  [ -n "$session_id" ] || exit 0
  mkdir -p "$state_dir/sessions"
  touch "$state_dir/sessions/$session_id.edited"
  exit 0
fi

# 커밋이 하나도 없는 레포면 git 의 빈 트리 오브젝트를 diff 기준으로 쓴다.
if git -C "$root" rev-parse -q --verify HEAD >/dev/null 2>&1; then
  base=HEAD
else
  base=4b825dc642cb6eb9a060e54bf8d69288fbee4904
fi

# status 는 비싸다 — 한 번만 뜬다. core.quotePath=false 로 비ASCII 인용을 끄고,
# 공백 등으로 남는 겉 인용부호는 벗긴다(내부 이스케이프까지 가진 병적 파일명은 포기).
status_lines="$(git -C "$root" -c core.quotePath=false status --porcelain --untracked-files=all 2>/dev/null)"

# 변경된 코드 파일 목록. $1: all | tracked | untracked
code_files() {
  case "$1" in
    tracked)   filter='!/^\?\?/' ;;
    untracked) filter='/^\?\?/' ;;
    *)         filter='//' ;;
  esac
  printf '%s\n' "$status_lines" \
    | awk "$filter" \
    | sed 's/^...//; s/.* -> //; s/^"\(.*\)"$/\1/' \
    | grep -E "\.($EXTS)$" \
    | sort -u
}

tracked_list="$(code_files tracked)"
untracked_list="$(code_files untracked)"

# 변경분 해시 — 코드 파일만 본다. 추적분은 diff 한 번, untracked 는 내용.
current_hash() {
  {
    if [ -n "$tracked_list" ]; then
      printf '%s\n' "$tracked_list" | tr '\n' '\0' \
        | xargs -0 git -C "$root" diff "$base" -- 2>/dev/null
    fi
    if [ -n "$untracked_list" ]; then
      while IFS= read -r f; do
        printf '=== %s ===\n' "$f"
        cat "$root/$f" 2>/dev/null
      done <<< "$untracked_list"
    fi
  } | shasum | cut -d' ' -f1
}

if [ "${1:-}" = "--mark" ]; then
  mkdir -p "$state_dir"
  current_hash > "$mark_file"
  echo "fcode-review: 현재 변경분을 리뷰 완료로 마킹했습니다."
  exit 0
fi

session_id="$(read_session_id)"
[ -n "$session_id" ] || exit 0

edited_flag="$state_dir/sessions/$session_id.edited"
cooldown_file="$state_dir/sessions/$session_id.last"

# 게이트 0 — 이 세션이 직접 수정했는가. 외부에서 생긴 변경에는 발화하지 않는다.
[ -f "$edited_flag" ] || exit 0

# 게이트 1 — 세션별 쿨다운.
now="$(date +%s)"
last=0
[ -f "$cooldown_file" ] && last="$(cat "$cooldown_file" 2>/dev/null || echo 0)"
case "$last" in (''|*[!0-9]*) last=0 ;; esac
[ $((now - last)) -ge "$COOLDOWN_SEC" ] || exit 0

files="$(code_files all)"
[ -n "$files" ] || exit 0

# 게이트 2 — 마지막 마킹과 같은 변경분이면 이미 리뷰된 것이다.
# 임계보다 먼저 보는 이유: 정상 상태(마킹 완료)의 턴 종료 비용을 반으로 줄인다.
h="$(current_hash)"
if [ -f "$mark_file" ] && [ "$(cat "$mark_file" 2>/dev/null)" = "$h" ]; then
  exit 0
fi

# 게이트 3 — 임계값. 미달이면 마킹 없이 조용히 — 변경이 누적되면 발화한다.
count="$(printf '%s\n' "$files" | wc -l | tr -d ' ')"

lines=0
if [ -n "$tracked_list" ]; then
  n="$(printf '%s\n' "$tracked_list" | tr '\n' '\0' \
    | xargs -0 git -C "$root" diff --numstat "$base" -- 2>/dev/null \
    | awk '{s+=$1+$2} END {print s+0}')"
  lines=$((lines + ${n:-0}))
fi
if [ -n "$untracked_list" ]; then
  n="$(while IFS= read -r f; do cat "$root/$f" 2>/dev/null; done <<< "$untracked_list" \
    | wc -l | tr -d ' ')"
  lines=$((lines + ${n:-0}))
fi

if [ "$count" -lt "$MIN_FILES" ] && [ "$lines" -lt "$MIN_LINES" ]; then
  exit 0
fi

# 발화 — 지금 마킹하고 쿨다운을 갱신해야 리뷰 턴 끝에 다시 안 막힌다.
mkdir -p "$state_dir/sessions"
printf '%s' "$h" > "$mark_file"
printf '%s' "$now" > "$cooldown_file"

has_cs=""
printf '%s\n' "$files" | grep -q '\.cs$' && has_cs="1"

file_list="$(printf '%s\n' "$files" | head -10 | tr '\n' ' ')"
[ "$count" -gt 10 ] && file_list="$file_list… (총 ${count}개)"

reason="이 세션에서 코드 파일 ${count}개 / ${lines}줄의 변경이 누적됐는데 아직 리뷰하지 않았습니다: ${file_list}

지금 fcode-review 스킬을 실행해 리뷰하세요. 사용자에게 관점을 묻지 말고 기본 관점 전부(정확성·성능·단순화$( [ -n "$has_cs" ] && printf ', .cs 가 있으므로 유니티 포함' ))로 병렬 진행하세요.
고쳐도 안전한 지적(safe_to_fix)만 자동 수정하고 나머지는 보고만 하세요. 사용자가 명시적으로 리뷰하지 말라고 한 경우에만 건너뛰세요."

python3 - "$reason" <<'PY'
import json, sys
print(json.dumps({"decision": "block", "reason": sys.argv[1]}, ensure_ascii=False))
PY
