To deploy block chain, please follow the installation step in the report or follow

https://github.com/aws-samples/non-profit-blockchain/blob/a72c36e5417fed2a7c5e1cbffef58d00cffc9f85/ngo-fabric/README.md

To run Blockchain rest-api

```bash
cd ./blockchain/rest-api/connection-profile

./gen-connection-profile.sh

cd ./profit-blockchain/tmp/connection-profile/

npm install

cd ./blockchain/ngo-rest-api
node app.js 

```

or follow
https://github.com/aws-samples/non-profit-blockchain/tree/master/ngo-rest-api
