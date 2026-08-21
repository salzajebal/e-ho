---
name: GitHub 동기화 경로
description: Replit GitHub 통합과 터미널 Git 인증이 다를 때의 안전한 동기화 원칙
---

터미널의 HTTPS `git push` 인증이 실패하더라도, 연결된 GitHub 통합이 저장소 쓰기 권한을 가진 경우 GitHub API를 통해 커밋을 만들고 브랜치 ref를 비강제로 갱신할 수 있다.

**Why:** Replit의 GitHub 통합 연결 상태와 Shell의 HTTPS Git 자격증명은 별도로 동작할 수 있다. 강제 push나 충돌 커밋 전체 재생은 원격 변경 및 불필요한 로컬 파일을 덮어쓸 위험이 있다.

**How to apply:** 먼저 원격 `main`의 예상 SHA를 확인하고, 필요한 변경만 깨끗한 기준에서 준비한다. GitHub Git Data API로 tree와 commit을 생성한 뒤, 원격 SHA가 변하지 않았을 때만 `force: false`로 `main` ref를 갱신한다. 완료 후 로컬 브랜치를 원격 커밋과 동일하게 맞춘다.