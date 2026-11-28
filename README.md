# Trunk Server
This is the software behind OpenMhz. For a while I had thoughts that I should see if I could make a business out of OpenMHz. I have come to realize though that I don't really want to run a business, I like building things a lot more. 

In that vein, let's building some awesome things. Help me make OpenMHz better. Take the code and build a scanning site for your community. Add those features you have always been looking for. We can do better together!

 - Luke

*If you are using this project as part of a business, please become a sponsor. A lot of time and effort went into building this*

## Notes
This code is pretty poorly commented, I am going to work on that. I am also going to use the Wiki to document the project. Please add to the documentation as you learn things.

There are a bunch of experiments lurking in the code. There is some code for adding in Stripe payments. I was going to role out the concept of paid accounts with additional features. There is also a half completed effort to allow more than one user to be associated with a system. 

I haven't done a great job of keeping all the packages up to date... and I never got around to adding tests. Both of these would be great things for folks to go after.

## Stages: production, test and development
Everything runs with Docker Compose. The stage is chosen by which compose files are loaded:

| Stage | Compose files | What it is |
|---|---|---|
| production | `compose.yaml` | HTTPS, certbot, syslog logging, real S3 |
| test | `compose.yaml` + `compose.test.yaml` | the same stack over HTTP on `*.openmhz.test`, with a local S3 emulator and a seeded database, nothing external needed |
| development | the test files + `compose.dev.yaml` | the test stack with live reload of the server code |

Each machine has an env file named `.env` in the repo root that holds its settings and a `COMPOSE_FILE` line naming those files, so every command is plain `docker compose ...`. `.env` is git-ignored.

## Path Forward
It would be great to get the code to a place where there is base code and people can add customization on top of that. They would probably fork the base code, add additional features and design and then rebaseline the code as new things are added to the mainline. 

## Architecture
There are a lot of different components that make up the system. All of the server code is written in NodeJS and the frontend code uses React. Each of the different system components is run as a seperate container. A docker-compose script is used to start everything up. Right now, it is being operated on a single machine. It wouldn't be too hard to split it over a couple machines using Kubernetes. Semantic UI React is being used to create all of the UI components. 
 - **account**: this frontend / server handles user account creation and profiles. When a user logins, they are re-directed to this app.
 - **admin**: a logged-in user uses this frontend / server to manage their systems.
 - **backend**: this just a server with no web frontend. It provides the API for uploading, filtering and fetching calls. It should also handle all of the metdata around a call.
 - **frontend**: the frontend / server that general public use to look through systems and listen to calls.
 - **mongo**: all of the metadata around calls is stored here, along with the user and system information.
 - **nginx**: proxies all of the calls to the correct server and handles the HTTPS certs.

## Easy Install

*NOTE: This may no longers be the easy method... I haven't updated the Ansible scripts in a while. Use at your own peril!! PRs wanted if you fix them up.*
I put together an [Ansible Script](https://github.com/openmhz/trunk-server-install) to help make it easier to setup an OpenMHz server. You still need to get yourself a Droplet from Digital Ocean, a Domain Name and some storage. The scripts helps download and build everything.

## Operations
You can run things in 2 different modes, **test** and **prod**. The big difference is that **prod** expects all of the calls to be https and gets cranky when they are not. I have gotten **test** to run fine on my laptop, so that is probably a good starting point.

### DNS Entries
You should have a domain name pointing to the IP address of the server you are going to use. 
CNAMEs also need to be created for the various services. Create the CNAMEs below with your DNS host:
- api
- account
- admin
- www

After doing this, you should have the following domains: `api.domain.com`, `account.domain.com`,  `admin.domain.com`, `www.domain.com`

### S3 Storage
Currently, both **test** and **prod** expect to use S3-based storage instead of local storage. Switching to use local storage would be relatively easy - but for the sake of testing, let's just say use something S3-compatible. Make sure that ~/.aws/credentials has the credentials you'd like to use with your S3-compatible storage provider.. IE:
```
[default]
aws_access_key_id = [..]
aws_secret_access_key = [..]
```

# Automatically renewing SSL Certificates

SSL certs are automatically fetched from Let's Encrypt using the CertBot tool. The approach taken is based on this [Medium post](https://pentacent.medium.com/nginx-and-lets-encrypt-with-docker-in-less-than-5-minutes-b4b8a60d3a71) and accompanying [GitHub repo](https://github.com/wmnnd/nginx-certbot/tree/master). 

You do need to jump start the process and do an initial fetch. To get started, make sure you have your `prod.env` file filled out. If you don't, copy prod.env.example to prod.env and fill in the details. Make sure **DOMAIN_NAME** and **REACT_APP_ADMIN_EMAIL** are correct and are the version you want to use in production. Those values will be used when requesting an SSL cert from Let's Encrypt.

This script uses Let's Encrypt's [Certbot tool](https://eff-certbot.readthedocs.io/en/latest/).

In the main directory of the **Trunk Server** repo, run the following commands:

```bash
source prod.env
docker compose -f certbot-compose.yml up
```

Check the output from CertBot - and when it is done, just hit `ctrl + c` to exit. 

And then run the following to make sure everything has stopped:

```bash
docker compose -f certbot-compose.yml down
```

### Configure and run production
Copy the example settings, fill them in, and link them as `.env`:

```bash
cp prod.env.example prod.env
ln -s prod.env .env
```

Fill in:
- MailJet information
- S3 information
- Site name
- Admin Email (The email will appear to come from this email. You should make sure it matches the domain MailJet is configured for)
- How many days calls will be archived for.... this is just a UI thing, you need to create some S3 rules to make sure they are deleted
- `SESSION_SECRET`, a long random value (changing it later signs everyone out once)

Then `docker compose up -d --build` starts everything. Every service has a healthcheck, and `docker compose ps` shows whether each one is healthy.

`./deploy.sh` deploys the checked-out code with only a few seconds of downtime per service. Run `git pull` first.
```bash
./deploy.sh                      # backend, admin, account and frontend
./deploy.sh backend admin        # just these
./deploy.sh --rollback admin     # back to the image that was running before the last deploy
```
It keeps the running images as `<image>-previous`, builds the new ones while the old containers keep serving, swaps the containers, waits for each to report healthy, and reloads nginx. Don't stop containers before building: on 2026-11-28 that took the API down for 27 minutes.

nginx looks up the app containers through Docker's DNS every couple of seconds (`nginx-proxy/upstreams.conf`), so recreated containers that come back on new IP addresses are picked up without a reload.

`./docker-prod.sh` and `./docker-test.sh` still work as shorthands for `docker compose` with `prod.env` or `test.env`.

If you are having trouble with Docker Compose not building the images, try adding "--parallel 1". There may have been too many builds happening at once.

### Server maintenance
`sudo ./ops/setup-host.sh` shows what it would install on the Docker host; add `--apply` to install it. It sets up:
- daily rotation of nginx's log files in `data/log/nginx`
- a 500 MB cap on the systemd journal
- a daily database backup (`mongo/backup.sh`, 10:15 UTC)
- a weekly cleanup of untagged Docker images and old build cache (Sundays, 10:30 UTC)

Re-running the script updates these files. Output from the cron jobs goes to `/var/log/openmhz-maintenance.log`.

Traffic is lowest from 09:00 to 11:00 UTC, so do reboots and nginx recreates then. Every container has `restart: always` and comes back by itself after a reboot; afterwards, check `docker ps` and the sites.

`./deploy.sh` keeps each service's previous image as `<image>-previous`. Images you tagged yourself for a rollback stay until you remove them with `docker rmi`.

### Service I Like
- 💻 I use Digital Ocean and they have been pretty great. If you need hosting, give them a try and use my referal code: https://m.do.co/c/402fa446f7a6 
You get $100 of credit to use in 60 days.

- 💾 If you need storage, give Wasabi a try. The have been mostly reliable and you can't beat the price: https://wasabi.com

- 📨 I use Mailjet... and you need to also. It makes it easy to send out email address confirmations: https://www.mailjet.com

- 🔒 I use Let's Encrypt. It works.


## Local test and development

### Local DNS

The test stack serves `openmhz.test` and its subdomains, so point them at your machine.

On MacOS, make the changes in: */etc/hosts*

````
127.0.0.1       localhost
127.0.0.1       openmhz.test account.openmhz.test api.openmhz.test admin.openmhz.test
````
Then load these values into local DNS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`

### Test stack
```bash
cp test.env.example .env
docker compose up -d --build
```
Then browse to http://openmhz.test, http://account.openmhz.test and http://admin.openmhz.test.

The test stack needs nothing outside your machine:
- **Database:** an empty database (in `data/test/mongo`) is created with the app's indexes and some test data. Sign in as `test@openmhz.test` with password `openmhz-test`.
- **Test system:** the system `test` takes uploads with the API key `test-api-key`:
  ```bash
  curl -F call=@call.m4a -F talkgroup_num=101 -F start_time=$(date +%s) -F api_key=test-api-key \
       -F source_list='[]' -F freq=851000000 http://api.openmhz.test/test/upload
  ```
- **S3:** a local S3 emulator stores call audio, events and podcasts in `data/test/s3`.
- **Email:** Mailjet is only needed to test emails. Without keys, registration still works, and the page offers to resend the confirmation.

To start again from an empty database, `docker compose down` and delete `data/test/`.

*Interesting Note*: Safari 13+ does not like the **.test** TLD and doesn't seem to want to store cookies from the TLD. It seems to work fine in production when you are using a real TLD. I guess use Chrome for local testing or a different TLD for testing, like local.
https://stackoverflow.com/questions/62023857/sharing-cookies-across-test-sub-domains-in-safari-13-not-possible

### Development with live reload
In `.env`, switch `COMPOSE_FILE` to the development line (it's in `test.env.example`), then:
```bash
docker compose up --build --watch
```
- **Server code:** edits to the backend, to the account, admin and frontend servers, or to `packages/shared` are copied into the running container, and the service restarts in a second or two.
- **Dependencies:** changing a `package.json` or the lockfile rebuilds that image.
- **React clients:** changing a client's `src/` rebuilds its image too. For instant hot reload while working on a client, run that client on your machine instead (next section).

### Debugging React Apps using Hot Reloading
If you are trying to make changes to any of react frontends, it is a huge pain to have to compile to site and rebuild the container each time you make a change. Instead, simply run the react app in development mode. This will work for the frontends for the:
- admin frontend
- account frontend
- frontend... frontend

First, start the test or development stack as described above; the client still talks to its APIs.

The apps are npm workspaces that share one `package-lock.json` at the repo root. Install once from the root (not from the app folders):
````
npm install
````
Then start the app you are working on, for example the admin frontend:
````
set -a; source .env; set +a
npm start --workspace admin
````

This should build the frontend and open a browser. In order to have all the cookies work correctly, you have to use the same domain name. Make sure you have setup the local domains as described above. Then goto the base domain, for me that is openmhz.test, at port 3000 `openmhz.test:3000`

## Dependencies and tests
- Add or upgrade a package for one app with `npm install <package> --workspace <app>` from the repo root. This updates that app's `package.json` and the root `package-lock.json`; commit both. The Docker images install with `npm ci`, so they get exactly what the lockfile lists.
- Run every app's tests with `npm test` from the root (they need a MongoDB; see the comments at the top of each test file). GitHub Actions runs them on every pull request.
- The Node images build with the repo root as their context (`docker build -f backend/Dockerfile .`). The root `.dockerignore` keeps `data/`, `node_modules` and env files out of them.

## Upgrading a "Frontend" server

https://create-react-app.dev/docs/updating-to-new-releases/


## Managing MongoDB

MongoDB is used in the backend to store data. It is pretty fast, flexible and has worked well enough for me.
All of the files that MongoDB uses to store the DB are in the */data* directory, which gets mapped into the container. 
Mapping this directory makes sure that the data persists each time you run the mongo container.

### Working with the MongoDB Container

From the Host OS run:
```bash
docker exec -i -t $(docker ps -a | grep mongo | awk '{print $1}') /bin/bash
```
Then launch the `mongosh` CLI tool and find any users you have created
```bash
mongosh
use scanner
db.users.find()
```

Now swap out the ObjectId for the user, and then run this command. It will make it so you don't need to confirm the email.

```bash
db.users.updateOne(
   { "_id" : ObjectId("63a620d0a63b087b005f6726") },
   {
     $set: { "confirmEmail" : true },
     $currentDate: { lastModified: true }
   }
)
```




### Maintaining the database
`mongo/db.sh` runs the maintenance scripts in `mongo/scripts/maintain.js` inside the running mongo container. Run it from the Docker host. Commands that change data are dry runs until you add `--apply`, every command is safe to repeat, and none of them deletes a system that is receiving calls.

```bash
./mongo/db.sh report                        # read-only: sizes, missing indexes, duplicates, orphans
./mongo/db.sh prune-inactive --apply        # delete systems with no calls for 6+ months
./mongo/db.sh dedupe-systems --apply        # one document per shortName: keep the copy uploads use
./mongo/db.sh dedupe --apply                # remove duplicate talkgroups and talkgroups/groups of deleted systems
./mongo/db.sh dedupe-users --apply          # remove duplicate accounts and make screen names unique
./mongo/db.sh indexes --apply               # create the indexes the app needs
./mongo/db.sh remove-system <id> --apply    # delete one copy of a duplicated shortName by hand
./mongo/db.sh clean-calls --apply           # delete calls older than one month (the backend also does this nightly)
./mongo/db.sh drop-leftovers --apply        # drop collections nothing uses any more
./mongo/db.sh shell                         # mongosh on the scanner database
```

For a full cleanup, take a backup and then run `prune-inactive`, `dedupe-systems`, `dedupe`, `dedupe-users` and `indexes` in that order. Each step's result feeds the next, and the unique indexes are only built once the duplicates are gone.

`dedupe-users` follows these rules:
- **Accounts that share an email address (ignoring case):** the account that owns an active system is kept. The others are removed if they have no active system and aren't admins, along with any inactive systems they own. Accounts that each own an active system, and admin accounts, are left for a manual merge, and the report lists them.
- **Accounts that share a screen name:** the account with an active system keeps the name, and the others get a counter appended (`bob2`, `bob3`, …), skipping names already in use.

An active system is one with calls in the last six months, the same rule `prune-inactive` uses.

Indexes are defined only in `maintain.js`. The apps connect with Mongoose's `autoIndex` turned off, so a deploy never starts an index build. A new, empty database gets all of the indexes the first time the mongo container starts. On an existing database, run `report` and then `indexes --apply`.

### Backups
`./mongo/backup.sh` writes a gzipped `mongodump` archive of everything except calls to `data/backups/` and keeps the newest 14. `./mongo/backup.sh --full` includes calls. Set `BACKUP_S3_URI` to also copy each dump to a **private** bucket; the dump contains email addresses and password hashes. See the comments at the top of the script for the cron line and how to restore.

### Compact a collection
Deleting calls doesn't shrink the files on disk. To reclaim space, run `db.runCommand({compact:'calls'})` in `./mongo/db.sh shell`. This can slow the site down while it runs.

### Upgrading MongoDB
It is a huge pain to upgrade MongoDB in place. It turns out to be easier to dump backup of the database, wipe everything out and then restore into a new database for the latest version of Mongo.

Rough Playbook (use common sense, I may not have this exact):
- get into the shell of the mongo container
- `mongodump --uri="mongodb://127.0.0.1" --db scanner --out /data/db/backup`
- exit contianer and go back to host machine
- `cd data/db`
- `rm *` erase everything... but not the sub-directories because that is where the backup is
- upgrade to the latest version of mongo
- build and launch the mongo container, which will create an empty DB
- get into the shell of the mongo container
- `mongorestore  --db scanner --drop /data/db/backup/scanner`

### Privlege Port Error

```bash
Error response from daemon: driver failed programming external connectivity on endpoint trunk-server-nginx-1 (ec995a6333ce5b9869b9070e380d01b81333fdb3f2734bb93922c1ef7d84314d): Error starting userland proxy: error while calling PortManager.AddPort(): cannot expose privileged port 443, you can add 'net.ipv4.ip_unprivileged_port_start=443' to /etc/sysctl.conf (currently 1024), or set CAP_NET_BIND_SERVICE on rootlesskit binary, or choose a larger port number (>= 1024): listen tcp4 0.0.0.0:443: bind: permission denied
```

https://docs.docker.com/engine/security/rootless/#exposing-privileged-ports

## Setting up Logging
I have had good luck with Loggly. Their free tier provides enough capabilities for most small sites.
The Docker Logging Driver works well and is easy to install:

https://documentation.solarwinds.com/en/Success_Center/loggly/Content/admin/docker-logging-driver.htm


## Move a site to a new server

Here is the general list of things to do:
- Copy over ~/.aws
- Copy over ~/.secrets
- Do a mongodump on old machine
- Scp the mongo backup to the new machine
- Launch the MongoDB container on the new machine
- Do a mongorestore
- Launch all the conatiners
- Change the Floating IP to point to the new machine
