# hamrecorder

A fork of [openmhz/trunk-server](https://github.com/openmhz/trunk-server) (upstream last
merged 2025-01-23) running at hamrecorder.com. It receives call audio from
trunk-recorder clients over the internet and serves it to listeners.

The fork's purpose: **require an account to reach the systems list and calls**,
as the basis for later per-user features (favourites, transcription, AI).

## Layout

| Service | Port | What it is |
|---|---|---|
| `frontend/` | 3000 | The player. CRA app + a small express server. |
| `backend/` | 3005 | Call ingest and the read API. No login of its own. |
| `account/` | 3009 | Registration, login, password reset, email confirmation. |
| `admin/` | 3008 | Feed-operator admin: systems, talkgroups, groups. |
| `nginx-proxy/` | 80/443 | Vhosts per subdomain, generated from `site.template`. |
| `mongo`, `minio` | | Database and object storage (S3-compatible, local dev). |

Branch is `local-dev`. `origin` is the fork, `upstream` is openmhz.

## Running it

```bash
./docker-local.sh up -d          # local dev: adds MinIO + source bind mounts
./docker-local.sh build frontend # rebuild one service
./docker-test.sh  …              # same without the MinIO layer
./docker-prod.sh  …              # production (reads prod.env)
```

Use `docker-local.sh` locally. `docker-test.sh` omits `local-compose.yml`,
which silently drops `S3_FORCE_PATH_STYLE` and `OTEL_SDK_DISABLED` — that
combination once broke MinIO uploads in a way that looked like data loss.

Env lives in `test.env` / `prod.env` (both gitignored). `prod.env.example` is
the template.

## Authentication

There is one session, shared by all services, and the backend does not create
it. The account service issues it; passport stores the user id at
`session.passport.user`; the backend and admin read the same Mongo session
store and the same cookie.

For that to work, four things must match across account, admin and backend:
`SESSION_SECRET`, the cookie name (`sessionId`), the cookie domain
(`.${DOMAIN_NAME}`), and the Mongo URL.

- `SESSION_SECRET` comes from the environment. There is deliberately **no
  default** — production throws at startup without it, development warns and
  uses a throwaway. It used to be hardcoded as the upstream default, which is
  public in every fork.
- Sessions roll for 30 days (inactivity, not age). Admin routes additionally
  require a login within the last 12 hours, using `session.loginAt`.

### What requires a login

Gated (`requireListener` in `backend/middleware/auth.js`): `/systems`,
`/:shortName/calls*`, `/:shortName/call/:id`, `/card/:id`, the star routes,
talkgroups, groups, and the Socket.IO connection.

Public: `/stats` (counts only), and `/:shortName/upload`, which authenticates
with the system's API key because trunk-recorder is headless and cannot hold a
cookie.

**Audio files themselves are not gated.** They are public bucket URLs, as they
always were. Gating them was tried and reverted — see below.

## Things that will bite you

**Audio must not be served through the app.** Gating individual audio files
turned every fetch into a slow credentialed request. WaveSurfer downloads the
audio itself in order to draw the waveform, and cancels that download whenever
React rebuilds it — which happens on every call change. With direct bucket URLs
the fetch finishes before anything can cancel it. This cost a full day.
`frontend/src/Call/components/MediaPlayer.js` is unmodified upstream code and
should stay that way.

**CORS cannot use a wildcard.** The session cookie makes player requests
credentialed, and browsers reject `*` on those. `backend/config/express.js`
echoes the origin. `EXTRA_CORS_ORIGINS` adds origins the `DOMAIN_NAME`-derived
ones do not cover, such as a LAN IP in local dev.

**SameSite=Lax means the hostname matters.** Browsing by IP is cross-site
relative to `api.<domain>`, so the cookie is not sent and you appear signed
out. Use the hostname.

**Socket.IO and express-session.** Session middleware must be skipped for the
WebSocket upgrade; running it there breaks the handshake and every later poll
returns 400. See `io.engine.use` in `backend/index.js`.

**nginx caches upstream IPs.** `proxy_pass` with a literal hostname resolves
once at config load, so recreating a container produces 502s until nginx is
reloaded. Fixed with a `resolver` plus a variable in `proxy_pass` — keep the
`$request_uri`, since nginx stops appending the URI once a variable is used.

**index.html must not be cached**, or browsers keep running an old bundle after
a deploy while the server looks correct.

## Work done in this fork

- Dependency upgrades: 93 advisories → 46, every reachable one cleared.
  multer 1.4.4 → 2.2.0 mattered most; it parses uploads before any auth runs.
- Upload hardening: temp files were leaked on five early-return paths,
  including API-key mismatch, so anonymous requests filled the disk. Added
  multer limits and made the error handler actually respond.
- Ops: backend bound to loopback, OTel disabled by default, nginx upstream
  re-resolution, no-cache on index.html, domain fallbacks pointed at
  hamrecorder.com.
- Accounts: callsign (max 7, stored lowercase, shown uppercase, mirrored into
  screenName), city/state/country replacing free-text location, migration in
  `account/server/scripts/migrate-callsign-location.js`.
- Gating: the listener wall described above, plus `RequireListener` in the
  player.
- Removed the "Link" sharing control from the player and the call info pane.

## Still to do

- **Phase 5** — user administration in `admin/`. `isAdmin` and
  `GET /admin/users` already exist; there is no UI and no write operations
  (disable, delete, resend confirmation, toggle admin).
- **Phase 6** — login audit trail. A `LoginEvent` per attempt (success and
  failure, IP, geo), written from the four branches of
  `account/server/config/passport-strategies/local.js`, surfaced in admin.
  `trust proxy` and `X-Forwarded-For` are already configured. Add rate limiting
  on `/login` at the same time — there is none today.
- The dead `bcrypt-nodejs` code in `backend/models/user.js` and
  `systemSchema.js` can be deleted; nothing in the backend calls it.
