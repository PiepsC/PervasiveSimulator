const { ipcRenderer } = require('electron');


var worldMap = L.map('llmap').setView([51.505, -0.09], 13); //Defaults to London
var token = "pk.eyJ1IjoicGllcHMiLCJhIjoiY2twcnQ5bnR5MDlzdzJwdDhoZncxamN0dSJ9.38K94gD1CUIaICFMZDpRug";
var markerLayer = L.layerGroup().addTo(worldMap);
var gridLayer = L.layerGroup().addTo(worldMap);
var heatLayer = L.layerGroup().addTo(worldMap);
var nodes = [];

// L.heatLayer([[51.505, -0.09, 0.8]], {radius: 50, minOpacity: 0.3}).addTo(heatLayer);

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
    clearHeatmap();
    let heatlist = [];
    for(i=0; i < grid.length; i++){
        nodes[i].setStyle({fillOpacity: 0.0, color: !(grid[i].highRisk || grid[i].lowRisk) ? "grey" : (grid[i].highRisk ? "red" : (grid[i].lowRisk ? "green" : "grey")), strokeOpacity: 0.3});
        nodes[i].bindPopup(
        `People: ${Math.round(grid[i].population)}
        Bats: ${Math.round(grid[i].bats)}
        Age: ${Math.round(grid[i].average_age)}
        Diabetics: ${Math.round(grid[i].diabetes_cases)}
        Cardiovascular: ${Math.round(grid[i].cardiovascular_cases)}
        Asthmatic: ${Math.round(grid[i].asthmatic_cases)}
        Risk: ${grid[i].risk}`);
        heatlist.push([grid[i].center[0], grid[i].center[1], grid[i].risk]);
    }
    L.heatLayer(heatlist, {radius: 50, maxZoom: 12, gradient: {0.2 : 'green', 0.3 : 'yellow', 0.4 : 'orange', 0.7 : 'red', 0.8 : 'red'}}).addTo(heatLayer);
}

function draw_grid_city(city){
    clearGrid();
    ipcRenderer.send('request-renderdata', [city, document.getElementById("gridres").value]);
}

ipcRenderer.on('request-renderdata-response', (event, arg) => {
    nodes = [];
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
        var hex = L.polygon(polys, {fillOpacity: 0.0, color: cell.buffer ? "white" : (cell.highRisk ? "red" : (cell.lowRisk ? "green" : "grey")), strokeOpacity: 0.3}).addTo(gridLayer);
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

ipcRenderer.on('request-simulate-response', (event, arg) => {assign_node_stats(arg)})

function onMapClick(e) {
    console.log(`Map coords ${e.latlng}`);
}

worldMap.on('click', onMapClick);