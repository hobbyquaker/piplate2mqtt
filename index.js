#!/usr/bin/env node

var pkg =       require('./package.json');
var log =       require('yalm');
var config =    require('./config.js');
var Mqtt =      require('mqtt');
var LCDPLATE =  require('adafruit-i2c-lcd').plate;
var lcd =       new LCDPLATE(1, 0x20);

var mqttConnected;

log.setLevel(config.verbosity);

log.info(pkg.name + ' ' + pkg.version + ' starting');
log.info('mqtt trying to connect', config.url);

var mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0', retain: true}});

mqtt.on('connect', function () {
    mqttConnected = true;

    log.info('mqtt connected', config.url);
    mqtt.publish(config.name + '/connected', '1', {retain: true}); // TODO eventually set to '2' if target system already connected

    log.info('mqtt subscribe', config.name + '/set/#');
    mqtt.subscribe(config.name + '/set/#');

});

mqtt.on('close', function () {
    if (mqttConnected) {
        mqttConnected = false;
        log.info('mqtt closed ' + config.url);
    }

});

mqtt.on('error', function (err) {
    log.error('mqtt', err);

});

mqtt.on('message', function (topic, payload) {
    payload = payload.toString();
    log.debug('mqtt <', topic, payload);
    var parts = topic.split('/');
    switch (parts[2]) {
        case "color":
            lcd.backlight(lcd.colors[payload]);
            break;
        case "text":
            lcd.message(payload.replace('\\n', '\n'), true);
            break;
    }

});

lcd.on('button_down', function (button) {
    log.debug('mqtt >', config.name + '/status/' + button);
    mqtt.publish(config.name + '/status/' + button, '');
});