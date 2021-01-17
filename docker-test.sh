
source test.env

echo $COOKIE_DOMAIN
echo "Docker Compose Commad: " $@
docker-compose -f docker-compose.yml -f test-compose.yml $@
