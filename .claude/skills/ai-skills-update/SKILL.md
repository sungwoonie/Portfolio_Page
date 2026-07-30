---
name: ai-skills-update
description: AI-SKILLS 레포(StarCloudgames-Official/AI-SKILLS)의 최신 스킬 전부를 현재 프로젝트에 다시 설치한다. 새로 추가된 스킬은 들어오고 수정된 스킬은 덮어써진다. 사용자가 /ai-skills-update 를 직접 칠 때만 실행한다.
disable-model-invocation: true
---

# /ai-skills-update — 스킬 최신화

AI-SKILLS 레포의 최신 내용을 현재 프로젝트에 다시 설치한다. 설치 스크립트가 레포의 스킬 전부를 덮어쓰는 방식이라, 설치와 업데이트는 같은 동작이다.

Bash 로 아래를 실행한다:

```bash
rm -rf /tmp/ai-skills && git clone --depth 1 https://github.com/StarCloudgames-Official/AI-SKILLS.git /tmp/ai-skills && bash /tmp/ai-skills/install.sh "$PWD" && rm -rf /tmp/ai-skills
```

실행 후:

- 설치 스크립트가 출력한 스킬·문서 목록을 사용자에게 그대로 보여준다.
- 업데이트된 스킬은 **새 Claude Code 세션부터** 적용된다고 알린다 (현재 세션에 이미 로드된 스킬은 구버전일 수 있다).
- clone 이 인증 오류로 실패하면 레포가 비공개라서다 — git 인증(예: `gh auth login` 또는 credential helper)이 된 환경에서 다시 실행하라고 안내한다.

주의:

- 이 스킬은 **설치 대상 프로젝트**에서 쓰는 것이다. AI-SKILLS 레포 자신 안에서 실행하면 설치 스크립트가 거부한다(정상).
- 레포에서 삭제된 스킬까지 지워주지는 않는다 — 프로젝트 자체 스킬과 구분할 수 없기 때문이다. 지울 게 있으면 사용자에게 알리고 직접 지우게 한다.
