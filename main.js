const { app, BrowserWindow, ipcMain } = require("electron");
const utils = require('./gridLogic.js');
const fs = require('fs');

console.log(utils)

ipcMain.on('request-renderdata', (event, arg) => {
    console.log("received request");
    fs.readFile('./cityData.json', 'utf-8', (err, data) => {
        if(err) console.error(`Failed to read city data`);
        else {
            const params = JSON.parse(data); //Returns dictionary structure
            grid =  utils.data.grid_generator(params[arg].box);
            event.reply('request-renderdata-response', grid);
        }
    })
});

function createWindow() {
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
        darkTheme: true,
        fullscreen: true,
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
