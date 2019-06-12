
ELASTIC_HOST=${ELASTIC_HOST:="localhost"}
ELASTIC_PORT=${ELASTIC_PORT:="9200"}
MONGO_HOST=${MONGO_HOST:="localhost"}
MONGO_PORT=${MONGO_PORT:="27017"}
MONGO_DATABASE=${MONGO_DATABASE:="schulcloud_content"}

if [ "$NODE_ENV" != 'production' ]
then
    curl -XDELETE $ELASTIC_HOST:$ELASTIC_PORT/$MONGO_DATABASE
    mongoimport --host=$MONGO_HOST --port=$MONGO_PORT --db $MONGO_DATABASE --collection resources --file ./backup/schulcloud_content/resources.json --drop
    mongoimport --host=$MONGO_HOST --port=$MONGO_PORT --db $MONGO_DATABASE --collection providers --file ./backup/schulcloud_content/provider.json --drop
    mongoimport --host=$MONGO_HOST --port=$MONGO_PORT --db $MONGO_DATABASE --collection users --file ./backup/schulcloud_content/users.json --drop
fi
