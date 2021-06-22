const { parentPort } = require('worker_threads');
const host = `130.89.83.158`, path = `/json`; //Add backend IP and routing path here
const fs = require('fs');
var http = require('http'); 

//This file is being spawned as a worker thread
parentPort.on('message', (param) => {
    let binData = Buffer.from(fs.readFileSync(param)); 
    let response = null;
    let payload = '';
    try{
        var request = http.request({
            method: 'POST',
            port: 5000,
            host: host,
            path: path,
            headers : {'Content-Type' : 'image/jpeg',
                       'Content-Length': binData.length}
        });

        request.on('response', function(res) {
            res.on('data', (chunk) => {
                payload += chunk;
            })
            res.on('end', () =>{
                response = JSON.parse(payload).BAT;
                console.log(`Received value: ${response}`);
                parentPort.postMessage(response);
            })
        });
        request.write(binData);
        request.end()
    } catch(err) {
        console.error("Error processing binary data:" + err);
    }
})