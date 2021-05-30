const { app, BrowserWindow } = require("electron");

function createWindow() {
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
    });

    win.loadFile("index.html");
    win.webContents.openDevTools();
}

app.on("ready", createWindow)