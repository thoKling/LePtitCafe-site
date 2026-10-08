#!/usr/bin/env bash
# Builds the site for le-ptit-cafe.fr and replaces the files on the IONOS webspace.
# The SSH password is read from password.txt at the project root (never committed).
# Usage: scripts/deploy-ionos.sh
set -euo pipefail

HOST="u84582985@home620338129.1and1-data.host"
REMOTE_DIR="app620338136" # folder the domain points to (IONOS panel → Domaines)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASSWORD_FILE="$ROOT/password.txt"

[ -f "$PASSWORD_FILE" ] || { echo "password.txt introuvable à la racine du projet." >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "→ Construction du site…"
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$ROOT":/src:ro -v "$WORK":/out -w /src ruby:3.3 \
  sh -c "gem install jekyll -N -q >/dev/null && jekyll build -q --disable-disk-cache --config _config.yml,_config.ionos.yml -d /out/site"

printf 'ErrorDocument 404 /404.html\nDirectoryIndex index.html\n' > "$WORK/site/.htaccess"

# Safety net: never publish the password file.
if find "$WORK/site" -iname '*password*' | grep -q .; then
  echo "Un fichier de mot de passe se trouve dans le site construit, envoi annulé." >&2
  exit 1
fi

# ssh reads the password through SSH_ASKPASS so it never appears on the command line.
printf '#!/bin/sh\ncat "%s"\n' "$PASSWORD_FILE" > "$WORK/askpass.sh"
chmod 700 "$WORK/askpass.sh"
export SSH_ASKPASS="$WORK/askpass.sh" SSH_ASKPASS_REQUIRE=force DISPLAY="${DISPLAY:-:0}"

echo "→ Envoi vers IONOS…"
setsid -w rsync -rlt --delete --exclude=.opcache \
  -e "ssh -o PubkeyAuthentication=no -o StrictHostKeyChecking=accept-new" \
  "$WORK/site/" "$HOST:$REMOTE_DIR/"

echo "✓ Site publié sur $(sed -n 's/^url: "\(.*\)"/\1/p' "$ROOT/_config.ionos.yml")"
