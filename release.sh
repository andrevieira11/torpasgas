#!/usr/bin/env bash
# One-shot release: build + push from THIS PC, then pull + up on the server over SSH.
# The build runs locally; the server only pulls. NEVER builds on the server.
set -euo pipefail

SSH="${DEPLOY_SSH:-drewst@torpasweb}"
DIR="${DEPLOY_DIR:-/software/Tanque}"

"$(dirname "$0")/deploy.sh"

echo ">> Deploying on ${SSH}:${DIR}"
ssh "$SSH" "cd '$DIR' && docker compose pull && docker compose up -d"
echo ">> Released."
