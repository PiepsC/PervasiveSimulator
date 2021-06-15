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
                            sensors : [],
                            population: 0,
                            bats : 0,
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
                        grid.push(cell);
                    }
                }
                
                return [grid, (Math.ceil(dy/HEXHEIGHT) * Math.ceil(dx/HEXWIDTH))];
            },
            //Provide grid array, amount of sensors per cell min and max, allowed sensor types
            sensor_randomizer : function(grid, amount_min, amount_max, types, mandatory_types){
                /*    (y,x)
                        ∧     => 1(2,3)
                     /     \  => 0(0,1), 2(4,5)
                    |       |
                     \     /  => 3(6,7), 5(10,11)
                        ∨     => 4(8,9)
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
                            parent : null
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
                        sensor.parent = cell;
                        cell.sensors.push(sensor);
                    }
                });
            },
            sensor_simulator : function(grid, population, anomaly){
                console.log(`Population per cell ${population}`);
                grid.forEach(cell => {
                    cell.sensors.forEach(sensor => {
                        let count_loss = (population * 0.7) * Math.random(); //Lose between 0 and 70% of cell count as magic estimate
                        let deviation = (population * 0.3) * Math.random();
                        deviation = Math.random() > 0.5 ? -deviation : deviation; //Sign toss
                        let suboptimal_loss = 0.8 + (0.4 * Math.random()); //Sensors in suboptimal circumstances
                        let batHit = anomaly.includes("tropical") ? Math.random() > 0.8 : Math.random() > 0.9; //10% to detect a bat in non tropical, 20% in tropical areas
                        let batcount = anomaly.includes("tropical") ? Math.random() * 7 : Math.random() * 3; //Up to 7 bats per hit in tropical, 3 for non tropical

                        switch(sensor.type){
                            case "wifi-counting":
                                cell.population += population - count_loss + deviation;
                            break;
                            case "thermal-imaging":
                                if(batHit){
                                    if(anomaly.includes("tropical")){ //Suboptimal
                                        cell.bats += batcount * suboptimal_loss;
                                    } else cell.bats += batcount;
                                }
                            break;
                            case "bat-camera":
                                //TODO: integrate with backend
                            break;
                            case "ultrasonic-counting":
                                if(anomaly.includes("noisy")){ //Suboptimal
                                    cell.population += (population - count_loss + deviation) * suboptimal_loss;
                                } else cell.population += population - count_loss + deviation;
                            break;
                        }
                    });
                })
            }
    }

    exports.data = util