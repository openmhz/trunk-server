# Trunk Server
This is the software behind OpenMhz. For a while I had thoughts that I should see if I could make a business out of OpenMHz. I have come to realize though that I don't really want to run a business, I like building things a lot more. 

In that vein, let's building some awesome things. Help me make OpenMHz better. Take the code and build a scanning site for your community. Add those features you have always been looking for. We can do better together!

 - Luke

*If you are using this project as part of a business, please become a sponsor. A lot of time and effort went into building this*

## Notes
This code is pretty poorly commented, I am going to work on that. I am also going to use the Wiki to document the project. Please add to the documentation as you learn things.

There are a bunch of experiments lurking in the code. There is some code for adding in Stripe payments. I was going to role out the concept of paid accounts with additional features. There is also a half completed effort to allow more than one user to be associated with a system. 

I haven't done a great job of keeping all the packages up to date... and I never got around to adding tests. Both of these would be great things for folks to go after.

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

## Operations

You can run things in 2 different modes, `test` and `prod`. The big difference is that `prod` expects all of the calls to be https and gets cranky when they are not. I have gotten `test` to run fine on my laptop, so that is probably a good starting point.

Currently, both `test` and `prod` expect to use S3-based storage instead of local storage. Switching to use local storage would be relatively easy - but for the sake of testing, let's just say use something S3-compatible. Make sure that ~/.aws/credentials has the credentials you'd like to use with your S3-compatible storage provider.. IE:
```
[default]
aws_access_key_id = [..]
aws_secret_access_key = [..]
```

Copy docker-test.sh.example to docker-test.sh, and/or docker-prod.sh.example to docker-prod.sh.

`./docker-test.sh` - sets up docker-compose to run with the correct environment variables for testing

`./docker-prod.sh` - sets up docker-compose to run with the correct environment variables for production

Fill out the Environment variables in both these files. S3_PROFILE should match the profile that is defined in the aws/credentials file. You don't need to worry about the Stripe stuff, since that is dormant.

If you are doing frontend work, you can turn off the de-obfuscation. To do this, edit the Dockerfile for the server you are working with. Change the CMD to:
`CMD ["npm", "run", "start:dev"]` Just remember to turn it off when you make the code public.



### Hosting
I use Digital Ocean and they have been pretty great. If you need hosting, give them a try and use my referal code: https://m.do.co/c/402fa446f7a6
You get $100 of credit to use in 60 days.

If you need storage, give Wasabi a try. The have been mostly reliable and you can't beat the price: https://wasabi.com


### HTTPS
I use Let's Encrypt. It works.

### For Local Testing:
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

### Default user name, for Test:

- test@test.com
- password: password


### DNS Entries

CNAMEs need to be created for the various services. Create the CNAMEs below with your DNS host:
- api
- account
- media
- admin

After doing this, you should have the following domains: api.domain.com, account.domain.com, media.domain.com, admin.domain.compose


### Debugging React Apps using Hot Reloading
If you are trying to make changes to any of react frontends, it is a huge pain to have to compile to site and rebuild the container each time you make a change. Instead, simply run the react app in development mode. This will work for the frontends for the:
- admin frontend
- account frontend
- frontend... frontend

First, start up all of the containers as described above. You will still the backend APIs they provide.

Now go into the respective sub directory for the component you are interested in and run:
````
source ../test.env
yarn start
````

This should build the frontend and open a browser. In order to have all the cookies work correctly, you have to use the same domain name. Make sure you have setup the local domains as described above. Then goto the base domain, for me that is openmhz.test, at port 3000 `openmhz.test:3000`


### Mailjet
Sign up for MailJet! 
https://www.mailjet.com
