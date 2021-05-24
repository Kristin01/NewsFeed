## Run IoT location generator

```
cd location_generator
node iot_location_generator_nodejs.js \
    mqttDeviceDemo \
    --projectId=keen-philosophy-314419 \
    --cloudRegion=us-central1 \
    --registryId=my-registry \
    --deviceId=my-device \
    --privateKeyFile=rsa_private.pem \
    --serverCertFile=roots.pem \
    --numMessages=2000000 \
    --algorithm=RS256
```