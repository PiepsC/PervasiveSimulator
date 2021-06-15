const { app, BrowserWindow, ipcMain } = require("electron");
const utils = require('./generatorLogic.js');
const fs = require('fs');

var grid, sensors, cells, mandatory_sensors, population_per_cell, anomalies;

ipcMain.on('request-renderdata', (event, arg) => {
    console.log("received request for renderdata");
    grid = [];
    fs.readFile('./cityData.json', 'utf-8', (err, data) => {
        if(err) console.error(`Failed to read city data`);
        else {
            let results = [];
            const params = JSON.parse(data); //Returns dictionary structure
            results =  utils.data.grid_generator(params[arg[0]].box, arg[1]);
            grid = results[0];
            cells = results[1];
            population_per_cell = params[arg[0]].population_count/cells;
            console.log(`average ${population_per_cell}`)
            anomalies = params[arg[0]].anomalies;
            mandatory_sensors = params[arg[0]].mandatory_sensors;
            sensors = params[arg[0]].sensors;
            event.reply('request-renderdata-response', grid);
        }
    })
});

ipcMain.on('request-sensors', (event, arg) => {
    console.log("received request");
    utils.data.sensor_randomizer(grid, Number(arg[0]), Number(arg[0]) + Number(arg[1]), sensors, mandatory_sensors);
    console.log("processed grid");
    event.reply('request-sensors-response', grid);
});

ipcMain.on('request-simulate', (event, arg) => {
    utils.data.sensor_simulator(grid, population_per_cell, anomalies);
    event.reply('request-simulate-response', [grid, population_per_cell]);
});


function createWindow() {
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
        darkTheme: true,
        // fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.removeMenu();
    win.loadFile("index.html");
    win.webContents.openDevTools();
}

app.on("ready", createWindow);

// ICU beds, Age, weak people
