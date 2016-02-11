#!/bin/sh

# list all public devices
#curl --header "Authorization: Bearer $TOKEN" --include 'https://api.relayr.io/devices/public'

#"https://api.relayr.io/devices//cmd"


CHANNELID=''

USER=''
PASS=''

# get existing data channels for a device
#curl --header "Authorization: Bearer $TOKEN" --include "https://api.relayr.io/devices/$DEVICEIDd0cce44a912c/channels"

#echo ""

TOKEN=''
DEVICEID=''
for bright in 2 2 2 2 2 2 2 2 2 2 2 
# set led
do echo "trying " $TOKEN
curl --include \
     --request POST \
     --header "Content-Type: application/json" \
     --header "Authorization: Bearer $TOKEN" \
     --data-binary "{
    \"path\" : \"led\",
    \"command\" : \"red\",
    \"value\" : \"$bright\"
}" \
"https://api.relayr.io/devices/$DEVICEID/cmd"
sleep 1
done

exit 0


#echo ""

# request new data channel
#curl --include \
#     --request POST \
#     --header "Content-Type: application/json" \
#     --header "Authorization: Bearer $TOKEN" \
#     --data-binary "{
#    \"deviceId\" : \"$DEVICEID\",
#    \"transport\" : \"mqtt\"
#}" \
#'https://api.relayr.io/channels'

#echo ""

#mosquitto_sub -h mqtt.relayr.io -p 1883 -u $USER -P $PASS -t "/v1/$CHANNELID" -v -C 10 -d
