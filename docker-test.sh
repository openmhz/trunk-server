source test.env
echo "Docker Compose Command: " $@
docker-compose -f docker-compose.yml -f test-compose.yml $@