# schulcloud-content

This is the content search engine for schul-cloud,
including a database to store the resources.

## APIs

If you start the service, you can use the following APIs:

- [Search API][search-api] at `/v1/search` e.g.
  at http://localhost:4040/v1/search?Q=Funktion
- [Resources API][resources-api] at `/v1/resources/`
  e.g. http://localhost:4040/v1/resources/ids if you set it up locally.

## Get Started

To get started developing the content service, you first need to install docker
and docker-compose.

### Setup under Ubuntu

First, install docker:

    wget -O- https://get.docker.com | sh

After docker is installed, you might want to add yourself to the docker group

    sudo usermod -aG docker $USER

To enable that you do not need `sudo` to urn the docker containers,
log in and out.

Docker runs only single containers. With `docker-compose`,
we can start create and run a whole container network at once.
You can install docker-compose like this:

    sudo apt-get -y install docker-compose

Now, you need to clone this service's repository.
You will need git for that.

    git clone
    cd 

### Run under Ubuntu

You will need to run this command every time you reboot:

    sudo sysctl -w vm.max_map_count=262144

Otherwise, elatisearch will fail.

Once you have setup `docker` and `docker-compose`, you can create the services:

    docker network create schulcloudserver_schulcloud-server-network
    docker-compose create

This creates docker containers which can be started:

    docker-compose start

Now, you should see the containers starting.
You can check their status with `docker-compose ps` which should look like this:

          Name             Command             State              Ports       
    -------------------------------------------------------------------------
    schulcloudconten   /bin/bash bin      Up                 0.0.0.0:9200->92 
    t_schulcloud-      /es-docker                            00/tcp, 9300/tcp 
    content-                                                                  
    elasticsearch_1                                                           
    schulcloudconten   python /usr/src/   Up                                  
    t_schulcloud-      connector/ ...                                         
    content-mongodb-                                                          
    connector_1                                                               
    schulcloudconten   docker-            Up                 0.0.0.0:27018->2 
    t_schulcloud-      entrypoint.sh                         7017/tcp         
    content-           --rep ...                                              
    mongodb_1                                                                 
    schulcloudconten   npm run debug      Up                 0.0.0.0:4040->40 
    t_schulcloud-                                            40/tcp, 0.0.0.0: 
    content_1                                                5858->5858/tcp   

If you see that a service is not `Up` but exited, you can start it again.

    docker-compose start

Sometimes a service turns off.
If it is elastisearch, run this command:

    sudo sysctl -w vm.max_map_count=262144

If after 5 minutes this command is not able to start all services,
this is a bug. [Please report it][new-issue].

Now, you have several ports mapped to your local machine:

- `4040` is the port for the content service.
- `5858` is a debug port for the content service.
- `9200` is the port of elastisearch.
- `27018` is the port of mongodb. Note that this is one port higher than usual. 

## Development

We are developing this server using docker.
Thus, if you make a change, you may need to rebuild your containers.
You can build all of them or a specific one:

    docker-compose stop
    docker-compose build
    docker-compose create
    docker-compose start

If you have a change, please create a pull-request and discuss it in an issue.
We will decide if it is worth sharing.

One service is special, the `schulcloud-content` service.
This one has the local dorectory mapped inside it so if you make changes to
this folder, the changes will automatically go into the running service.
No need to rebuild.

However, if you make a change which is not in the running code, for example you
add a dependency to the `package.json` file, you will need to rebuild it:

    docker-compose stop && \
      docker-compose build schulcloud-content && \
      docker-compose create schulcloud-content && \
      docker-compose restart schulcloud-content

## Example Service Usage

You can use the command `curl` to send requests to the [Resorce API][resources-api]
 of the service:

- `GET http://localhost:4040/v1/resources/ids`  
  To get all resource ids. Command:
  ```
  curl -X GET "http://schulcloud-content-1:content-1@localhost:4040/v1/resources/ids" -H  "accept: application/vnd.api+json"
  ```
- `POST http://localhost:4040/v1/resources`  
  To add a new resource. Command:
  ```
  curl -X POST "http://schulcloud-content-1:content-1@localhost:4040/v1/resources" -H  "accept: application/vnd.api+json" -H  "content-type: application/vnd.api+json" -d "{  \"data\": {    \"type\": \"resource\",    \"attributes\": {      \"title\": \"Example Website\",      \"url\": \"https://example.org\",      \"licenses\": [],      \"mimeType\": \"text/html\",      \"contentCategory\": \"l\",      \"languages\": [        \"en-en\"      ],      \"thumbnail\": \"http://cache.schul-cloud.org/thumbs/k32164876328764872384.jpg\"    },    \"id\": \"cornelsen-physics-1\"  }}"
  ```
- `DELETE http://localhost:4040/v1/resources`  
  To remove all saved resources. Command:
  ```
  curl -X DELETE "http://schulcloud-content-1:content-1@localhost:4040/v1/resources" -H  "accept: application/vnd.api+json"
  ```
- `GET http://localhost:4040/v1/resources/{resourceId}`  
  To get a specific resource. Command:
  ```
  curl -X GET "http://schulcloud-content-1:content-1@localhost:4040/v1/resources/cornelsen-physics-1" -H  "accept: application/vnd.api+json"
  ```
- `DELETE http://localhost:4040/v1/resources/{resourceId}`  
  To delete a specific resource. Command:
  ```
  curl -X DELETE "http://schulcloud-content-1:content-1@localhost:4040/v1/resources/cornelsen-physics-1" -H  "accept: application/vnd.api+json"
  ```

If you like to request a search, you can also use curl to query the
[Search API][search-api]:

```shell
curl -i 'http://localhost:4040/v1/search?Q=einstein'
```

## Testing

The content service serves different contracts:

- The [Search API][search-api]
- The [Resource API][resource-api]

Both of them can be tested.
You can install the Pytnon 3 tests for both of them:

    pip3 install --user schul_cloud_resources_server_tests \
                        schul_cloud_search_tests

Now, you can run the Resource API tests against the running server:

    python3 -m schul_cloud_resources_server_tests.tests     \
            --url=http://localhost:4040/v1/                 \
            --basic=schulcloud-content-1:content-1          \
            --basic=schulcloud-content-2:content-2          \
            --noauth=false

If you like to test step wise, you can increase the step number by
adding `-m step1` to the arguments.

You can run the search tests with this command:

    python3 -m schul_cloud_search_tests.search \
               http://localhost:4040/v1/search \
               --query "Q=einstein"

## Maintainers

These are the maintainer of this repository:

- Alexander Kremer @kremer-io

If you have a question, you can ask them [in an issue][new-issue].

[search-api]: https://github.com/schul-cloud/resources-api-v1#search-api
[resources-api]: https://github.com/schul-cloud/resources-api-v1#resources-api
[new-issue]: https://github.com/schul-cloud/schulcloud-content/issues/new
