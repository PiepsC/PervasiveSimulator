const sharp = require('sharp');
var http = require('http');
var str = '';
 
process_image()

async function process_image(){
    let binData = await sharp(String.raw`images\\${process.argv[5]}bat-${process.argv[4]}.jpg`) //Change to forward slash on linux systems
        .raw()
        .toBuffer({ resolveWithObject: false }); //Sharp is brilliant at reformatting the images if necessary
        
        try{
            var request = http.request({
                method: 'POST',
                port: 5000,
                host: `${process.argv[2]}`,
                path: `${process.argv[3]}`,
                headers : {'Content-Type' : 'image/jpeg',
                           'Content-Length': binData.length}
            });

            request.on('response', function(res) {
                res.on('data', (chunk) => {
                    str += chunk;
                })
                res.on('end', () =>{
                    console.log(str)
                })
            });

            request.write(binData);
            request.end()
    } catch(err) {
        console.error("look an error lol" + err);
    }
    return;
}

