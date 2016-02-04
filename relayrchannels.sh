#!/bin/sh

# list all public devices
#curl --header "Authorization: Bearer $TOKEN" --include 'https://api.relayr.io/devices/public'

DEVICEID='4a392ed2-9304-4583-9ea8-531d4007719f'
CHANNELID='/v1/246b0bb6-7fae-4772-b4f2-80849c7572e9'

USER='91200789-7acc-4b60-855e-79e3b5374150:491385de-e2b2-4ee1-adce-c31df2b6e1db'
PASS='xJoF0MvI6kU-'

# get existing data channels for a device
curl --header "Authorization: Bearer $TOKEN" --include "https://api.relayr.io/devices/$DEVICEID/channels"

echo ""

# reequest new data channel
curl --include \
     --request POST \
     --header "Content-Type: application/json" \
     --header "Authorization: Bearer $RELAYR_TOKEN" \
     --data-binary "{
    \"deviceId\" : \"$DEVICEID\",
    \"transport\" : \"mqtt\"
}" \
'https://api.relayr.io/channels'

echo ""

#mosquitto_sub -h mqtt.relayr.io -p 1883 -u $RELAYR_USERNAME -P $RELAYR_PASSWORD -t "/v1/$CHANNELID" -v -C 10 -d
#mosquitto_sub -h mqtt.relayr.io -p 1883 -u $USER -P $PASS -t "/v1/$CHANNELID" -v -C 10 -d
#mosquitto_pub -h mqtt.relayr.io -p 1883 -u $USER -P $PASS -t "/v1/$CHANNELID" -d -m '{"deviceId":"4a392ed2-9304-4583-9ea8-531d4007719f","readings":[{"meaning":"rawData","value":"{\"success\":true,\"value\":{\"device\":{\"objectType\":\"Analog Value\",\"instanceNumber\":18,\"description\":\"11:Analog Value:18:Open office 1.OG LS 2.2 :Soll_Dimmwert\"},\"valueType\":\"real\",\"value\":\"50\",\"priority\":16,\"identifier\":85,\"plcId\":11}}"}],"received":1454508799408}'
#mosquitto_pub -h mqtt.relayr.io -p 1883 -u $USER -P $PASS -t "/v1/$CHANNELID" -d -m '{"deviceId":"4a392ed2-9304-4583-9ea8-531d4007719f","readings":[{"meaning":"rawData","value":"{\"success\":true,\"value\":{\"device\":{\"objectType\":\"Analog Value\",\"instanceNumber\":18,\"description\":\"11:Analog Value:18:Open office 1.OG LS 2.2 :Soll_Dimmwert\"},\"valueType\":\"real\",\"value\":\"50\",\"priority\":16,\"identifier\":85,\"plcId\":11}}"}],"received":1454508799408}'
mosquitto_pub -h mqtt.relayr.io -p 1883 -u $RELAYER_USERNAME -P $RELAYER_PASSWORD -t "/v1/$CHANNELID" -d -m '{"path" : "led", "command" : "red", "value" : "2"}'
