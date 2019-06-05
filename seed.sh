if [ "$NODE_ENV" != 'production' ]
then
    curl -XDELETE localhost:9200/schulcloud_content
    rm ./mongo-connector.log
    rm ./oplog.timestamp
    mongo --host=localhost --port=27017 --eval "rs.initiate({ _id : \"rs\", members: [ { _id : 0, host : \"localhost:27017\" } ] })"
    mongoimport --host=localhost --port=27017 --db schulcloud_content --collection resources --file ./backup/schulcloud_content/resources.json --drop
    mongoimport --host=localhost --port=27017 --db schulcloud_content --collection providers --file ./backup/schulcloud_content/provider.json --drop
    mongoimport --host=localhost --port=27017 --db schulcloud_content --collection users --file ./backup/schulcloud_content/users.json --drop
fi
