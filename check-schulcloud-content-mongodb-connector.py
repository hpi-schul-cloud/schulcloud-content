import subprocess
import os
from pymongo import MongoClient
from elasticsearch import Elasticsearch
from time import sleep
import logging

# Only Error Logging
# See https://github.com/elastic/elasticsearch-py/issues/666
logging.basicConfig(level=logging.ERROR)

# Total Connection Attempts
totalConnectionAttempts = 30

# Try connecting to MongoDatabase
connection = None
i = 0
while i < totalConnectionAttempts:
	try:
			connection = MongoClient([os.environ['MONGO_URI']], int(os.environ['MONGO_PORT']))
			print("Successfully connected to mongodb")
			break
	except:
			print("Will retry connecting to mongodb {}/{}".format(i+1, totalConnectionAttempts))
	sleep(0.5)
	i = i +1

if i == totalConnectionAttempts:
    raise ValueError("Connection failed for mongodb")

# Try connecting to ElasticSearch
elasticConnect = Elasticsearch(
	hosts=[{'host': os.environ['ELASTIC_URI'], 'port': int(os.environ['ELASTIC_PORT'])}]
)
i = 0
while i < totalConnectionAttempts:
    try:
        if elasticConnect.ping():
            print("Sucessfully connected to elasticsearch")
            break
        else:
          raise
    except:
        print("Will retry connecting to elasticsearch {}/{}".format(i+1, totalConnectionAttempts))
    sleep(0.5)
    i = i +1

if i == totalConnectionAttempts:
    raise ValueError("Connection failed for elasticsearch")

# Check whether collection accounts exists in schulcloud db
exists = connection.admin.command('isMaster')['ismaster']
print("Resources in schulcloud_content exists: " + str(exists))

# depending on existence start seeding db or start server
if exists:
	print("Starting the server now")
	subprocess.call(["/usr/src/connector/start-schulcloud-content-mongodb-connector.sh", "start"])
else:
	print("Seeding the Database now")
	subprocess.call(["/usr/src/connector/start-schulcloud-content-mongodb-connector.sh", "seed"])
