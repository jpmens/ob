#!/usr/bin/env python
# -*- coding: utf-8 -*-

__author__    = 'Jan-Piet Mens <jpmens()gmail.com>'
__copyright__ = 'Copyright 2016 Jan-Piet Mens'

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

sys.stdout = codecs.getwriter("utf-8")(sys.__stdout__) 

log = logging.getLogger(__name__)

cf = config.Config(os.getenv('BEACONTRACKER', 'beacontracker.conf'))
m = cf.config('mqtt')
base_topics = list(m['base_topics'])


def load_blist():
    data = None
    try:
        data = json.loads(open(m['beaconlist']).read())
    except Exception, e:
        print str(e)
        sys.exit(1)

    return data

def on_connect(mosq, userdata, rc):
    if rc != 0:
        log.error("Can't connect to MQTT. rc=={0}".format(rc))
        sys.exit(1)

    for t in base_topics:
        mqttc.subscribe("%s/+" % t, 0)
        mqttc.subscribe("%s/+/event" % t, 0)
        mqttc.subscribe("%s/+/beacon" % t, 0)

    log.info("Connected to and subscribed to MQTT broker")

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

def device_name(topic, subtopic=None):
    ''' find base topic name from topic and subtopic. E.g. if
        topic == 'owntracks/gw/JP/start' and subtopic == '/start'
        return 'owntracks/gw/JP'
        '''

    base_topic, suffix = tsplit(topic)
    return base_topic


def on_message(mosq, userdata, msg):
    if msg.retain == 1:
        return

    print "Normal message"

def on_transition(mosq, userdata, msg):
    if msg.retain == 1:
        return

    print "TRANSITION"

    print msg.payload

    base_topic, suffix = twosplit(msg.topic)
    new_topic = "%s/%s" % (m.get('prefix'), base_topic)
    print "new = ", new_topic
    
    try:
        data = json.loads(str(msg.payload))
    except:
        return

    if '_type' not in data or data['_type'] != 'transition':
        print "-- not a transition payload"
        return

    if 't' not in data or data['t'] != 'b':
        print "-- not a 't:b' payload"
        return

    # User is leaving a beacon; any beacon. Clear out the retained
    # lamp position for this

    mqttc.publish(new_topic, None, qos=2, retain=False)

def on_beacon(mosq, userdata, msg):
    if msg.retain == 1 or len(msg.payload) == 0:
        return

    print "BEACON"

    data = None

    base_topic, suffix = twosplit(msg.topic)
    new_topic = "%s/%s" % (m.get('prefix'), base_topic)
    print "new = ", new_topic
    
    try:
        data = json.loads(str(msg.payload))
    except:
        return

    if '_type' not in data or data['_type'] != 'beacon':
        print "-- not a beacon payload"
        return

    major   = data.get("major", 0)
    minor   = data.get("minor", 0)
    acc     = data.get("acc", 99)

    print major, minor, acc

    for b in blist:
        if major == b[0] and minor == b[1]:
            print b[2]
            payload = json.dumps(b[2])
            mqttc.publish(new_topic, payload, qos=2, retain=False)
            

    return

blist = load_blist() 

clientid = m.get('client_id', 'beacontracker-{0}'.format(os.getpid()))
mqttc = paho.Client(clientid, clean_session=True, userdata=None, protocol=paho.MQTTv31)
mqttc.on_message = on_message
mqttc.on_connect = on_connect
mqttc.on_disconnect = on_disconnect

if m.get('username') is not None:
    mqttc.username_pw_set(m.get('username'), m.get('password'))

host = m.get('host', 'localhost')
port = int(m.get('port', 1883))
try:
    mqttc.connect(host, port, 60)
except Exception, e:
    sys.exit("Connect to `%s:%d': %s" % (host, port, str(e)))

for t in base_topics:
    mqttc.message_callback_add("{0}/+/beacon".format(t), on_beacon)
    mqttc.message_callback_add("{0}/+/event".format(t), on_transition)

while True:
    try:
        mqttc.loop_forever()
    except socket.error:
        time.sleep(5)
    except KeyboardInterrupt:
        mqttc.disconnect()
        sys.exit(0)
    except:
        raise
