# Render + Supabase 배포 안내

이 프로젝트는 Render Web Service와 Supabase PostgreSQL을 사용할 수 있도록 구성되어 있습니다.

## Render 설정

GitHub 저장소를 Render에 연결한 뒤 아래 값을 사용합니다.

- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/health`
- **Node 버전:** 20.x 또는 22.x

저장소의 `render.yaml`을 사용하는 경우 위 설정이 자동으로 제안됩니다.

## Render Environment Variables

Render 서비스의 **Environment** 화면에 다음 키를 등록합니다.

| Key | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase의 Postgres connection string. `sslmode=require`가 포함된 URI를 사용합니다. |
| `SESSION_SECRET` | Yes | 긴 무작위 문자열입니다. 배포 후 변경하면 기존 로그인 세션이 만료됩니다. |
| `NODE_ENV` | Yes | `production` |
| `ADMIN_USERNAME` | Empty DB only | 빈 데이터베이스의 최초 관리자 계정을 만들 때만 사용합니다. |
| `ADMIN_PASSWORD` | Empty DB only | 최초 관리자 생성용 비밀번호입니다. 기존 관리자 비밀번호를 덮어쓰지 않습니다. |
| `ENABLE_GIT_BACKUPS` | No | 기본값은 `false`입니다. `true`일 때만 Git 백업 스케줄러를 시작합니다. |
| `GITHUB_TOKEN` | Only with Git backups | 자동 Git 백업 기능을 의도적으로 켠 경우에만 필요합니다. |
| `DATABASE_SSL` | No | Supabase 주소와 `sslmode=require`는 자동 감지됩니다. 다른 TLS 서버에 연결할 때만 `true`로 지정합니다. |

`.env.example`은 키 이름과 형식만 보여 주는 예시입니다. 실제 `.env` 파일과 접속 문자열, 세션 비밀값은 Git에 커밋하지 마세요.

## Supabase 초기 연결

1. Supabase 프로젝트의 **Connect** 화면에서 PostgreSQL URI를 복사합니다.
2. URI에 `sslmode=require`가 포함되어 있는지 확인합니다.
3. Render의 `DATABASE_URL` 값으로 등록합니다. 인증서 검증은 기본적으로 활성화됩니다.
4. 첫 실행 시 앱이 필요한 테이블을 생성합니다. 빈 DB에서 관리자 계정도 만들려면 `ADMIN_USERNAME`과 `ADMIN_PASSWORD`를 함께 설정합니다. 기존 Supabase 데이터베이스를 사용할 경우에는 먼저 백업을 보관하세요.

저장소의 SQL 백업 파일은 배포와 Git 추적에서 제외됩니다. 백업 데이터 복원은 별도의 승인된 절차로 실행하고, `SEED_FROM_BACKUP`은 배포 환경에서 설정하지 마세요.

> 이미 GitHub에 커밋된 과거 SQL 백업은 일반 파일 삭제만으로 기록에서 사라지지 않습니다. 저장소를 더 넓게 공유하기 전에는 Git 기록 정리와 포함되었을 수 있는 비밀번호·접속 정보의 교체를 별도 보안 작업으로 진행하세요.

## 자동 Git 백업

자동 백업은 Render 환경에서 기본적으로 꺼져 있습니다. 활성화하려면 `ENABLE_GIT_BACKUPS=true`와 `GITHUB_TOKEN`을 모두 설정해야 하며, 실행 환경에 `pg_dump`가 있어야 합니다. 일반적인 Render Web Service에서는 Supabase의 자체 백업 또는 별도 백업 작업을 권장합니다.