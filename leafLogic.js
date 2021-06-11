const { ipcRenderer } = require('electron');

var mymap = L.map('llmap').setView([51.505, -0.09], 13); //Defaults to London
var token = "pk.eyJ1IjoicGllcHMiLCJhIjoiY2twcnQ5bnR5MDlzdzJwdDhoZncxamN0dSJ9.38K94gD1CUIaICFMZDpRug";

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
	attribution: '',
	maxZoom: 18,
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1,
	accessToken: token
}).addTo(mymap);

console.log("Now sending");
ipcRenderer.send('request-renderdata', 'london');

ipcRenderer.on('request-renderdata-response', (event, arg) => {
  console.log("response received")
  arg.forEach(cell => {
      polys = [];
      vert = [];
	  cell.vertices.forEach(point => {
        vert.push(point);
        if(vert.length == 2){
            polys.push(vert)
            vert = []
        }
      })
      var grid = L.polygon(polys, {fillOpacity: 0.2, color: cell.buffer ? "white" : (cell.highRisk ? "red" : (cell.lowRisk ? "green" : "grey")), strokeOpacity: 0.3}).addTo(mymap);
  });
  console.log(`logging polys ${polys}`)
})

function onMapClick(e) {
    console.log(`Map coords ${e.latlng}`);
}

mymap.on('click', onMapClick);
// ipcRenderer.send('asynchronous-message', 'ping')