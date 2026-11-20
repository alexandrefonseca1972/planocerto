#!/usr/bin/env bash
# Deploy do PlanoCerto na VPS e, em seguida, atualização do grafo do projeto (graphify).
#
# Uso (na raiz do repositório, na branch main atualizada):
#   scripts/deploy.sh             # deploy + atualiza grafo (commit/push só de graphify-out)
#   scripts/deploy.sh --dry-run   # mostra os arquivos que mudariam na VPS e para
#   scripts/deploy.sh --no-graph  # deploy sem atualizar o grafo
#
# Passos: copia origin/main → guarda a versão atual em app-prev → para o site → envia →
# compila → religa (se a compilação falhar, restaura app-prev) → testa páginas →
# registra no OPERACAO.md → graphify update (sem LLM) → commit/push do grafo se mudou.
# Migrations NÃO são aplicadas aqui (exigem backup e revisão; ver OPERACAO.md).
set -euo pipefail

HOST="${DEPLOY_HOST:-vps}"
# Conexão viva verificada a cada 30 s (cai em ~2 min se a VPS parar de responder).
SSH_OPTS=(-o BatchMode=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=4)
REMOTE=/opt/planocerto
APP="$REMOTE/app"
SITE="${DEPLOY_SITE:-https://planocerto.app}"
DRY_RUN=0
GRAPH=1
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --no-graph) GRAPH=0 ;;
    *) echo "Opção desconhecida: $arg" >&2; exit 2 ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"
git fetch -q origin main
SHA=$(git rev-parse --short origin/main)

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
git archive origin/main | tar -x -C "$STAGE"

EXCLUDES=(--exclude=.env.local --exclude=node_modules/ --exclude=.next/ --exclude='._*'
          --exclude=.git/ --exclude=.husky/ --exclude='*.tsbuildinfo' --exclude=next-env.d.ts)

echo "== Deploy de origin/main ($SHA) em $HOST:$APP"
echo "== Arquivos que mudam na VPS:"
rsync -rcn --itemize-changes "${EXCLUDES[@]}" "$STAGE/" "$HOST:$APP/" | awk '{print "   " $2}'
[ "$DRY_RUN" = 1 ] && { echo "== --dry-run: nada foi alterado."; exit 0; }

echo "== Guardando versão atual em app-prev e parando o site"
ssh "${SSH_OPTS[@]}" "$HOST" "rm -rf $REMOTE/app-prev && cp -a $APP $REMOTE/app-prev && systemctl stop planocerto-web"

echo "== Enviando arquivos"
rsync -rc "${EXCLUDES[@]}" "$STAGE/" "$HOST:$APP/"

echo "== Compilando (npm ci + build) e religando"
# Se a compilação falhar, volta para app-prev e religa: o site nunca fica parado.
ssh "${SSH_OPTS[@]}" "$HOST" bash -s -- "$REMOTE" "$SHA" <<'REMOTE_SCRIPT'
set -uo pipefail
# Comandos longos rodam com </dev/null: nenhum processo filho herda a entrada da conexão SSH
# (o bash -s lê este script por ela; se um filho a segura, o ssh local fica preso após o fim).
REMOTE="$1"; SHA="$2"; APP="$REMOTE/app"
chown -R planocerto:planocerto "$APP"
if ! sudo -u planocerto bash -lc "cd $APP && npm ci --no-audit --no-fund >/tmp/planocerto-npm.log 2>&1 && set -a && . ./.env.local && set +a && NODE_OPTIONS=--max-old-space-size=2048 npm run build >/tmp/planocerto-build.log 2>&1" </dev/null; then
  echo "!! Falha na compilação — restaurando a versão anterior (logs em /tmp/planocerto-*.log)"
  rm -rf "$APP-falha" && mv "$APP" "$APP-falha" && mv "$REMOTE/app-prev" "$APP"
  systemctl start planocerto-web </dev/null
  exit 1
fi
systemctl start planocerto-web </dev/null
sleep 4
systemctl is-active --quiet planocerto-web || { echo "!! planocerto-web não ficou ativo"; exit 1; }
BUILD_ID=$(cat "$APP/.next/BUILD_ID")
printf "\n## Deploy %s — origin/main %s\nVia scripts/deploy.sh. BUILD_ID %s. Versão anterior em app-prev.\n" \
  "$(date '+%d/%m/%Y %H:%M')" "$SHA" "$BUILD_ID" >> "$REMOTE/OPERACAO.md"
echo "   ativo — BUILD_ID $BUILD_ID"
REMOTE_SCRIPT

echo "== Testando páginas"
for path in / /auth; do
  code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$SITE$path")
  echo "   $path -> $code"
  [ "$code" = 200 ] || { echo "!! $path respondeu $code (esperado 200)"; exit 1; }
done

[ "$GRAPH" = 1 ] || { echo "== Deploy concluído (grafo não atualizado: --no-graph)."; exit 0; }

echo "== Atualizando o grafo do projeto (graphify, sem LLM)"
if ! command -v graphify >/dev/null; then
  echo "   graphify não instalado — grafo não atualizado."; exit 0
fi
# O grafo deve refletir exatamente o que foi publicado: só atualiza/commita na main igual a origin/main.
if [ "$(git branch --show-current)" != main ] || [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "   Repositório local não está na main igual a origin/main — rode 'git switch main && git pull' e depois 'graphify update .'."
  exit 0
fi
graphify update . >/tmp/planocerto-graphify.log 2>&1 || { echo "   graphify falhou (log em /tmp/planocerto-graphify.log)."; exit 0; }
GRAPH_FILES=(graphify-out/graph.json graphify-out/graph.html graphify-out/GRAPH_REPORT.md)
if git diff --quiet -- "${GRAPH_FILES[@]}"; then
  echo "   Grafo já estava atualizado."
else
  git add -- "${GRAPH_FILES[@]}"
  git commit -q -m "chore(graphify): atualiza grafo após deploy de $SHA" -- "${GRAPH_FILES[@]}"
  git push -q origin main
  echo "   Grafo atualizado e enviado ($(git rev-parse --short HEAD))."
fi
echo "== Deploy concluído."
