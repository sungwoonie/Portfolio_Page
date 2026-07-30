---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use ONLY when the user explicitly asks to be interviewed or to have their thinking stress-tested ("그릴해줘", "캐물어", "압박 질문", "grill me"), or when /fask or /wayfinder calls into it. Do NOT invoke for ordinary analysis, comparison, or balance-tuning requests.
---

Interview me relentlessly about every aspect of this until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a *fact* can be found by exploring the environment (filesystem, tools, etc.), look it up rather than asking me. The *decisions*, though, are mine — put each one to me and wait for my answer.

Do not act on it until I confirm we have reached a shared understanding.

---

<!-- 이 저장소 적용 메모 (업스트림 mattpocock/skills 원문 + 아래 항목만 추가) -->

## 이 저장소에서

- 질문·설명은 **한국어**로. 코드 식별자·파일 경로는 원문 유지.
- 질문 1개씩 던질 때 `AskUserQuestion` 툴을 쓰면 선택지 형태로 답하기 편하다. 다만 **한 번에 한 질문**이라는 원칙은 그대로 — 4개를 한 번에 묶지 말 것.
- **사실 조회 대상은 고정 목록이 없다.** 이 저장소는 아직 문서 구조가 굳지 않았으므로 특정 파일명이 있다고 가정하지 마라. 그릴을 시작하기 전에 저장소를 훑어 **실제로 존재하는** SSoT 문서를 먼저 파악하고, 그 안에서 확인 가능한 건 묻지 말고 읽을 것.
- 호출 경로: 사용자가 직접 `/grilling`·`/grill-me`를 치거나, `/fask`·`/wayfinder`가 체인 안에서 부른다.
