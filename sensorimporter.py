#!/usr/bin/env python
# -*- coding: utf-8 -*-

__author__    = 'Christoph Krey <krey.christoph()gmail.com>'
__copyright__ = 'Copyright 2016 Christoph Krey'

import sys
import os
import logging
import time
import datetime
import paho.mqtt.client as paho
import ssl
import json
import socket
import codecs
from tsplit import twosplit
import config
import threading

sys.stdout = codecs.getwriter("utf-8")(sys.__stdout__) 

log = logging.getLogger(__name__)

cf = config.Config(os.getenv('SENSORIMPORTER', 'sensorimporter.conf'))

#########################
# re-publish to mqtt
#########################
def on_connect(mosq, userdata, rc):
    if rc != 0:
        log.error("Can't connect to MQTT. rc=={0}".format(rc))
        sys.exit(1)

    print "connected mqtt"
    log.info("Connected to MQTT broker")

def on_disconnect(mosq, userdata, rc):
    reasons = {
       '0' : 'Connection Accepted',
       '1' : 'Connection Refused: unacceptable protocol version',
       '2' : 'Connection Refused: identifier rejected',
       '3' : 'Connection Refused: server unavailable',
       '4' : 'Connection Refused: bad user name or password',
       '5' : 'Connection Refused: not authorized',
    }
    log.error("Disconnected: code={0} ({1})".format(rc, reasons.get(rc, 'unknown')))

m = cf.config('mqtt')
clientid = m.get('client_id', 'sensorimporter-{0}'.format(os.getpid()))
mqttc = paho.Client(clientid, clean_session=True, userdata=None, protocol=paho.MQTTv311)
mqttc.on_connect = on_connect
mqttc.on_disconnect = on_disconnect

if m.get('username') is not None:
    mqttc.username_pw_set(m.get('username'), m.get('password'))

host = m.get('host', 'localhost')
port = int(m.get('port', 1883))
try:
    print "connecting to %s:%d" % (host, port)
    mqttc.loop_start()
    mqttc.connect(host, port, 60)
except Exception, e:
    sys.exit("Connect to `%s:%d': %s" % (host, port, str(e)))


#########################
# subscribe to relayr
#########################
lut = {}

def load_xlist():
    data = None
    try:
        data = json.loads(open(m['xdklist']).read())
    except Exception, e:
        print str(e)
        sys.exit(1)

    return data

xdksJson= load_xlist()
xdks = xdksJson['XDKs']

def subscriber():
    for xdk in xdks:
        global lut
        xdkdict = xdks[xdk]
        topic = xdkdict['topic']
        lut[xdkdict['deviceId']] = xdk
        (result, mid) = relayr.subscribe(str(topic), 0)
        print "subscribing to %s, %s: r%d,m%d" % (xdk, topic, result, mid)
        new_topic = "%s/%s/%s" % (m.get('prefix'), xdk, 'info')
        new_payload = {'deviceId': xdkdict['deviceId'], 'x': xdkdict['x'], 'y': xdkdict['y'], 'z': xdkdict['z']}
        mqttc.publish(new_topic, json.dumps(new_payload), qos=2, retain=True)
        time.sleep(0.1)
    log.info("Connected to and subscribed to relayr MQTT broker")

def on_relayrconnect(mosq, userdata, rc):
    print "connected relayr"
    if rc != 0:
        log.error("Can't connect to MQTT. rc=={0}".format(rc))
        sys.exit(1)

    subscriberThread = threading.Thread(target=subscriber)
    subscriberThread.start()

def on_relayrsubscribe(client, userdata, mid, granted_qos):
    print "subscribed m=%d %d" % (mid, granted_qos[0])

def on_relayrdisconnect(mosq, userdata, rc):
    reasons = {
       '0' : 'Connection Accepted',
       '1' : 'Connection Refused: unacceptable protocol version',
       '2' : 'Connection Refused: identifier rejected',
       '3' : 'Connection Refused: server unavailable',
       '4' : 'Connection Refused: bad user name or password',
       '5' : 'Connection Refused: not authorized',
    }
    log.error("Disconnected from relayr: code={0} ({1})".format(rc, reasons.get(rc, 'unknown')))
    print "disconnected"

def on_relayrmessage(mosq, userdata, msg):

    print msg.topic + ":" + str(msg.payload)
    try:
        data = json.loads(str(msg.payload))
    except:
        return

    xdk = lut[data['deviceId']]

    new_topic = "%s/%s/%s" % (m.get('prefix'), xdk, 'timestamp')
    new_payload = "%d %d" % (time.time(), data['received'])
    print xdk + " : " + new_topic, " = ", new_payload
    mqttc.publish(new_topic, new_payload, qos=2, retain=True)

    readings = data['readings']
    for reading in readings:
        new_topic = "%s/%s/%s" % (m.get('prefix'), xdk, reading['meaning'])
        new_payload = reading['value']
        print xdk + " : " + new_topic, " = ", new_payload
        mqttc.publish(new_topic, json.dumps(new_payload), qos=2, retain=True)

r = cf.config('relayr')

clientid = r.get('client_id', 'sensorimporter-{0}'.format(os.getpid()))

relayr = paho.Client(clientid, clean_session=True, userdata=None, protocol=paho.MQTTv311)
relayr.on_message = on_relayrmessage
relayr.on_subscribe = on_relayrsubscribe
relayr.on_connect = on_relayrconnect
relayr.on_disconnect = on_relayrdisconnect

if r.get('username') is not None:
    print "pwset %s %s" % (r.get('username'), r.get('password'))
    relayr.username_pw_set(r.get('username'), r.get('password'))

host = r.get('host', 'localhost')
port = int(r.get('port', 1883))
try:
    print "connecting to %s:%d" % (host, port)
    relayr.loop_start()
    relayr.connect(host, port, 60)
except Exception, e:
    sys.exit("Connect to `%s:%d': %s" % (host, port, str(e)))


while True:
    try:
        time.sleep(5)
    except KeyboardInterrupt:
        relayr.disconnect()
        mqttc.disconnect()
        sys.exit(0)
    except:
        raise
