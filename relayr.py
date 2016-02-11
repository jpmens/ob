#!/usr/bin/env python

import requests
import json
import time

TOKEN=''
DEVICEID=''

for bright in [2, 2, 2, 2, 2, 2, 2]:
        
    data = {
       'path':        'led',
       'command':     'red',
       'value':       str(bright),
       }
    payload = json.dumps(data)
    headers = {
        'Content-Type':     'application/json',
        'Authorization':    "Bearer %s" % TOKEN,
    }
    r = requests.post("https://api.relayr.io/devices/%s/cmd" % DEVICEID, data=payload, headers=headers)

    print r
    print(r.text)

    time.sleep(1)

