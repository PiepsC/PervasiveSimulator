const { app, BrowserWindow, ipcMain } = require("electron");
const utils = require('./generatorLogic.js');
const fs = require('fs');

var grid, sensors, cells, mandatory_sensors, population, population_deviation, anomalies, diabetes_cases, cardiovascular_cases, asthmatic_cases, highest_estimate_pop, highest_estimate_age, highest_estimate_comorbidities, coefficients, bat_bound, simDone;

ipcMain.on('request-renderdata', (event, arg) => {
    grid = [];
    simDone = false;
    fs.readFile('./cityData.json', 'utf-8', (err, data) => {
        if(err) console.error(`Failed to read city data`);
        else {
            let results = [];
            const params = JSON.parse(data); //Returns dictionary structure
            results =  utils.data.grid_generator(params[arg[0]].box, arg[1]);
            grid = results[0];
            cells = results[1];

            population = params[arg[0]].population_distribution.total;
            population_deviation = params[arg[0]].population_distribution.deviation;
            population_areas = params[arg[0]].population_distribution.areas;

            age_average = params[arg[0]].age_average.average;
            age_deviation = params[arg[0]].age_average.deviation;
            age_areas = params[arg[0]].age_average.areas;

            diabetes_cases = params[arg[0]].diabetes_total;
            cardiovascular_cases = params[arg[0]].cardiovascular_conditions;
            asthmatic_cases = params[arg[0]].asthmatic_conditions;

            coefficients = params[arg[0]].coefficients;
            bat_bound = params[arg[0]].bat_bound;

            anomalies = params[arg[0]].anomalies;
            mandatory_sensors = params[arg[0]].mandatory_sensors;
            sensors = params[arg[0]].sensors;
            highest_estimate_pop = utils.data.population_per_box(grid, population_areas, population, population_deviation); //This sets the cell estimation PRIOR to sensing
            highest_estimate_age = utils.data.age_per_box(grid, age_areas, age_average, age_deviation);
            highest_estimate_comorbidities = utils.data.comorbidities_distributed(grid, cells, population, diabetes_cases, cardiovascular_cases, asthmatic_cases);
            event.reply('request-renderdata-response', grid);
        }
    })
});

ipcMain.on('request-sensors', (event, arg) => {
    utils.data.sensor_randomizer(grid, Number(arg[0]), Number(arg[0]) + Number(arg[1]), sensors, mandatory_sensors);
    event.reply('request-sensors-response', grid);
});

ipcMain.on('request-simulate', async (event, _) => {
    if(!simDone){
        let bat_cams = [];
        bat_cams = utils.data.sensor_simulator(grid, population_deviation, anomalies);
        //Ugly hardcoded names in the directory below. Kinda ran out of time on this one
        utils.data.bat_camera_simulator(bat_cams, [`./images/bat-1.jpg`, `./images/bat-2.jpg`, `./images/bat-3.jpg`, `./images/nobat-3.jpg`, `./images/nobat-2.jpg`, `./images/nobat-1.jpg`], anomalies).then((msg) => {
            utils.data.calculate_risk(grid, highest_estimate_pop, highest_estimate_age, highest_estimate_comorbidities, coefficients, bat_bound);
            simDone = true;
            event.reply('request-simulate-response', grid);
        });
    }
});


function createWindow() {
    let win = new BrowserWindow({
        width: 1920,
        height: 1080,
        darkTheme: true,
        // fullscreen: true, //Uncomment to start app in borderless full screen (true full screen)
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.removeMenu();
    win.loadFile("index.html");
    // win.webContents.openDevTools(); //Uncomment to open the developer tools
}

app.on("ready", createWindow);
