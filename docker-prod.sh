source prod.env

echo "Docker Compose Commad: " $@
docker-compose -f docker-compose.yml $@
