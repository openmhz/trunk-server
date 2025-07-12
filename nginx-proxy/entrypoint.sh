#!/bin/bash
set -e

# Render the config from template
envsubst '$DOMAIN_NAME' < /etc/nginx/conf.d/site.template > /etc/nginx/conf.d/default.conf

# Test Nginx config
nginx -t

# Background job: reload Nginx every 6 hours to pick up new certs
(
  while true; do
    sleep 6h
    echo "[nginx] Reloading config..."
    nginx -s reload && echo "[nginx] Reload succeeded" || echo "[nginx] Reload failed"
  done
) &

# Start Nginx in the foreground
exec nginx -g 'daemon off;'