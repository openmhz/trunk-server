#!/usr/bin/env bash
# One-time (and re-runnable) setup of the Docker host that runs OpenMHz.
#
#   sudo ./ops/setup-host.sh            show what would change (writes nothing)
#   sudo ./ops/setup-host.sh --apply    install it
#
# Installs:
#   /etc/logrotate.d/openmhz            rotate nginx's log files in data/log/nginx
#   /etc/systemd/journald.conf.d/openmhz.conf
#                                       cap the systemd journal at 500 MB (it kept
#                                       ~4 GB: every container log is also stored there)
#   /etc/cron.d/openmhz                 daily database backup; weekly removal of
#                                       untagged Docker images and old build cache
#
# Everything here is plain config files; re-running replaces them with the
# current version. Remove a file to undo that part.
set -euo pipefail

apply=false
[[ "${1:-}" == "--apply" ]] && apply=true

repo="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "$apply" == true && "$(id -u)" != "0" ]]; then
  echo "Run as root (sudo) to install." >&2
  exit 1
fi

# ---------------------------------------------------------------- files

logrotate_conf() {
  cat <<EOF
# Installed by ops/setup-host.sh. nginx runs in a container and keeps its log
# files open, so rotate by copying and truncating instead of moving.
${repo}/data/log/nginx/*.log {
	daily
	rotate 14
	maxsize 200M
	missingok
	notifempty
	compress
	copytruncate
}

/var/log/openmhz-maintenance.log {
	weekly
	rotate 8
	missingok
	notifempty
	compress
}
EOF
}

journald_conf() {
  cat <<'EOF'
# Installed by ops/setup-host.sh. Container logs already go to syslog
# (/var/log/syslog, rotated weekly); keep the journal's copy small.
[Journal]
SystemMaxUse=500M
EOF
}

cron_conf() {
  cat <<EOF
# Installed by ops/setup-host.sh.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Times are UTC, in the quietest part of the day (09:00-11:00 UTC).
# 10:15 daily: back up users, systems, talkgroups, groups, events (not calls).
15 10 * * * root ${repo}/mongo/backup.sh >> /var/log/openmhz-maintenance.log 2>&1

# 10:30 Sundays: remove untagged images (left behind by every rebuild) and build
# cache older than a week. Tagged images, including the *-previous rollback
# images that deploy.sh keeps, are not touched.
30 10 * * 0 root (date -u; docker image prune -f --filter until=168h; docker builder prune -f --filter until=168h) >> /var/log/openmhz-maintenance.log 2>&1
EOF
}

# ---------------------------------------------------------------- install

changed=0
install_file() {
  local target=$1 content=$2
  if [[ -f "$target" ]] && [[ "$(cat "$target")" == "$content" ]]; then
    echo "  unchanged  $target"
    return
  fi
  changed=1
  if [[ "$apply" == true ]]; then
    mkdir -p "$(dirname "$target")"
    printf '%s\n' "$content" > "$target"
    chmod 644 "$target"
    echo "  installed  $target"
  else
    echo "  would install $target:"
    if [[ -f "$target" ]]; then
      diff <(cat "$target") <(printf '%s\n' "$content") | sed 's/^/      /' || true
    else
      printf '%s\n' "$content" | sed 's/^/      /'
    fi
  fi
}

echo "OpenMHz host setup ($([[ "$apply" == true ]] && echo apply || echo dry run)), repo: $repo"

# Check the logrotate config before installing it.
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
logrotate_conf > "$tmp"
if command -v logrotate >/dev/null; then
  if logrotate -d "$tmp" >/dev/null 2>&1; then
    echo "  logrotate config parses"
  else
    echo "  logrotate rejected the config:" >&2
    logrotate -d "$tmp" >&2 || true
    exit 1
  fi
fi

install_file /etc/logrotate.d/openmhz "$(logrotate_conf)"
install_file /etc/systemd/journald.conf.d/openmhz.conf "$(journald_conf)"
install_file /etc/cron.d/openmhz "$(cron_conf)"

if [[ "$apply" == true ]]; then
  # Apply the journal cap now rather than waiting for journald to restart.
  systemctl restart systemd-journald
  journalctl --vacuum-size=500M | tail -n 1
  echo
  echo "Done. Journal: $(journalctl --disk-usage | grep -oE '[0-9.]+[KMGT]')."
  echo "The nginx logs rotate at the next daily logrotate run (or now: logrotate -f /etc/logrotate.d/openmhz)."
elif [[ $changed -eq 1 ]]; then
  echo
  echo "Dry run only. Re-run with --apply to install."
fi
