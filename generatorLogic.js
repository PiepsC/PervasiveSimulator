/*
    The logic behind these functions and objects is as follows:
    Each cell holds their own sensors, while sensors hold only meta data with regard to their own functionality (such as how/what data is collected and what sensor it is).

    The cell receives the output from the sensors to store back into their own object. Consequently cells can assume one of multiple roles based on aforementioned output.
*/

const { StaticPool } = require('node-worker-threads-pool');
const { TaskExecutor } = require('node-worker-threads-pool/dist/taskExecutor');
var util = {
            //Generates an array of grid elements in dictionary format
            grid_generator : function (box, res){
                const dy = Math.abs(box[0] - box[2]); //Difference between bounding box y extremes
                const dx = Math.abs(box[1] - box[3]); //Difference between bounding box x extremes
                const RAD = (15 - res)/1000; //Radius of the circle the hexagon is drawn within
                const HEXMARGIN = 30/180; //Angle between each vertex is 60 deg
                const DEGS = [Math.PI * HEXMARGIN, Math.PI/2, Math.PI * HEXMARGIN * 5, Math.PI * HEXMARGIN * 7, Math.PI * 1.5, Math.PI * HEXMARGIN * 11]
                const HEXWIDTH = Math.abs((Math.cos(DEGS[0]) - Math.cos(DEGS[2])) * RAD);
                const HEXHEIGHT = Math.abs((Math.sin(DEGS[1]) - Math.sin(DEGS[5])) * RAD);
                
                let grid = [];

                for(j = 0; j < Math.ceil(dy/HEXHEIGHT); j++)
                {
                    for(k = 0; k < Math.ceil(dx/HEXWIDTH); k++){
                        let cell = {
                            vertices : [],
                            center : [],
                            sensors : [],
                            radius : RAD, //Radius of the circle for heatmap
                            population : 0, //This is the population as sensors perceived it
                            population_est : 0, //This is the population assigned per area based on distribution
                            bats : 0,
                            average_age : 0,
                            diabetes_cases: 0,
                            cardiovascular_cases: 0,
                            asthmatic_cases: 0,
                            risk: 0, //This is the algorthmicly yielded value
                            buffer : false,
                            highRisk : false,
                            lowRisk : false
                        }
                        let shift = j % 2 == 0 ? HEXWIDTH / 2 : 0;
                        for(i = 0; i < 6; i++){
                            vx = (((RAD + (Math.cos(DEGS[i])) * RAD) + HEXWIDTH * k - shift + HEXHEIGHT/2) * 100)/100;
                            vy = (((RAD + (Math.sin(DEGS[i])) * RAD) - HEXHEIGHT * j + HEXHEIGHT/2) * 100)/100

                            cell.vertices.push((box[0] + vy)); //y origin
                            cell.vertices.push((box[1] + vx)); //x origin
                        }
                        cell.center.push(cell.vertices[2] - HEXHEIGHT/1.5); //y center
                        cell.center.push(cell.vertices[5] + HEXWIDTH/2); //x center
                        grid.push(cell);
                    }
                }
                
                return [grid, (Math.ceil(dy/HEXHEIGHT) * Math.ceil(dx/HEXWIDTH))];
            },
            //Assigns the population estimate for each cell based on the bounding boxes. Returns highest possible value in a cell
            population_per_box : function(grid, areas, total_population, deviation){
                let highest_estimate = 0;
                let area_list = [];
                let complement = 1; //Simply the complement of all areas
                let complement_cells = grid.length; //Cells not in designated areas
                for(var key in areas){
                    complement -= areas[key].intensity;
                    area_list[key] = [];
                };
                if(complement < 0) {return null};

                //First partition each regions cells
                grid.forEach(cell => {
                    for(var key in areas){
                        if(areas[key].outer){
                            if( (cell.center[0] < areas[key].box[2]) ||
                                (cell.center[0] > areas[key].box[0]) ||
                                (cell.center[1] < areas[key].box[1]) ||
                                (cell.center[1] > areas[key].box[3])
                              ) area_list[key].push(cell);
                        } else {
                            if( (cell.center[0] < areas[key].box[0]) &&
                                (cell.center[0] > areas[key].box[2]) &&
                                (cell.center[1] > areas[key].box[1]) &&
                                (cell.center[1] < areas[key].box[3])
                              ) area_list[key].push(cell);
                        }
                    };
                })
                //Then assign each cell in each region their population estimate
                for(var key in area_list){
                    let area_population = total_population * areas[key].intensity;
                    let population_per_cell = area_population / area_list[key].length;
                    complement_cells -= area_list[key].length;
                    highest_estimate = population_per_cell > highest_estimate ? population_per_cell : highest_estimate;
                    area_list[key].forEach(cell => cell.population_est = population_per_cell);
                }

                //Then assign all the remaining cells not in a region their population estimate
                let area_population = total_population * complement;
                let population_per_cell = area_population / complement_cells;
                highest_estimate = population_per_cell > highest_estimate ? population_per_cell : highest_estimate;
                grid.forEach(cell => {
                    if(cell.population_est <= 0) {
                        cell.population_est = population_per_cell;
                    }
                })
                return highest_estimate + (highest_estimate * deviation);
            },
            age_per_box: function(grid, areas, average_age, age_deviation){
                let highest_estimate = average_age + (average_age * age_deviation); 
                grid.forEach(cell => {
                    cell.average_age = average_age + ((average_age * age_deviation) * Math.random()) * (Math.random() > 0.5 ? -1 : 1); //First just assign average value, override when in box
                    for(var key in areas){
                        highest_estimate = average_age * areas[key].intensity + (average_age * areas[key].intensity * age_deviation) > highest_estimate ?
                        average_age * areas[key].intensity + (average_age * areas[key].intensity * age_deviation) : highest_estimate;
                        if(areas[key].outer){
                            if( (cell.center[0] < areas[key].box[2]) ||
                                (cell.center[0] > areas[key].box[0]) ||
                                (cell.center[1] < areas[key].box[1]) ||
                                (cell.center[1] > areas[key].box[3])
                              ) cell.average_age = average_age * areas[key].intensity + ((average_age * areas[key].intensity * age_deviation) * Math.random()) * (Math.random() > 0.5 ? -1 : 1);
                        } else {
                            if( (cell.center[0] < areas[key].box[0]) &&
                                (cell.center[0] > areas[key].box[2]) &&
                                (cell.center[1] > areas[key].box[1]) &&
                                (cell.center[1] < areas[key].box[3])
                              ) cell.average_age = average_age * areas[key].intensity + ((average_age * areas[key].intensity * age_deviation) * Math.random()) * (Math.random() > 0.5 ? -1 : 1);
                        }
                    };
                })
                return highest_estimate;
            },
            //Simply evenly distribute comorbidities over the cells, based on population, returns highest estimates for each
            comorbidities_distributed: function(grid, total_cells, total_population, diabetes, cardiovascular, asthmatic){
                let highest_estimates = {
                    "diabetes" : 0,
                    "cardiovascular" : 0,
                    "asthma" : 0
                };
                let avg_diabetes = diabetes / total_cells;
                let avg_cardioviscular = cardiovascular / total_cells;
                let avg_astmathic = asthmatic / total_cells;
                let avg_population = total_population / total_cells;
                grid.forEach(cell => {
                    cell.diabetes_cases = avg_diabetes * (cell.population_est / avg_population);
                    cell.cardiovascular_cases = avg_cardioviscular * (cell.population_est / avg_population);
                    cell.asthmatic_cases = avg_astmathic * (cell.population_est / avg_population);

                    highest_estimates["diabetes"] = cell.diabetes_cases > highest_estimates["diabetes"] ? cell.diabetes_cases : highest_estimates["diabetes"];
                    highest_estimates["cardiovascular"] = cell.cardiovascular_cases > highest_estimates["cardiovascular"] ? cell.cardiovascular_cases : highest_estimates["cardiovascular"];
                    highest_estimates["asthma"] = cell.asthmatic_cases > highest_estimates["asthma"] ? cell.asthmatic_cases : highest_estimates["asthma"];
                })
                return highest_estimates;
            },
            calculate_risk : function(grid, max_population, max_age, max_comorbidities, coef, bat_bound) {
                //The magic number section, as part of our algorithm:
                let pop_weight = 0.4; //A high population has a large impact on the risk of infection
                let morb_weight = 0.2; //A high comorbidity rate has a relatively low impact on the risk of infection
                let age_weight = 0.4; //An old population has a large impact on the risk of infection, as per covid

                let diabetes_weight = 0.3; //Diabetes has a relatively small impact on getting infected
                let cardio_weight = 0.3; //Cardiovascular conditions have a relatively small impact on getting infected
                let asthma_weight = 0.4; //Asthmatic conditions have a large impact on getting infected

                let poly_a = (x) => {return (coef[0] + coef[1]*x + coef[2]*Math.pow(x, 2) + coef[3]*Math.pow(x, 3) + coef[4]*Math.pow(x, 4))}; //Polynomial activation function for bats

                grid.forEach(cell => {
                    let bat_coef = poly_a(Math.min(cell.bats, bat_bound)); //We don't care from bat_bound onwards, as it's already at its maximum value at that point
                    let pop_factor = cell.population / max_population;
                    let age_factor = cell.average_age / max_age;
                    let morb_factor = (cell.cardiovascular_cases / max_comorbidities["cardiovascular"]) * cardio_weight +
                                      (cell.diabetes_cases / max_comorbidities["diabetes"]) * diabetes_weight +
                                      (cell.asthmatic_cases / max_comorbidities["asthma"]) * asthma_weight;
                    
                    //This yields a factor between 0-1, 1 being APOCALYPTIC risk, while 0 being none (no bats presumably). Risky is around 0.3
                    cell.risk = Math.max(0, (bat_coef * pop_factor * pop_weight) + (bat_coef * age_factor * age_weight) + (bat_coef * morb_factor * morb_weight)); //Floating point errors 
                    if(cell.risk > 0.65)
                        cell.highRisk = true;
                    else if(cell.risk < 0.05)
                        cell.lowRisk = true;
                });

            },
            //Provide grid array, amount of sensors per cell min and max, allowed sensor types
            sensor_randomizer : function(grid, amount_min, amount_max, types, mandatory_types){
                /*    (y,x)
                        ∧     => 1(2,3)
                     /     \  => 0(0,1), 2(4,5)
                    |       |
                     \     /  => 3(6,7), 5(10,11)
                        ∨     => 4(8,9)

                        x+
                        ∧
                        | 
                        |
                        x - - - > y+
                */
                if(mandatory_types.length > amount_min) {console.error("Mandatory sensors exceed minimum sensors per cell!"); return null}
                grid.forEach(cell => {
                    cell.sensors = []; //Flush sensors
                    for(i=0; i < amount_min + Math.round(Math.random() * (amount_max - amount_min)); i++)
                    {
                        let sensor = {
                            type : "none",
                            location : [],
                            radial : false,
                            view_cone : [],
                        }
                        let ymax = cell.vertices[2];
                        let ymin = cell.vertices[8];
                        let xmin = 0, xmax = 0;
                        let dy = (Math.random() * (ymax - ymin)) + ymin;
                        let dx = 0; //Deduce based on hex properties
                        if(dy > cell.vertices[0]){ //if y within the top or bottom quartile
                            let ddx =  cell.vertices[1] - cell.vertices[3]; //length X
                            let ddy = cell.vertices[2] - cell.vertices[0]; //Length Y
                            let rat = (dy - cell.vertices[0]) / ddy;
                            let range = ddx * rat;
                            xmin = cell.vertices[5] + range;
                            xmax = cell.vertices[1] - range;

                        } else if(dy < cell.vertices[6]){
                            let ddx =  cell.vertices[1] - cell.vertices[3]; //length X
                            let ddy = cell.vertices[2] - cell.vertices[0]; //Length Y
                            let rat = (cell.vertices[6] - dy) / ddy;
                            let range = ddx * rat;
                            xmin = cell.vertices[5] + range;
                            xmax = cell.vertices[1] - range;
                        } else {
                            xmin = cell.vertices[5];
                            xmax = cell.vertices[1];
                        }
                        dx = (Math.random() * (xmax - xmin)) + xmin;
                        sensor.type = (i >= mandatory_types.length ? types[Math.floor(Math.random() * types.length)] : mandatory_types[i]); 
                        sensor.location = [dy, dx];
                        cell.sensors.push(sensor);
                    }
                });
            },
            sensor_simulator : function(grid, pop_deviation, anomaly){
                let asyncSensors = [];
                grid.forEach(cell => {
                    cell.sensors.forEach(sensor => {
                        let count_loss = (cell.population_est * 0.7) * Math.random(); //Lose between 0 and 70% of cell count as magic estimate
                        let deviation = (cell.population_est * pop_deviation) * Math.random();
                        deviation = Math.random() > 0.5 ? -deviation : deviation; //Sign toss
                        let suboptimal_loss = 0.8 + (0.4 * Math.random()); //Sensors in suboptimal circumstances, causing up to 20% distortion
                        let batHit = anomaly.includes("tropical") ? Math.random() > 0.65 : Math.random() > 0.8; //20% to detect a bat in non tropical, 35% in tropical areas
                        let batcount = anomaly.includes("tropical") ? Math.random() * 10 : Math.random() * 7; //Up to 8 bats per hit in tropical, 7 for non tropical

                        switch(sensor.type){
                            case "wifi-counting":
                                cell.population += cell.population_est - count_loss + deviation;
                                break;
                            case "thermal-imaging":
                                if(batHit){
                                    if(anomaly.includes("tropical")){ //Suboptimal
                                        cell.bats += batcount * suboptimal_loss;
                                    } else cell.bats += batcount;
                                }
                            break;
                            case "bat-camera":
                                asyncSensors.push(cell); //Delegating to another function
                            break;
                            case "ultrasonic-counting":
                                if(anomaly.includes("noisy")){ //Suboptimal
                                    cell.population += (cell.population_est - count_loss + deviation) * suboptimal_loss;
                                } else cell.population += (cell.population_est - count_loss + deviation);
                            break;
                        }
                    });
                })
                return asyncSensors;
            },
            //Spawns a pool of worker threads to do the image processing in the background
            bat_camera_simulator : async function(batCells, images, anomaly){
                let promisePool = [];
                // let batHits = [];
                let delay = 0;
                let floodPrevention = 80; //To prevent server flooding we insert a delay between packages
                let calculate_promise;
                const filePath = './processImage.js';
                const pool = new StaticPool({
                    size: batCells.length,
                    task: filePath
                });
                
                for(let i = 0; i < batCells.length; i++){
                    promisePool.push(new Promise(resolve => setTimeout(resolve, delay)).then(() => {
                        return pool.exec(images[Math.floor(images.length * Math.random())])
                    }));
                    delay += floodPrevention;
                }
                
                calculate_promise = new Promise((resolve, _) => {
                    Promise.all(promisePool).then((batHits) => {
                    
                    for(let i=0; i < batCells.length; i++){
                        let batcount = anomaly.includes("tropical") ? Math.random() * 9 : Math.random() * 6; //Up to 8 bats per hit in tropical, 5 for non tropical. Slightly altered for the bat cam
                        if(batHits[i]) batCells[i].bats += batcount; 
                        }
                        resolve("Calculation completed");
                    })
                });
                return calculate_promise;
            }
    }

    exports.data = util