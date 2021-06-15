const { ipcRenderer } = require('electron');


var worldMap = L.map('llmap').setView([51.505, -0.09], 13); //Defaults to London
var token = "pk.eyJ1IjoicGllcHMiLCJhIjoiY2twcnQ5bnR5MDlzdzJwdDhoZncxamN0dSJ9.38K94gD1CUIaICFMZDpRug";
var markerLayer = L.layerGroup().addTo(worldMap);
var gridLayer = L.layerGroup().addTo(worldMap);
var heatLayer = L.layerGroup().addTo(worldMap);
var nodes = [];

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
	attribution: '',
	maxZoom: 18,
	id: 'mapbox/streets-v11',
	tileSize: 512,
	zoomOffset: -1,
	accessToken: token
}).addTo(worldMap);

var overlayMaps = {
    "Sensors": markerLayer,
    "Grid" : gridLayer,
    "Heatmap" : heatLayer
};

L.control.layers(null, overlayMaps).addTo(worldMap);

var sensorIcon = L.icon({
    iconUrl: './images/sensor-icon.png',
    iconSize: [32, 32]
})

function place_sensors(){
    clearSensors();
    ipcRenderer.send('request-sensors', [document.getElementById("minsensors").value, document.getElementById("maxsensors").value]);
}

function generate_heatmap(){
    clearHeatmap();
    ipcRenderer.send('request-simulate', [document.getElementById("minsensors").value, document.getElementById("maxsensors").value]);
}

function clearSensors() {
    markerLayer.clearLayers();
}

function clearHeatmap(){
    heatLayer.clearLayers();
}

function clearGrid(){
    gridLayer.clearLayers();
}

document.getElementById("simstart").onclick = () => {
    place_sensors();
};

document.getElementById("drawgrid").onclick = () => {
    draw_grid_city(document.getElementById("city").value);
};

document.getElementById("evolve").onclick = () => {
    generate_heatmap();
};

function assign_node_stats(grid) {
    for(i=0; i < grid.length; i++){
        nodes[i].bindPopup(`People in this area: ${Math.round(grid[i].population)}\nBats detected here: ${Math.round(grid[i].bats)}`);
    }
}

function draw_grid_city(city){
    clearGrid();
    ipcRenderer.send('request-renderdata', [city, document.getElementById("gridres").value]);
}

ipcRenderer.on('request-renderdata-response', (event, arg) => {
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
        var hex = L.polygon(polys, {fillOpacity: 0.2, color: cell.buffer ? "white" : (cell.highRisk ? "red" : (cell.lowRisk ? "green" : "grey")), strokeOpacity: 0.3}).addTo(gridLayer);
        nodes.push(hex);
    });
    console.log(`logging polys ${polys.length}`)
})

ipcRenderer.on('request-sensors-response', (event, arg) => {
    arg.forEach(cell => {
        cell.sensors.forEach((sensor) => {
            let sensorIco = L.marker(sensor.location, {icon: sensorIcon}).addTo(markerLayer);
            sensorIco.bindPopup(`Sensor type: ${sensor.type}`);
        })
    })
})

ipcRenderer.on('request-simulate-response', (event, arg) => {assign_node_stats(arg[0])})

function onMapClick(e) {
    console.log(`Map coords ${e.latlng}`);
}

worldMap.on('click', onMapClick);