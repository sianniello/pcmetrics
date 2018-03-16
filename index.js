const si = require('systeminformation');
const mqtt = require('mqtt');
const async = require('async');

const readConfig = require('read-config');
const config = readConfig('config.yml');


let client_options = {
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8)
};
let client = mqtt.connect(config.mqtt_broker_url, client_options);


function getMetrics(client) {
    async.parallel({
        // mem: callback => {
        //     si.mem(temp => { callback(null, temp); });
        // },
        system: callback => {
            si.system(sys => { callback(null, sys); });
        },
        user: callback => {
            si.users(usr => { callback(null, usr); });
        },
        networkInterfaces: callback => {
            si.networkInterfaces(net => { callback(null, net); });
        },
        load: callback => {
            si.currentLoad(load => { callback(null, {current_load: Math.round(load.currentload)}); });
        }
    }, (err, data) => {
        client.publish('presence', JSON.stringify(data));
    });
}

client.on('connect', () => {
    console.log("Client ID: " + client_options.clientId);
    client.subscribe('presence');
    setInterval(() => {
        getMetrics(client);
    }, config.interval);
});

client.on('message', (topic, message) => {
    // message is Buffer
    console.log(message.toString());
});