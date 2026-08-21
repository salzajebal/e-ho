#!/usr/bin/env bash
set -euo pipefail

# Run from the checked-out application directory on a fresh Ubuntu Lightsail instance.
APP_DIR="${APP_DIR:-$(pwd)}"
DB_NAME="${DB_NAME:-myapp}"
DB_USER="${DB_USER:-eho_app}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "DB_PASSWORD must be supplied. Generate one locally with: openssl rand -hex 24" >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "APP_DIR does not point to the application repository: $APP_DIR" >&2
  exit 1
fi

echo "Installing Ubuntu packages..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl git build-essential postgresql postgresql-contrib postgresql-client ufw

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p "process.versions.node.split('.')[0]")" -lt 20 ]]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm install --global pm2
sudo systemctl enable --now postgresql

echo "Creating the local PostgreSQL role and database..."
sudo -u postgres psql --set=ON_ERROR_STOP=1 --set=db_name="$DB_NAME" --set=db_user="$DB_USER" --set=db_password="$DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'db_user', :'db_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL
sudo -u postgres psql --set=ON_ERROR_STOP=1 --dbname="$DB_NAME" -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'
sudo -u postgres psql -c "ALTER SYSTEM SET listen_addresses = 'localhost';"
sudo systemctl restart postgresql

if [[ ! -f "$APP_DIR/.env" ]]; then
  session_secret="$(openssl rand -hex 32)"
  cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
SESSION_SECRET=${session_secret}
ENABLE_GIT_BACKUPS=false
EOF
  chmod 600 "$APP_DIR/.env"
  echo "Created $APP_DIR/.env with locally generated credentials."
else
  echo "$APP_DIR/.env already exists; it was not changed."
fi

echo "Installing application dependencies and creating a production build..."
cd "$APP_DIR"
npm ci --include=dev --no-audit --no-fund
npm run build

sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw --force enable

cat <<EOF

Server prerequisites are ready.
Start the application as the regular Ubuntu user:
  cd "$APP_DIR"
  set -a && source .env && set +a
  pm2 start ecosystem.config.cjs --update-env
  pm2 save
  pm2 startup systemd

Run the command printed by "pm2 startup systemd" once, then run "pm2 save" again.
EOF