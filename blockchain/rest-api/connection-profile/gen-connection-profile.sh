#!/bin/bash

# REPODIR points to this repo
# LOCALCA points to the location of the TLS cert
REPODIR=~/cloud_computing_final_proj/blockchain
LOCALCA=/home/ec2-user/managedblockchain-tls-chain.pem 

#copy the connection profiles
mkdir -p $REPODIR/tmp/connection-profile/org1
cp $REPODIR/rest-api/connection-profile/connection-profile-template.yaml $REPODIR/tmp/connection-profile/connection-profile.yaml
cp $REPODIR/rest-api/connection-profile/client-org1.yaml $REPODIR/tmp/connection-profile/org1

#update the connection profiles with endpoints and other information
sed -i "s|%PEERNODEID%|$PEERNODEID|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%MEMBERID%|$MEMBERID|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%CAFILE%|$LOCALCA|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINTNOPORT%|$ORDERINGSERVICEENDPOINTNOPORT|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINT%|$PEERSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINTNOPORT%|$PEERSERVICEENDPOINTNOPORT|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%PEEREVENTENDPOINT%|$PEEREVENTENDPOINT|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%CASERVICEENDPOINT%|$CASERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%ADMINUSER%|$ADMINUSER|g" $REPODIR/tmp/connection-profile/connection-profile.yaml
sed -i "s|%ADMINPWD%|$ADMINPWD|g" $REPODIR/tmp/connection-profile/connection-profile.yaml

ls -lR $REPODIR/tmp/connection-profile