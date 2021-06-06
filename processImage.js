const child_process = require('child_process');
const fs = require('fs');
const host = `localhost`, path = `/index.php`
var http = require('http');
var FormData = require('form-data');
let bats = 0, nonbats = 0;
let regexx = /(?<nobat>nobat)|(?<bat>bat)/g;

/*Simulating proposed data structure for sensors to evaluate during evolution:
    type: holds the type of the sensor
    ready: flag to set when the data has been updated since the last call
    value: value the sensor produced. This needs to be interpreted by the algorithm based on type
    error: delegates something went wrong. Due to the high quantity nature of the simulation this doesn't need be fatal

    NOTE: this obviously needs a mutex lock in any other language, but luckily for us Node is entirely single threaded!
    Because we await the results of the workers there is no logical race condition.
*/
let sensorData = []
let batSensor = {
    type : "drone_camera",
    ready : false,
    value : 0.5,
    error : false,
};
let batSensor2 = {
    type : "drone_camera",
    ready : false,
    value : 0.5,
    error : false,
};
let batSensor3 = {
    type : "drone_camera",
    ready : false,
    value : 0.5,
    error : false,
};
sensorData.push(batSensor);
sensorData.push(batSensor2);
sensorData.push(batSensor3);

fs.readdir(String.raw`.\images`,
    (err, files) => {
        if(err)
            console.log(err);
        else{
            let results = files.join("").matchAll(regexx);
            for(let res of results){
                if(res.groups.nonbats) nonbats++; else bats++;
            }
            Spawn_workers(sensorData);
        }
    })

function Get_random(nonbat = false){
    return nonbat ? Math.round(Math.random() * nonbats) : Math.round(Math.random() * bats);
}

/*
    Spawns a worker for each individual bat sensor
*/
function Spawn_workers(sensors){
    sensors.forEach((sensor) => {
        console.log(`Spawning for ${sensor["type"]}`);
        var fork = child_process.spawn('node', ['identifyBat.js', host, path, Get_random(Math.random() >= 0.5)]);
        fork.stdout.on('data', (data) => {
            sensor["value"] = data;
            sensor["ready"] = true;
            sensor["error"] = false;
            //TODO: properly format this to work as a 32 bit int
            console.log(data.toString());
        });

        fork.stderr.on('data', (data) => {
            sensor["error"] = true;
        });
    });
}