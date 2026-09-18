#!/usr/bin/env bash
# Bean Book Mac print agent — polls for shipping labels and prints them.
#
# Setup: see docs/auto-print-labels.md
# Required env (or a sibling .env file sourced below):
#   PRINT_AGENT_SITE_URL   e.g. https://thebeanbook.com
#   PRINT_AGENT_SECRET     same value as PRINT_AGENT_SECRET on Vercel
#   PRINT_QUEUE_NAME       CUPS printer queue name (lpstat -p -d)
#
# Optional:
#   PRINT_AGENT_POLL_SECONDS=60
#   PRINT_AGENT_DRY_RUN=1     download only, do not print or mark
#   PRINT_AGENT_LOG=/tmp/beanbook-print-agent.log

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${PRINT_AGENT_ENV_FILE:-$SCRIPT_DIR/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SITE_URL="${PRINT_AGENT_SITE_URL:?Set PRINT_AGENT_SITE_URL}"
SECRET="${PRINT_AGENT_SECRET:?Set PRINT_AGENT_SECRET}"
PRINTER="${PRINT_QUEUE_NAME:?Set PRINT_QUEUE_NAME (run: lpstat -p -d)}"
POLL_SECONDS="${PRINT_AGENT_POLL_SECONDS:-60}"
DRY_RUN="${PRINT_AGENT_DRY_RUN:-0}"
LOG_FILE="${PRINT_AGENT_LOG:-/tmp/beanbook-print-agent.log}"
WORKDIR="${PRINT_AGENT_WORKDIR:-/tmp/beanbook-labels}"

mkdir -p "$WORKDIR"

log() {
  local line="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$line" | tee -a "$LOG_FILE"
}

auth_header="Authorization: Bearer ${SECRET}"
queue_url="${SITE_URL%/}/api/print-agent/queue"

print_file() {
  local file="$1"
  local order_id="$2"

  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN skip print order=${order_id} file=${file}"
    return 0
  fi

  case "${file##*.}" in
    zpl|ZPL|zplii|ZPLII)
      lp -d "$PRINTER" -o raw "$file"
      ;;
    *)
      lp -d "$PRINTER" -o fit-to-page "$file" || lp -d "$PRINTER" "$file"
      ;;
  esac
}

process_once() {
  local response
  local batch="$WORKDIR/batch.tsv"

  if ! response="$(curl -fsS -H "$auth_header" "${queue_url}?limit=10")"; then
    log "ERROR failed to fetch queue"
    return 1
  fi

  printf '%s' "$response" | python3 -c '
import json, sys
data = json.load(sys.stdin)
print(data.get("count", 0))
for item in data.get("items", []):
    print("\t".join([
        item["orderId"],
        item["labelUrl"],
        (item.get("trackingNumber") or ""),
        (item.get("customerEmail") or ""),
    ]))
' >"$batch"

  local count
  count="$(head -n1 "$batch")"
  if [[ -z "$count" || "$count" == "0" ]]; then
    return 0
  fi

  log "queue has ${count} label(s)"

  # Skip the count line; process tab-separated jobs.
  while IFS=$'\t' read -r order_id label_url tracking email; do
    [[ -z "$order_id" || -z "$label_url" ]] && continue

    ext="pdf"
    if [[ "$label_url" == *".zpl"* || "$label_url" == *"ZPL"* ]]; then
      ext="zpl"
    fi
    outfile="${WORKDIR}/${order_id}.${ext}"

    log "download order=${order_id} email=${email} tracking=${tracking}"
    if ! curl -fsSL "$label_url" -o "$outfile"; then
      log "ERROR download failed order=${order_id}"
      continue
    fi

    if ! print_file "$outfile" "$order_id"; then
      log "ERROR print failed order=${order_id}"
      continue
    fi

    if [[ "$DRY_RUN" == "1" ]]; then
      continue
    fi

    if curl -fsS -X POST -H "$auth_header" \
      "${queue_url}/${order_id}/printed" >/dev/null; then
      log "printed order=${order_id}"
    else
      log "ERROR mark-printed failed order=${order_id} (may reprint next poll)"
    fi
  done < <(tail -n +2 "$batch")
}

log "print agent starting site=${SITE_URL} printer=${PRINTER} poll=${POLL_SECONDS}s dry_run=${DRY_RUN}"

if command -v caffeinate >/dev/null 2>&1; then
  caffeinate -dims &
  CAFFEINATE_PID=$!
  trap 'kill "$CAFFEINATE_PID" 2>/dev/null || true' EXIT
fi

while true; do
  process_once || true
  sleep "$POLL_SECONDS"
done
