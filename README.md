trunk-server-docker

## For Local Testing:
  - In root dir, run: `./docker-test.sh build`
  - `./docker-test.sh up -d`

You can then browser to:
- openmhz.test
- admin.openmhz.test

Make sure the following is in: */etc/hosts*

````
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost
127.0.0.1       openmhz.test api.openmhz.test admin.openmhz.test media.openmhz.test
````

## Default user name:

- test@test.com
- password: password


## DNS Entries

CNAMEs need to be created for the various services. Create the CNAMEs below with your DNS host:
- api
- account
- media
- admin

After doing this, you should have the following domains: api.domain.com, account.domain.com, media.domain.com, admin.domain.compose

## Mailjet
