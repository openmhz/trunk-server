```markdown
# Installing Trunk-Server Locally (no HTTPS)

## Prerequisites:

1. **Set static IP for trunk-server**
2. **Set DNS for admin account**: Point `api` to the trunk-server IP.
3. **Install Ubuntu Server 24.04**
4. **Update system:**
   ```bash
   sudo apt update
   sudo apt upgrade
   ```
5. **Add subdomains to `/etc/hosts`:**
   ```bash
   127.0.0.1       openmhz.test account.openmhz.test api.openmhz.test admin.openmhz.test media.openmhz.test
   ```
6. **Flush DNS cache:**
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

7. **Create a file in your user's home directory for AWS credentials:**
   ```bash
   mkdir ~/.aws
   nano credentials
   ```
   Add the following content to the file:
   ```ini
   [default]
   aws_access_key_id = [..]
   aws_secret_access_key = [..]
   ```

## Install Docker (from Docker Docs)

1. **Update and install prerequisites:**
   ```bash
   sudo apt update
   sudo apt-get install ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   ```

2. **Add Docker's official GPG key:**
   ```bash
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc
   ```

3. **Add Docker repository to APT sources:**
   ```bash
   echo \
   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
   $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
   sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

4. **Update system and install Docker:**
   ```bash
   sudo apt update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

## Setting up MINIO (on another machine/VM)

- It is possible to run MinIO on the same machine (though not recommended).
- Follow the MinIO installation guide for Linux: [MinIO Installation Docs](https://min.io/docs/minio/linux/operations/installation.html)
- For a small home setup, use **Single-Node Single-Drive (SNSD)** or **Standalone** mode.

### High-Level MinIO Crash Course:

1. **Create a bucket** (this is where you will store audio from TrunkServer).
2. **Set Access Policy for the bucket to Public** (Reminder: This is for local, NON-Internet only).
3. **Create an Access Key and Secret**:
   - Copy the secret as you can only view it once. If lost, create a new key and delete the old one.

## Install Trunk Server

1. **Clone the repository:**
   ```bash
   git clone https://github.com/openmhz/trunk-server
   cd trunk-server
   ```

2. **Copy example environment file:**
   ```bash
   cp test.env.example test.env
   ```

3. **Edit the environment file:**
   ```bash
   nano test.env
   ```
   Add the following:
   ```bash
   export S3_PROFILE='default'
   export S3_REGION='us-east-1'
   export S3_ENDPOINT='http://minio.domain.com:9000'
   export S3_BUCKET='bucketname'
   ```
   Save and exit.

4. **Adjust `uploads.js` to work with MinIO path:**
   ```bash
   nano ~/trunk-server/backend/controllers/uploads.js
   ```
   - In Nano, press `ALT+n` to show line numbers.
   - Around line 50, add the following crucial line:
     ```javascript
     const client = new S3Client({
       requestHandler: new NodeHttpHandler({
         httpsAgent: agent,
       }),
       credentials: fromIni({ profile: s3_profile }),
       endpoint: s3_endpoint,
       region: s3_region,
       maxAttempts: 2,
       forcePathStyle: true,
     });
     ```

5. **Build and start the server:**
   ```bash
   ./docker-test.sh build   # This will take a while
   ./docker-test.sh up -d   # This starts the server as a daemon
   ```

6. **Make sure you have the following commands available when running `./docker-test.sh`:**
   ```bash
   ./docker-test.sh build
   ./docker-test.sh up -d
   ./docker-test.sh down
   ```

## Creating Accounts (without an email server)

1. Go to `account.(yourtrunkservername).(yourdomain).com`.
2. Click **Register**.
3. Fill out the form and click **Register** (nothing will happen right away).
4. Connect to the right Docker container:
   ```bash
   docker exec -i -t $(docker ps -a | grep mongo | awk '{print $1}') /bin/bash
   ```

5. **Access MongoDB shell:**
   ```bash
   mongosh
   ```

6. **Select the `scanner` database:**
   ```bash
   use scanner
   ```

7. **Find and update user to confirm email:**
   ```bash
   db.users.find()
   db.users.updateOne(
      { "_id" : ObjectId("63a620d0a63b087b005f6726") },
      {
        $set: { "confirmEmail" : true },
        $currentDate: { lastModified: true }
      }
   )
   ```

## Useful Commands

### TrunkServer Logs:
```bash
docker-compose logs --follow --tail 50
```

### Build, Stop, and Start TrunkServer:
```bash
./docker-test.sh build
