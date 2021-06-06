const sharp = require('sharp');
var FormData = require('form-data');
var http = require('http');
var str = '';

process_image()

async function process_image(){
    let binData = await sharp(String.raw`images\bat-${process.argv[4]}.jpg`) //Change to forward slash on linux systems
        .raw()
        .toBuffer({ resolveWithObject: false }); //Sharp is brilliant at reformatting the images if necessary
        
    let fd = new FormData();
    var request = http.request({
        method: 'post',
        host: `${process.argv[2]}`,
        path: `${process.argv[3]}`,
        headers: fd.getHeaders()
    });

    try{
        fd.append("file", binData)
        fd.pipe(request); //"Pipe" the request; now awaiting events from the handler
        //TODO: actually parse the json here instead of just receiving the response string
        request.on('response', function(res) {
        res.on('data', (chunk) => {
            str += chunk;
        })
        res.on('end', () =>{
            console.log(str)
        })
        });
    } catch(err) {
        console.error(err);
    }
    return;
}

//console.log("Child Process " + process.argv[2] + " executed." );

