# Lightsail 자체 PostgreSQL 배포 안내

이 프로젝트는 AWS Lightsail Ubuntu 인스턴스 한 대에서 Node.js 앱과 PostgreSQL을 함께 실행할 수 있습니다. PostgreSQL은 외부에 공개하지 않고 `localhost`로만 연결하며, 앱은 PM2가 재시작과 서버 재부팅 후 실행을 관리합니다.

## 1. 서버 만들기와 네트워크

1. Lightsail에서 **Ubuntu 22.04 LTS 또는 24.04 LTS** 인스턴스를 만듭니다.
2. 고정 IP를 연결합니다.
3. 처음 설치할 때 Lightsail Networking에서 다음 포트를 엽니다.
   - `22/TCP`: SSH
   - `3000/TCP`: 초기 상태 및 헬스 체크용
4. PostgreSQL 포트 `5432`는 **열지 마세요**. DB는 같은 서버의 앱만 접속해야 합니다.

운영 로그인은 HTTPS가 필요합니다. 앱의 세션 쿠키는 운영 모드에서 HTTPS로만 동작하므로, 아래의 Caddy 설정까지 마친 뒤에는 `80/443`만 열고 `3000`은 외부에서 닫는 구성을 사용하세요.

## 2. 최초 1회 설치

Lightsail SSH 터미널에서 아래 순서대로 실행합니다. 실제 비밀번호는 저장소나 채팅에 적지 않습니다.

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL> ~/e-ho
cd ~/e-ho

# URL에 안전한 DB 비밀번호를 생성합니다. 이 터미널 창에서만 사용합니다.
export DB_PASSWORD="$(openssl rand -hex 24)"

# PostgreSQL, Node.js 20, PM2, UFW를 설치하고 앱용 DB와 .env를 만듭니다.
chmod +x scripts/setup-lightsail-ubuntu.sh
APP_DIR="$HOME/e-ho" ./scripts/setup-lightsail-ubuntu.sh

# 비밀번호가 셸 기록에 남지 않도록 현재 셸 변수에서 지웁니다.
unset DB_PASSWORD
```

설치 스크립트가 다음을 처리합니다.

- PostgreSQL 서버·클라이언트·`pgcrypto` 확장 설치
- 앱 전용 DB 사용자와 `myapp` 데이터베이스 생성
- PostgreSQL을 `localhost`만 수신하도록 설정
- Node.js 20과 PM2 설치
- `.env` 생성 및 권한을 소유자 전용(`600`)으로 제한
- 의존성 설치와 프로덕션 빌드
- UFW에서 SSH와 앱 포트만 허용

`.env`는 서버에만 두고 Git에 올리지 않습니다. 필요하면 아래처럼 확인·수정합니다.

```bash
cd ~/e-ho
chmod 600 .env
nano .env
```

필수 값은 다음과 같습니다.

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://eho_app:<DB_PASSWORD>@localhost:5432/myapp
SESSION_SECRET=<LONG_RANDOM_VALUE>
ENABLE_GIT_BACKUPS=false
```

앱 코드는 `DATABASE_URL`을 우선 사용합니다. 로컬 개발 시 변수가 없으면 `postgresql://postgres:password@localhost:5432/myapp`을 기본값으로 참조하지만, 운영 서버에서는 반드시 `.env`의 실제 URL을 사용하세요.

## 3. 기존 데이터 이전

데이터 이전은 **앱을 처음 시작하기 전**, 비어 있는 Lightsail DB에서 한 번만 실행하는 것을 권장합니다. 기존 Supabase DB는 이전이 완전히 검증될 때까지 삭제하지 마세요.

### Supabase 등 기존 DB에서 바로 이전

먼저 원본 서비스를 점검 모드로 전환하거나 앱 프로세스를 중지하여 **새로운 거래·가입·입출금 요청 등 DB 쓰기를 멈춥니다**. 이 작업이 끝날 때까지 원본 DB로의 쓰기를 재개하지 마세요. 이 과정이 있어야 덤프 전후의 행 수 비교가 같은 시점의 데이터임을 보장합니다.

```bash
cd ~/e-ho
set -a && source .env && set +a

# 현재 DB의 실제 접속 문자열을 이 서버의 셸에만 넣습니다.
export SOURCE_DATABASE_URL='postgresql://postgres:<SOURCE_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require'

# 원본 쓰기가 중지됐음을 명시적으로 확인합니다.
export SOURCE_DATABASE_QUIESCED=true

# 대상은 .env의 DATABASE_URL, 즉 Lightsail 로컬 PostgreSQL입니다.
npm run db:migrate:lightsail

unset SOURCE_DATABASE_URL
unset SOURCE_DATABASE_QUIESCED
```

스크립트는 `pg_dump` custom dump를 만들고 복원한 뒤, 모든 `public` 테이블의 행 수를 비교합니다. 덤프는 `backups/`에 생성되며 Git에서 제외됩니다.

대상 DB에 이미 테이블이 있으면 안전을 위해 중단합니다. 기존 데이터를 덮을 가능성이 있는 `--force`는 별도 백업을 검증한 경우에만 사용하세요.

```bash
npm run db:migrate:lightsail -- --force
```

덤프/복원을 분리해서 수행할 수도 있습니다.

```bash
export SOURCE_DATABASE_URL='<CURRENT_DATABASE_URL>'
export SOURCE_DATABASE_QUIESCED=true
npm run db:export:lightsail
npm run db:import:lightsail -- backups/database-YYYYMMDDTHHMMSSZ.dump
unset SOURCE_DATABASE_URL
unset SOURCE_DATABASE_QUIESCED
```

## 4. PM2로 24시간 실행

```bash
cd ~/e-ho
set -a && source .env && set +a
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup systemd
```

`pm2 startup systemd`가 출력하는 `sudo ...` 명령을 **그대로 한 번 실행**한 뒤 다음을 다시 실행합니다.

```bash
pm2 save
```

이제 서버 재부팅 후에도 앱이 자동 실행됩니다. 상태와 로그는 다음 명령으로 확인합니다.

```bash
pm2 status
pm2 logs e-ho
curl http://127.0.0.1:3000/api/health
```

## 5. HTTPS와 도메인 연결

도메인 DNS의 `A` 레코드를 Lightsail 고정 IP로 연결한 뒤 아래를 실행합니다. Caddy가 무료 TLS 인증서를 발급하고 `https://your-domain.example.com` 요청을 내부 앱 포트 `3000`으로 전달합니다.

```bash
# 먼저 Lightsail Networking에서도 80/TCP와 443/TCP를 허용합니다.
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo apt-get update
sudo apt-get install -y caddy
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
```

`your-domain.example.com`을 실제 도메인으로 바꾼 뒤 다음을 실행합니다.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy

sudo ufw delete allow 3000/tcp
```

확인이 끝나면 Lightsail Networking에서도 `3000/TCP` 규칙을 제거하세요.

```bash
curl -I https://your-domain.example.com
```

## 6. 업데이트 배포

```bash
cd ~/e-ho
git pull
npm ci --include=dev --no-audit --no-fund
npm run build
set -a && source .env && set +a
pm2 restart e-ho --update-env
pm2 save
```

## 7. 운영 점검

```bash
# 앱 상태와 로그
pm2 status
pm2 logs e-ho --lines 100

# PostgreSQL 상태와 DB 접속
sudo systemctl status postgresql
sudo -u postgres psql -d myapp -c '\dt'

# 앱 헬스 체크
curl http://127.0.0.1:3000/api/health
```

운영 중에는 정기 백업도 필요합니다. 최소한 앱을 업데이트하거나 DB 구조를 바꾸기 전에는 `pg_dump`로 백업 파일을 만들고, VPS 외부의 안전한 저장소에 보관하세요.