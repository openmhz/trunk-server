


source test.env
echo $REACT_APP_ACCOUNT_SERVER
echo "Docker Compose Command: " $@
docker-compose -f docker-compose.yml -f test-compose.yml $@
