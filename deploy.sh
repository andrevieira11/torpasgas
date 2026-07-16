#!/usr/bin/env bash
# Build the Tanque image on THIS PC and push to GHCR.
# NEVER run this on the server / Proxmox VM 100 — builds freeze the whole VM.
# The server only ever does:  docker compose pull && docker compose up -d
set -euo pipefail

IMAGE="${IMAGE:-ghcr.io/andrevieira11/torpasgas}"
# Baked into the client bundle at build time — must be the real public origin.
APP_URL="${NEXT_PUBLIC_APP_URL:-https://gas.torpasweb.com}"
SHA="$(git rev-parse --short HEAD)"

echo ">> Building ${IMAGE}:latest and ${IMAGE}:${SHA}"
echo ">> NEXT_PUBLIC_APP_URL=${APP_URL}"
docker build --build-arg "NEXT_PUBLIC_APP_URL=${APP_URL}" -t "${IMAGE}:latest" -t "${IMAGE}:${SHA}" .

echo ">> Pushing ${IMAGE}:latest"
docker push "${IMAGE}:latest"
echo ">> Pushing ${IMAGE}:${SHA}"
docker push "${IMAGE}:${SHA}"

echo ">> Done. On the server:  docker compose pull && docker compose up -d"
