source test.env
echo "Domains: " $DOMAIN_NAME
echo "Protocol: " $PROTOCOL
echo "Docker Compose Command: " $@
docker compose -f docker-compose.yml -f test-compose.yml $@
