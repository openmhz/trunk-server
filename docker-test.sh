export MEDIA=/Users/luke/Testing/media
export DATA=/Users/luke/Testing/data
export MAILJET_KEY="FILL IN HERE"
export MAILJET_SECRET="FILL IN HERE"
export STAGE=test
export TAG=1.7
export DOMAIN_NAME="openmhz.test"
export PROTOCOL="http://"

export STRIPE_PUBLISHABLE_KEY=""
export STRIPE_SECRET_KEY="FILL IN HERE"
export BACKEND_SERVER="${PROTOCOL}api.${DOMAIN_NAME}"
export FRONTEND_SERVER="${PROTOCOL}${DOMAIN_NAME}"
export ADMIN_SERVER="${PROTOCOL}admin.${DOMAIN_NAME}"
export MEDIA_SERVER="${PROTOCOL}media.${DOMAIN_NAME}"
export SOCKET_SERVER="wss://socket.${DOMAIN_NAME}"
export ACCOUNT_SERVER="${PROTOCOL}account.${DOMAIN_NAME}"
export COOKIE_DOMAIN=".${DOMAIN_NAME}"
export SITE_NAME="OpenMHz"
export ADMIN_EMAIL="admin@email.com"
export S3_PROFILE='default'
export S3_ENDPOINT='s3.us-west-1.wasabisys.com'
export S3_BUCKET='openmhz-test'
export FREE_PLAN=0
export PRO_PLAN=10
export FREE_PLAN_PRICE=0
export PRO_PLAN_PRICE=15
export FREE_PLAN_ARCHIVE=7
export PRO_PLAN_ARCHIVE=30

echo $COOKIE_DOMAIN
echo "Docker Compose Commad: " $@
docker-compose -f docker-compose.yml -f test-compose.yml $@
