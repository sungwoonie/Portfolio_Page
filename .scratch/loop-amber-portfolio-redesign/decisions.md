# loop/amber-portfolio-redesign

## 목표

포트폴리오 페이지를 앰버 액센트 다크 테마로 리디자인해, 문구와 IA를 그대로 둔 채
첫 화면부터 출시작이 보이고 본문이 실제로 읽히는 상태로 만든다.

## 완료 조건

전부 `bash verify.sh` 가 exit 0 으로 판정한다.

| # | 조건 |
|---|---|
| C1 | index.html 이 참조하는 로컬 이미지·영상 경로 유실 0건 |
| C2 | 섹션 앵커 `#about #career #projects #source #contact` 5개 전부 존재 |
| C3 | style.css 의 `:root` 블록 밖 하드코딩 hex 색상 0건 |
| C4 | border-radius 값이 `var(--radius-*)` 또는 `50%` 외에 0건 |
| C5 | index.html / style.css / script.js 에 em-dash·en-dash 0건 |
| C6 | `--color-accent` 가 `#f59e0b`, 문자열 `#34d399` 잔존 0건 |
| C7 | JetBrains Mono 가 CDN link 로 로드되고 `--font-mono` 가 그것을 참조 |
| C8 | 히어로 영역에 앱 아이콘 img 9개 존재 |
| C9 | 리디자인 전후 index.html 본문 텍스트 diff 0줄 (multiset 비교) |
| C10 | Playwright 320/768/1440px 스크린샷 3장, 각 폭에서 `scrollWidth <= innerWidth` |
| C11 | 전용 브랜치에 커밋 완료 |

## 잠근 결정 (루프가 다시 정하지 않는다)

- hallmark 은 규칙 참고만. 스킬 설치 안 함
- 다크 테마 유지(#0f1011 계열). 페이지 전체 단일 테마, 섹션별 반전 금지
- 액센트는 앰버 `#f59e0b` 단일. 그라데이션·글로우 전면 금지
- 본문 Pretendard 유지 + JetBrains Mono 를 숫자·기간·카테고리 라벨·스택 태그에
- 히어로: 좌 텍스트 + 우 앱 아이콘 9개 비대칭 그리드. 모바일 단일 컬럼 붕괴
- 가독성 4항목 전부: 본문 크기 상향, 회색 의존 축소, 본문 폭 65자, 섹션 리듬 강화
- 시각층 + 섹션 내부 레이아웃만. 섹션 순서·앵커·네비 라벨·모든 문구 보존
- 프로젝트 카드 9장 동일 크기, 대표작 강조 없음, 썸네일은 앱 아이콘 유지
- 셰이프 락: 카드 12px / 컨트롤 8px / 칩 6px
- 모션 절제: transform·opacity 만, prefers-reduced-motion 준수

## 범위 밖

OG/SEO 메타태그, 파비콘, 라이트모드 토글, SCG002 영상 404 정리,
앱 아이콘·게임 영상·모달 동작 변경, hallmark 스킬 설치

---

# 라운드 중 결정
