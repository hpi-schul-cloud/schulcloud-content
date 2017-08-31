import subprocess
import os
from pymongo import MongoClient
from elasticsearch import Elasticsearch

# Try connecting to MongoDatabase
connection = None
i = 0
while i < 30:
	try:
			connection = MongoClient([os.environ['MONGO_URI']], int(os.environ['MONGO_PORT']))
			print("Successfully connected to mongodb")
			break
	except:
			print("Will retry connecting to mongodb")
	i = i +1

if i == 30:
    raise ValueError("Connection failed")

# Try connecting to ElasticSearch
elasticConnect = Elasticsearch(
	hosts=[{'host': os.environ['ELASTIC_URI'], 'port': int(os.environ['ELASTIC_PORT'])}]
)
i = 0
while i < 30:
    try:
            if not elasticConnect.ping():
                raise ValueError("Connection failed")
            else:
                print("Sucessfully connected to elasticsearch")
                break
    except:
            print("Will retry connecting to elasticsearch")
    i = i +1

if i == 30:
    raise ValueError("Connection failed")

# Check whether collection accounts exists in schulcloud db
db = connection['schulcloud_content']
exists = "resources" in db.collection_names()
print("Resources in schulcloud_content exists: " + str(exists))
# depending on existence start seeding db or start server
if exists:
	print("Starting the server now")
	subprocess.call(["/usr/src/connector/start-schulcloud-content-mongodb-connector.sh", "start"])
else:
	print("Seeding the Database now")
	subprocess.call(["/usr/src/connector/start-schulcloud-content-mongodb-connector.sh", "seed"])
