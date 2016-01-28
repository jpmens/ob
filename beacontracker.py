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
import math
import numpy

mapfactor = 2

sys.stdout = codecs.getwriter("utf-8")(sys.__stdout__) 

log = logging.getLogger(__name__)

cf = config.Config(os.getenv('BEACONTRACKER', 'beacontracker.conf'))
mqttConf = cf.config('mqtt')
base_topics = list(mqttConf['base_topics'])

#closestBeacons stores the closest beacon for each device. key is the device's base topic, value is {'uuid': '', 'major': 0, 'minor': 0, 'rssi': -99, 'prox': 9, 'acc': 99}
closestBeacons = {}

# read!
#
# http://gis.stackexchange.com/questions/66/trilateration-using-3-latitude-and-longitude-points-and-3-distances
#
# http://techblog.rga.com/determining-indoor-position-using-ibeacon/
# http://gis.stackexchange.com/questions/40660/trilateration-algorithm-for-n-amount-of-points
# http://de.slideshare.net/simonguest/indoor-location-in-mobile-applications-using-i-beacons
# http://www.warski.org/blog/2014/04/inverse-beacon-positioning/
#
#devices store information about all devices. key is the device's base topic. value is 
#{
#   "tid": "TI",
#   "visibleBeacons": {
#       "7777772E-626C-756B-6969-2E636F6D0001:1:1" :{
#           "uuid": "7777772E-626C-756B-6969-2E636F6D0001",
#           "major": 1,
#           "minor": 1,
#           measurements: [
#               {"tst": 1453924013: "acc":7,"rssi":-80,"prox":},
#               {"tst": 1453924014: "acc":6,"rssi":-80,"prox":}
#           ]
#       },
#       "7777772E-626C-756B-6969-2E636F6D0001:1:2" : {
#           "uuid": "7777772E-626C-756B-6969-2E636F6D0001",
#           "major": 1,
#           "minor": 2,
#           measurements: [
#               {"tst": 1453924013: "acc":7,"rssi":-80,"prox":},
#               {"tst": 1453924013: "acc":7,"rssi":-80,"prox":},
#               {"tst": 1453924013: "acc":7,"rssi":-80,"prox":},
#               {"tst": 1453924014: "acc":6,"rssi":-80,"prox":}
#           ]
#       }
#   }
#}
devices = {}

def trilateration(xA, yA, DistA, xB, yB, DistB, xC, yC, DistC):
    P1 = numpy.array([xA, yA, 0])
    P2 = numpy.array([xB, yB, 0])
    P3 = numpy.array([xC, yC, 0])

    ex = (P2 - P1)/(numpy.linalg.norm(P2 - P1))
    i = numpy.dot(ex, P3 - P1)
    ey = (P3 - P1 - i*ex)/(numpy.linalg.norm(P3 - P1 - i*ex))
    ez = numpy.cross(ex,ey)
    d = numpy.linalg.norm(P2 - P1)
    j = numpy.dot(ey, P3 - P1)

    x = (pow(DistA,2) - pow(DistB,2) + pow(d,2))/(2*d)
    y = ((pow(DistA,2) - pow(DistC,2) + pow(i,2) + pow(j,2))/(2*j)) - ((i/j)*x)

    z = numpy.sqrt(pow(DistA,2) - pow(x,2) - pow(y,2))

    triPt = P1 + x*ex + y*ey + z*ez

    return (triPt[0], triPt[1]);

def load_blist():
    data = None
    try:
        data = json.loads(open(mqttConf['beaconlist']).read())
    except Exception, e:
        print str(e)
        sys.exit(1)

    return data


def find_beacon(uuid, major, minor):
    for b in blist:
            if uuid == b[0] and major == b[1] and minor == b[2]:
                return b
    return None

def on_connect(mosq, userdata, rc):
    if rc != 0:
        print ("Can't connect to MQTT. rc=={0}".format(rc))
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

    print msg.payload

    base_topic, suffix = twosplit(msg.topic)
    
    try:
        data = json.loads(str(msg.payload))
    except:
        return

    if '_type' not in data or data['_type'] != 'transition':
        print "-- not a transition payload"
        return

    if data['_type'] != 'leave':
        print "-- not leaving"
        return

    if 't' not in data or data['t'] != 'b':
        print "-- not a 't:b' payload"
        return

    # User is leaving a beacon; any beacon. Clear out the retained
    # lamp position for this

    # clear closestBeacon entry when leaving region
    if base_topic in closestBeacons:
        del closestBeacons[base_topic];
    featured_topic = "%s/%s" % (base_topic, 'cmd')
    payload = {'_type': 'cmd', 'action': 'action'}
    featured_payload = json.dumps(payload)
    mqttc.publish(featured_topic, featured_payload, qos=2, retain=False)

    # clear device entry when leaving region
    if base_topic in devices:
        del devices[base_topic];
    locationTopic = "%s/%s" % (mqttConf.get('prefix'), base_topic)
    locationDict = {'tid': data['tid'], 'y': 0, 'y': 0}
    locationPayload = json.dumps(locationDict)
    mqttc.publish(locationTopic, locationPayload, qos=2, retain=False)
    print locationTopic + ": " + locationPayload
    mqttc.publish(locationTopic, locationPayload, qos=2, retain=False)

def on_beacon(mosq, userdata, msg):
    if msg.retain == 1 or len(msg.payload) == 0:
        return

    data = None

    base_topic, suffix = twosplit(msg.topic)

    try:
        data = json.loads(str(msg.payload))
    except:
        return

    if '_type' not in data or data['_type'] != 'beacon':
        print "-- not a beacon payload"
        return

    uuid    = data.get("uuid", '12345678-ABCD-EF01-2345-000000000001')
    major   = data.get("major", 0)
    minor   = data.get("minor", 0)
    acc     = data.get("acc", 99)
    prox    = data.get("prox", 9)
    rssi    = data.get("rssi", -99)
    tst     = data.get("tst", 0)
    tid     = data.get("tid", 0)

    print tid, tst, uuid, major, minor, acc, prox, rssi

    if base_topic in closestBeacons:
        me = closestBeacons[base_topic]
    else:
        me = {'uuid': '', 'major': 0, 'minor': 0, 'rssi': -99, 'prox': 9, 'acc': 99}
    if prox < me['prox'] or (me['uuid'] == uuid and me['major'] == major and me['minor'] == minor):
        me['uuid'] = uuid
        me['major'] = major
        me['minor'] = minor
        me['acc'] = acc
        me['prox'] = prox
        me['rssi'] = rssi
        featured_topic = "%s/%s" % (base_topic, 'cmd')

        content = "no matching beacon found\n%s:%d:%d" % (uuid, major, minor)
        b = find_beacon(uuid, major, minor)
        if b != None:
                content = "%s\n\n%s" % (b[3], b[4])

        payload = {'_type': 'cmd', 'action': 'action', 'content' : content }
        featured_payload = json.dumps(payload)
        mqttc.publish(featured_topic, featured_payload, qos=2, retain=False)
        closestBeacons[base_topic] = me

    # get device
    if base_topic in devices:
        device = devices[base_topic]
    else:
        device = {'tid': tid, 'visibleBeacons': {} }
    #print device

    # get beacon
    beaconString = "%s:%d:%d" % (uuid, major, minor)
    visibleBeacons = device['visibleBeacons']
    if beaconString in visibleBeacons:
        beacon = visibleBeacons[beaconString]
    else:
        beacon = {'uuid': uuid, 'major': major, 'minor': minor, 'measurements': []} 
    #print beacon

    # measurement keep up to 5 past measurements
    measurements = beacon['measurements']
    measurement = {'prox': prox, 'rssi': rssi, 'acc': acc, 'tst': tst}
    measurements.append(measurement)
    if len(measurements) > 5:
        del(measurements[0])

    # store
    beacon['measurements'] = measurements
    visibleBeacons[beaconString] = beacon
    device['visibleBeacons'] = visibleBeacons
    devices[base_topic] = device
    #print devices

    if len(visibleBeacons) < 3:
        return

    # get 3 closest visible beacons
    m3 = []
    for visibleBeaconString in visibleBeacons:
        visibleBeacon = visibleBeacons[visibleBeaconString]
        #print visibleBeacon

        # get average of last measurements
        measurements = visibleBeacon['measurements']
        n = 0
        total = 0
        for measurement in measurements:
            n = n + 1
            total = total + measurement['acc']
        mid = total / n

        # select 3 closest beacons
        i = 0;
        while i < len(m3):
            if mid < m3[i]['r']:
                break
            i = i + 1
        beacon = find_beacon(visibleBeacon['uuid'], visibleBeacon['major'], visibleBeacon['minor'])
        if beacon != None:
            m = {}
            m['x'] = beacon[5] / mapfactor
            m['y'] = beacon[6] / mapfactor
            m['r'] = mid
            m3.insert(i, m)
            #print "m3"
            print m3

    x = 0;
    y = 0;
    if len(m3) >= 3:
        locationTopic = "%s/%s" % (mqttConf.get('prefix'), base_topic)
        (x, y) =  trilateration(
            m3[0]['x'],
            m3[0]['y'],
            m3[0]['r'],
            m3[1]['x'],
            m3[1]['y'],
            m3[1]['r'],
            m3[2]['x'],
            m3[2]['y'],
            m3[2]['r']
        )
    if numpy.isnan(x) or numpy.isnan(y):
        x = 0;
        y = 0;

    locationDict = {'tid': tid, 'x': x * mapfactor, 'y': y * mapfactor}
    locationPayload = json.dumps(locationDict)
    print locationTopic + ": " + locationPayload
    mqttc.publish(locationTopic, locationPayload, qos=2, retain=False)
    return

blist = load_blist() 
clientid = mqttConf.get('client_id', 'beacontracker-{0}'.format(os.getpid()))
mqttc = paho.Client(clientid, clean_session=True, userdata=None, protocol=paho.MQTTv31)
mqttc.on_message = on_message
mqttc.on_connect = on_connect
mqttc.on_disconnect = on_disconnect

if mqttConf.get('username') is not None:
    mqttc.username_pw_set(mqttConf.get('username'), mqttConf.get('password'))

host = mqttConf.get('host', 'localhost')
port = int(mqttConf.get('port', 1883))
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
