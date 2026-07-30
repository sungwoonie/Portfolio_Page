# Issue tracker: Local Markdown

이 저장소의 이슈·스펙은 GitHub Issues가 아니라 **`.scratch/` 아래 마크다운 파일**로 산다. (`gh` CLI 미설치 — 트래커를 GitHub로 옮기려면 `brew install gh` + 인증 후 이 문서를 교체할 것.)

## Conventions

- 노력 단위 하나당 디렉터리 하나: `.scratch/<effort-slug>/`
- 스펙은 `.scratch/<effort-slug>/spec.md`
- 이슈는 티켓당 파일 하나, `01`부터 번호: `.scratch/<effort-slug>/issues/NN-<slug>.md` — **절대 한 파일에 합치지 않는다**
- 상태는 각 파일 상단의 `Status:` 줄
- 코멘트·대화 이력은 파일 맨 아래 `## Comments` 아래에 append

## When a skill says "publish to the issue tracker"

`.scratch/<effort-slug>/` 아래에 새 파일을 만든다(디렉터리 없으면 생성).

## When a skill says "fetch the relevant ticket"

참조된 경로의 파일을 읽는다. 보통 사용자가 경로나 이슈 번호를 직접 준다.

## Wayfinding operations

`/wayfinder`와 `/fask`가 쓴다. **맵**은 파일 하나, 그 아래 티켓당 **자식** 파일 하나.

- **Map**: `.scratch/<effort>/map.md` — Destination / Notes / Decisions so far / Not yet specified / Out of scope 본문. 업스트림의 `wayfinder:map` 라벨을 대신하는 게 이 **파일명**(`map.md`)이다.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, `01`부터 **2자리 0패딩** 번호. 슬러그는 **공백 없는 kebab-case 영문**(제목은 파일 첫 `# ` 헤딩에 한국어로 쓴다 — 마크다운 링크가 공백에서 깨진다). 본문은 `## Question`. 상단 헤더 3줄:
  - `Type:` — 티켓 타입. `research` / `prototype` / `grilling` / `task` 중 하나 (업스트림 `wayfinder:<type>` 라벨 대체)
  - `Status:` — `open` / `claimed` / `resolved` / `out-of-scope`. 뒤의 둘이 **closed**(= 프론티어에서 빠짐), 앞의 둘이 open.
  - `Blocked by:` — `01, 04` 형식의 티켓 번호 목록. 없으면 `Blocked by: -`
- **Blocking**: 로컬 트래커에는 네이티브 의존관계가 없으므로 위 `Blocked by:` 줄이 그 대체다. 어떤 티켓이 **unblocked**인 조건 = 거기 적힌 모든 티켓이 **closed**(`resolved` **또는** `out-of-scope`). — `resolved`만 인정하면 범위 밖으로 닫힌 티켓 뒤의 의존 티켓이 영원히 프론티어에 안 올라온다.
- **Frontier**: `.scratch/<effort>/issues/` 를 훑어 `Status: open` + unblocked + unclaimed 인 파일들. 번호 작은 순서가 우선.
- **Claim**: 어떤 작업보다 **먼저** `Status: claimed`로 바꾸고 저장한다.
- **Resolve**: 파일 끝에 `## Answer` 헤딩으로 답을 append → `Status: resolved` → `map.md`의 **Decisions so far**에 한 줄(gist + 상대경로 링크) append.
- **Out of scope 처리**: 티켓을 `Status: resolved`가 아니라 `Status: out-of-scope`로 닫고, `map.md`의 **Out of scope** 섹션에 한 줄(gist + 왜 범위 밖인지 + 링크)을 남긴다. **Decisions so far에는 넣지 않는다.**
- **"Refer by name"**: 맵·내러이션에서 티켓을 `#03` 같은 번호로 부르지 말고 **제목**으로 부른다. 번호와 경로는 링크 안에 태운다 — `[로그인 세션 만료 정책](issues/03-session-expiry.md)`.

### 티켓 파일 템플릿

```markdown
# <티켓 제목>

Type: grilling
Status: open
Blocked by: -

## Question

<이 티켓이 푸는 결정 또는 조사>
```

### 커밋 정책

`.scratch/`는 **git에 커밋한다**(이 저장소에 `.gitignore` 없음 — 확인됨). 맵은 공유 아티팩트이므로 세션 간·브랜치 간에 남아야 한다.

## 정식 문서와의 관계

`.scratch/<effort>/`는 **아직 정하는 중인 과정**이고, 저장소 루트의 문서(`README.md`, `*_PLAN.md`, 그 밖의 SSoT 문서)는 **합의가 끝난 결과물**이다. 맵이 다 풀리면 그 산출물을 루트 문서로 승격시키는 것이 자연스러운 종착점 — `.scratch/`가 정식 문서를 대체하지 않는다.

이 저장소는 아직 문서 구조가 굳지 않았다. 맵의 `## Notes`에 참조 문서를 적을 때 **고정 목록을 가정하지 말고** 저장소를 훑어 실제로 존재하는 것을 확인해 적을 것.
