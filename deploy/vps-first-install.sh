#!/usr/bin/env bash
# Première installation sur le VPS (Ubuntu/Debian).
# Usage : bash vps-first-install.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/JN-EPHEC/group-royalflush.git}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/group-royalflush}"
ENV_FILE="${ROYALFLUSH_ENV_FILE:-$HOME/royalflush-api.env}"
WEB_ROOT="${WEB_ROOT:-/var/www/royalflush}"
NGINX_SNIPPET="/etc/nginx/snippets/royalflush-api-proxy.conf"

echo "==> Dossier applicatif : $DEPLOY_DIR"
if [[ ! -d "$DEPLOY_DIR/.git" ]]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
else
  echo "    Repo déjà présent, pull..."
  git -C "$DEPLOY_DIR" pull --ff-only origin main || true
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "==> Créer le fichier d'environnement : $ENV_FILE"
  cp "$DEPLOY_DIR/server/vps.env.example" "$ENV_FILE"
  echo "    Édite $ENV_FILE (DATABASE_URL, JWT_SECRET, ADMIN_SETUP_KEY) puis relance ce script."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installation de Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
  echo "    Reconnecte-toi en SSH pour utiliser docker sans sudo."
fi

export ROYALFLUSH_ENV_FILE="$ENV_FILE"
cd "$DEPLOY_DIR/deploy"
docker compose up -d --build

if [[ ! -f "$NGINX_SNIPPET" ]]; then
  echo "==> Snippet Nginx API"
  sudo mkdir -p /etc/nginx/snippets
  sudo cp "$DEPLOY_DIR/deploy/nginx-api-proxy-snippet.conf" "$NGINX_SNIPPET"
fi

sudo mkdir -p "$WEB_ROOT"
echo ""
echo "OK — API Docker sur 127.0.0.1:3000"
echo "Prochaines étapes :"
echo "  1. Configurer Nginx (deploy/nginx-royalflush-site.conf + certbot si HTTPS)"
echo "  2. Déployer le frontend (push sur main → GitHub Actions, ou build local + copie vers $WEB_ROOT)"
echo "  3. Créer le premier admin : POST https://ton-domaine/setup/admin"
