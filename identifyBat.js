const fs = require('fs');
var http = require('http');
var str = '';

(function () {
  const imgBinary = Buffer.from(
    fs.readFileSync(String.raw`images\bat-${process.argv[4]}.jpg`)
  );

  try {
    var request = http.request({
      method: 'POST',
      port: 5000,
      host: `${process.argv[2]}`,
      path: `${process.argv[3]}`,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imgBinary.length,
      },
    });

    request.on('response', function (res) {
      res.on('data', (chunk) => {
        str += chunk;
      });
      res.on('end', () => {
        console.log(str);
      });
    });
    request.write(imgBinary);
    request.end();
  } catch (err) {
    console.error('look an error lol' + err);
  }
  return;
})();

