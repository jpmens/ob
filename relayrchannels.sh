#!/bin/sh

# list all public devices
#curl --header "Authorization: Bearer $TOKEN" --include 'https://api.relayr.io/devices/public'

DEVICEID='e068da59-a582-4a96-b1ba-1546b61b5eaf'
CHANNELID='0924b765-a0fe-4d9b-ab1e-3fa8ef1c654c'

# get existing data channels for a device
curl --header "Authorization: Bearer $TOKEN" --include "https://api.relayr.io/devices/$DEVICEID/channels"

echo ""

# reequest new data channel
curl --include \
     --request POST \
     --header "Content-Type: application/json" \
     --header "Authorization: Bearer $TOKEN" \
     --data-binary "{
    \"deviceId\" : \"$DEVICEID\",
    \"transport\" : \"mqtt\"
}" \
'https://api.relayr.io/channels'

echo ""

mosquitto_sub -h mqtt.relayr.io -p 1883 -u $RELAYR_USERNAME -P $RELAYR_PASSWORD -t "/v1/$CHANNELID" -v -C 10 -d
