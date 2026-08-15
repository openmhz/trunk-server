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

> **Known-good checkpoint: tag `pre-transcription` (`9b2b71e`).** Everything
> described below works and is deployed as of that tag: account gating, user
> administration, the login audit trail, per-user starred calls, and
> lockfile-pinned images. Transcription work starts after it, so
> `git diff pre-transcription` is the whole of that feature and
> `git reset --hard pre-transcription` is the way back.
>
> **`local-dev` has never been pushed.** At the time of the tag, 55 commits
> existed only on this machine — `origin/local-dev` does not exist and
> `origin/master` is 55 behind. There is no GitHub credential configured in WSL
> or Windows (no `gh`, no SSH key, no credential helper), so the push needs
> authenticating first:
>
> ```bash
> gh auth login          # or configure a credential helper / SSH key
> git push -u origin local-dev
> git push origin pre-transcription
> ```

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

After **adding a dependency or rebuilding a React bundle**, rebuilding the image
is not enough:

```bash
docker rm -fv hamrecorder-account-1 && ./docker-local.sh up -d account
```

`local-compose.yml` mounts `/app/node_modules` and `/app/public` as anonymous
volumes, which are created once and then reused forever — so the container keeps
serving the first build's modules and bundle no matter how many times the image
is rebuilt. `-v` is what drops them. Applies to `account` and `admin`;
`frontend` uses per-file mounts and is not affected.

Env lives in `test.env` / `prod.env` (both gitignored). `prod.env.example` is
the template.

### Dependencies

Each service commits a `package-lock.json` and its Dockerfile installs with
`npm ci`, so an image built from a given commit has the same dependency tree
every time. **After editing any `package.json`, regenerate that service's lock
or the build fails** — `npm ci` treats disagreement as an error, which is the
point. There is no npm on the host, so use the image's own Node version:

```bash
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD/account:/w" -w /w node:19-alpine3.16 npm install --package-lock-only
```

`node:19-alpine3.16` for account/admin/frontend, `node:22-bookworm` for backend.
Note that `--package-lock-only` only *satisfies* the existing lock; delete the
lock first if you want versions genuinely refreshed.

There are deliberately no `yarn.lock` files. Nothing read them, and npm rewrites
a yarn.lock as a side effect whenever it finds one, so they generated endless
diffs for a file no build consumed.

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
- A `disabled` account is rejected in `deserializeUser`, so its existing
  sessions stop working the moment the flag is set rather than whenever they
  happen to lapse 30 days later.

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
- User administration in `admin/` — `admin/src/Users/ListUsers.js` and
  `admin/server/controllers/users.js`. Search and filter accounts; disable,
  enable, grant or remove admin, resend a confirmation email, delete. Every
  destructive action confirms first, an admin cannot act on their own account,
  and an account that still owns systems cannot be deleted.
- Login audit trail — `LoginEvent`, one row per attempt, shown at
  `admin/src/Users/LoginActivity.js` with a repeated-failures-by-IP summary.
- Rate limits on `/login`, `/register`, `/api/send-reset-password` and
  `/users/:userId/send-confirm`. See `account/server/config/rate-limits.js`.
- Sign-out with a confirmation modal, in the player and in admin.
- Sign-in on the front page itself (`frontend/src/Common/SignInModal.js`),
  posting to the account service's existing `/login`. Registration stays on the
  account site - that form is nine fields with terms acceptance and matching
  server-side validation, and a second copy would drift.
- Navigation on the account site. It had none: once on the profile page there
  was no way back except editing the address bar.
- Starred calls are per listener (`backend/models/starred_call.js`). They used
  to be a counter on the call shared by everyone.
- Removed the Trending section from the systems list.
- Trimmed the call info pane of things that only mean something on a trunked
  system: the `-1[0]` source list, the duplicated frequency statistic, the
  permanent "No Patches" row, and a second Download control.

## In progress: transcription

The next feature is machine transcription of call audio, as the first thing
worth paying for. The full plan lives outside the repo at
`~/.claude/plans/valiant-shimmying-wilkes.md`. The shape of it:

- **Self-hosted Whisper** (`faster-whisper`, `small.en`, int8) in its own
  container on the `node` network, with no published port and no vhost — it has
  no authentication of its own. Audio never leaves the server.
- **The Call document is the queue.** `transcriptStatus` plus an atomic
  `findOneAndUpdate` claim; no Redis, no queue library. A `transcriber` service
  runs the same image as `backend` with a different `command`, so ingest and the
  read API never share an event loop with transcription.
- **The paid tier is called "Supporter"** in every user-visible string — never
  "premium", "paid" or "pro". Stored as `plan: 'free' | 'supporter'` on the
  user. Granted by an admin for now; Stripe and donations come later.
- **Transcription runs for every call; the gate is on reading**, because calls
  are shared between listeners. Free accounts get a `transcriptState` of
  `'locked'` and no text in the payload at all.

### Notes on those

`send-confirm` takes no authentication — it never has — so its limiter is keyed
on the account being emailed rather than the caller's IP. That stops the actual
abuse (mailing one person repeatedly, which a botnet could do from a new address
each time) and does not punish an admin resending confirmations to many people.

`skipSuccessfulRequests` is unusable on `/login`: a rejected login answers
**200** with `success: false` in the body, so the limiter counted every failure
as a success and never fired. Every attempt counts instead.

geo-IP uses `geoip-lite`, whose database ships inside the npm package. No API
key, and no user's IP address is sent to a third party. The cost is image size
and roughly 100 MB resident in the account service; if that matters on the
droplet, that is the thing to revisit.

`trust proxy` on the account service is `1`, not `true`. With `true`, a client
could put any address it liked in `X-Forwarded-For` and spoof both the rate
limiter's key and the IP recorded in the audit trail.

Login events hold an IP and an approximate location per attempt, so they are
personal data. A TTL index deletes them after 90 days. Deleting an account
deliberately does **not** delete its login history.

The login failure `reason` is split finely for the audit trail ("bad password"
vs "no such account") but collapsed to one value before it reaches the client.
Handing that distinction to the browser is exactly how account enumeration
works, and the `message` has always been identical for both.

**Groups** are a named bundle of talkgroups per system, defined in the admin
portal, so a listener can filter by "Fire" instead of ticking talkgroups one by
one. On a conventional ham system, where the talkgroup number carries the
repeater frequency, a group would be something like "2 m repeaters". The Filter
dialog shows an empty Groups section when a system has none defined - which is
currently all of them.

## Still to do

- The dead `bcrypt-nodejs` code in `backend/models/user.js` and
  `systemSchema.js` can be deleted; nothing in the backend calls it.
- `account/server/config/express.js` falls back to
  `Access-Control-Allow-Origin: *` alongside `Allow-Credentials: true` for
  unknown origins. Browsers reject that combination, so it is not a leak, but it
  is wrong and hides real CORS misconfiguration behind a warning log.
- The admin user screens have not been driven in a browser end to end — the API
  is verified, the bundle contains the code, but the rendering has only been
  checked statically.
