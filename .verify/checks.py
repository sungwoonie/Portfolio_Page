#!/usr/bin/env python3
"""정적 검사 C1~C9. 하나라도 걸리면 exit 1."""
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
CSS = os.path.join(ROOT, "style.css")
JS = os.path.join(ROOT, "script.js")

failures = []
notes = []


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def fail(code, msg):
    failures.append(f"{code}  {msg}")


def ok(code, msg):
    notes.append(f"{code}  {msg}")


# ---------- HTML 파싱 ----------
class Collector(HTMLParser):
    """로컬 에셋 경로, 섹션 앵커, 히어로 안의 아이콘 이미지를 모은다."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.assets = []          # (tag, src)
        self.anchors = set()      # id 속성
        self.hero_icons = []      # 히어로 안의 Resources 이미지
        self._hero_depth = 0      # 0 이면 히어로 밖
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self._depth += 1

        if a.get("id"):
            self.anchors.add(a["id"])

        classes = (a.get("class") or "").split()
        if self._hero_depth == 0 and "hero" in classes:
            self._hero_depth = self._depth

        if tag in ("img", "video", "source"):
            src = a.get("src") or a.get("poster") or ""
            # 미디어 프래그먼트(#t=5)와 쿼리는 경로가 아니다
            src = src.split("#", 1)[0].split("?", 1)[0]
            if src and not src.startswith(("http://", "https://", "data:")):
                self.assets.append((tag, src))
                if (
                    tag == "img"
                    and self._hero_depth
                    and self._depth >= self._hero_depth
                    and src.startswith("Resources/")
                ):
                    self.hero_icons.append(src)

        # void 요소는 endtag 가 안 오므로 즉시 되돌린다
        if tag in ("img", "br", "hr", "input", "meta", "link", "source"):
            self._depth -= 1

    def handle_endtag(self, tag):
        if self._hero_depth and self._depth == self._hero_depth:
            self._hero_depth = 0
        self._depth -= 1


html = read(HTML)
css = read(CSS)
js = read(JS)

col = Collector()
col.feed(html)

# ---------- C1 로컬 에셋 경로 유실 ----------
missing = [s for _, s in col.assets if s and not os.path.exists(os.path.join(ROOT, s))]
if missing:
    fail("C1", f"경로 유실 {len(missing)}건: " + ", ".join(sorted(set(missing))[:8]))
else:
    ok("C1", f"로컬 에셋 {len(col.assets)}건 전부 존재")

# ---------- C2 섹션 앵커 ----------
required = {"about", "career", "ai", "automation", "projects", "source", "contact"}
lost = sorted(required - col.anchors)
if lost:
    fail("C2", f"앵커 누락: {', '.join('#' + a for a in lost)}")
else:
    ok("C2", f"앵커 {len(required)}개 전부 존재")

# ---------- C3 :root 밖 하드코딩 hex ----------
root_spans = [m.span() for m in re.finditer(r":root\s*\{[^}]*\}", css)]


def in_root(pos):
    return any(a <= pos < b for a, b in root_spans)


stray_hex = [
    m.group(0)
    for m in re.finditer(r"#[0-9a-fA-F]{3,8}\b", css)
    if not in_root(m.start())
]
if stray_hex:
    fail("C3", f":root 밖 하드코딩 hex {len(stray_hex)}건: {', '.join(sorted(set(stray_hex))[:8])}")
else:
    ok("C3", ":root 밖 하드코딩 hex 0건")

# ---------- C4 border-radius ----------
bad_radius = []
for m in re.finditer(r"border-radius\s*:\s*([^;}]+)", css):
    value = m.group(1).strip()
    # 0 은 "모서리 없음"이지 임의 값이 아니다
    if re.fullmatch(r"(var\(--radius-[a-z-]+\)|50%|inherit|0)", value):
        continue
    bad_radius.append(value)
if bad_radius:
    fail("C4", f"토큰 밖 radius {len(bad_radius)}건: {', '.join(sorted(set(bad_radius))[:8])}")
else:
    ok("C4", "border-radius 전부 토큰 또는 50%")

# ---------- C5 em-dash / en-dash ----------
dash_hits = []
for name, text in (("index.html", html), ("style.css", css), ("script.js", js)):
    for lineno, line in enumerate(text.splitlines(), 1):
        if "—" in line or "–" in line:
            dash_hits.append(f"{name}:{lineno}")
if dash_hits:
    fail("C5", f"em/en-dash {len(dash_hits)}건: {', '.join(dash_hits[:8])}")
else:
    ok("C5", "em/en-dash 0건")

# ---------- C6 액센트 ----------
accent = re.search(r"--color-accent\s*:\s*(#[0-9a-fA-F]{3,8})", css)
if not accent:
    fail("C6", "--color-accent 토큰을 못 찾음")
elif accent.group(1).lower() != "#f59e0b":
    fail("C6", f"--color-accent 가 {accent.group(1)} (기대: #f59e0b)")
else:
    ok("C6", "--color-accent = #f59e0b")

emerald = [n for n, t in (("index.html", html), ("style.css", css), ("script.js", js)) if "34d399" in t.lower()]
if emerald:
    fail("C6", f"에메랄드 #34d399 잔존: {', '.join(emerald)}")
else:
    ok("C6", "#34d399 잔존 0건")

# ---------- C7 JetBrains Mono ----------
if not re.search(r"<link[^>]+jetbrains[^>]*mono", html, re.I):
    fail("C7", "JetBrains Mono CDN link 없음")
else:
    mono = re.search(r"--font-mono\s*:\s*([^;]+);", css)
    if not mono:
        fail("C7", "--font-mono 토큰 없음")
    elif "jetbrains" not in mono.group(1).lower():
        fail("C7", f"--font-mono 가 JetBrains Mono 를 안 씀: {mono.group(1).strip()[:60]}")
    else:
        ok("C7", "JetBrains Mono 로드 + --font-mono 참조")

# ---------- C8 히어로 앱 아이콘 9개 ----------
if len(col.hero_icons) != 9:
    fail("C8", f"히어로 앱 아이콘 {len(col.hero_icons)}개 (기대: 9)")
else:
    ok("C8", "히어로 앱 아이콘 9개")

# ---------- C9 본문 텍스트 보존 ----------
baseline = os.path.join(ROOT, ".verify", "baseline-text.txt")
if not os.path.exists(baseline):
    fail("C9", "baseline-text.txt 없음 (리디자인 전에 캡처했어야 함)")
else:
    import subprocess

    current = subprocess.run(
        [sys.executable, os.path.join(ROOT, ".verify", "extract_text.py"), HTML],
        capture_output=True, text=True, check=True,
    ).stdout.splitlines()
    base = read(baseline).splitlines()
    from collections import Counter

    # 새 섹션은 문구를 더한다. 삭제만 막고 추가는 허용한다
    added = Counter(current) - Counter(base)
    removed = Counter(base) - Counter(current)
    if removed:
        detail = [f"  - {t[:70]}" + (f" (x{c})" if c > 1 else "") for t, c in list(removed.items())[:8]]
        fail("C9", f"기존 본문 {len(removed)}줄이 사라짐\n" + "\n".join(detail))
    else:
        ok("C9", f"기존 본문 {len(base)}줄 보존 (추가 {sum(added.values())}줄)")

# ---------- C11 AI 카드 4장 + 썸네일 실존 ----------
ai_cards = re.findall(r'<div class="project-card ai-card"[^>]*>(.*?)(?=<div class="project-card ai-card"|</div>\s*</section>)',
                      html, re.S)
ai_imgs = re.findall(r'class="project-thumb[^"]*"><img[^>]+src="(Resources/AI/[^"]+)"', html)
if len(ai_imgs) != 4:
    fail("C11", f"AI 카드 썸네일 {len(ai_imgs)}개 (기대: 4)")
else:
    lost = [s for s in ai_imgs if not os.path.exists(os.path.join(ROOT, s))]
    if lost:
        fail("C11", f"AI 썸네일 경로 유실: {', '.join(lost)}")
    else:
        ok("C11", "AI 카드 4장, 썸네일 전부 존재")

# ---------- C12 자동화 섹션 인라인 SVG ----------
auto = re.search(r'<section id="automation".*?</section>', html, re.S)
if not auto:
    fail("C12", "자동화 섹션을 못 찾음")
elif "<svg" not in auto.group(0):
    fail("C12", "자동화 섹션에 인라인 svg 없음")
else:
    ok("C12", "자동화 섹션에 인라인 SVG 도식 존재")

# ---------- C13 네비 링크 7개 ----------
nav = re.search(r"<nav>.*?</nav>", html, re.S)
nav_links = re.findall(r'<a href="#([a-z]+)"', nav.group(0)) if nav else []
if len(nav_links) != 7:
    fail("C13", f"네비 링크 {len(nav_links)}개 (기대: 7) -> {nav_links}")
else:
    ok("C13", f"네비 링크 7개: {' '.join(nav_links)}")

# ---------- 출력 ----------
for line in notes:
    print(f"  \033[32mPASS\033[0m  {line}")
for line in failures:
    print(f"  \033[31mFAIL\033[0m  {line}")

sys.exit(1 if failures else 0)
