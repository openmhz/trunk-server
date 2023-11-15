source prod.env
echo "Docker Compose Command: " $@
docker compose -f docker-compose.yml $@
