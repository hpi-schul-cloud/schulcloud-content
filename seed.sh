if [ "$NODE_ENV" != 'production' ]
then
    mongoimport --host=localhost --port=27017 --db schulcloud_content --collection users --file ./backup/schulcloud_content/users.json --drop
fi