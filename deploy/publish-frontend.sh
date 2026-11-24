#!/usr/bin/env bash
set -euo pipefail

# Execute como ubuntu no repositório; sudo é usado apenas na publicação.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
exec 9>"${TMPDIR:-/tmp}/frontend-crm-build-publish-$(id -u).lock"
flock -n 9 || { echo 'Já existe uma publicação em andamento.' >&2; exit 1; }
npm run build
test -s dist/index.html
test -s dist/version.json

sudo bash -s -- "$PWD/dist" /var/www/frontend-crm <<'PUBLISH'
set -euo pipefail
origem="$1"
destino="$2"
mkdir -p "$destino"
exec 8>/var/lock/frontend-crm-publish.lock
flock -n 8 || { echo 'Outra publicação está em andamento.' >&2; exit 1; }

# Não excluir arquivos antigos: abas abertas ainda podem carregar chunks antigos.
rsync -av --exclude='/index.html' --exclude='/version.json' "$origem/" "$destino/"
html_temporario="$(mktemp "$destino/.index.XXXXXX")"
versao_temporaria="$(mktemp "$destino/.version.XXXXXX")"
trap 'rm -f -- "$html_temporario" "$versao_temporaria"' EXIT
install -m 644 "$origem/index.html" "$html_temporario"
install -m 644 "$origem/version.json" "$versao_temporaria"
# Renomear no mesmo diretório evita que leitores recebam JSON/HTML parciais.
mv -f -- "$html_temporario" "$destino/index.html"
mv -f -- "$versao_temporaria" "$destino/version.json"
echo 'Frontend publicado. Versão anunciada após assets e HTML.'
PUBLISH
