        var util = {
            //Generates an array of grid elements in dictionary format
            grid_generator : function (box){
                const dy = Math.abs(box[0] - box[2]); //Difference between bounding box y extremes
                const dx = Math.abs(box[1] - box[3]); //Difference between bounding box x extremes
                const RAD = 10/1000; //Radius of the circle the hexagon is drawn within
                const HEXMARGIN = 30/180; //Angle between each vertex is 60 deg
                const DEGS = [Math.PI * HEXMARGIN, Math.PI/2, Math.PI * HEXMARGIN * 5, Math.PI * HEXMARGIN * 7, Math.PI * 1.5, Math.PI * HEXMARGIN * 11]
                const TOPMARGIN = Math.floor(RAD - Math.sin(DEGS[0]) * RAD); //Empty space at top margin
                const HEXWIDTH = Math.abs((Math.cos(DEGS[0]) - Math.cos(DEGS[2])) * RAD).toPrecision(6);
                const HEXHEIGHT = Math.abs((Math.sin(DEGS[1]) - Math.sin(DEGS[5])) * RAD).toPrecision(6);
                
                let grid = [];

                for(j = 0; j < Math.ceil(dy/HEXHEIGHT); j++)
                {
                    for(k = 0; k < Math.ceil(dx/HEXWIDTH); k++){
                        let cell = {
                            vertices : [],
                            buffer : false,
                            highRisk : false,
                            lowRisk : false
                        }
                        let shift = j % 2 == 0 ? HEXWIDTH / 2 : 0;
                        for(i = 0; i < 6; i++){
                            vx = (((RAD + (Math.cos(DEGS[i])) * RAD) + HEXWIDTH * k - shift + HEXHEIGHT/2) * 100)/100;
                            vy = (((RAD + (Math.sin(DEGS[i])) * RAD) - HEXHEIGHT * j + HEXHEIGHT/2) * 100)/100

                            cell.vertices.push((box[0] + vy).toPrecision(6)); //y origin
                            cell.vertices.push((box[1] + vx).toPrecision(6)); //x origin
                        }
                        grid.push(cell);
                    }
                }
                
                return grid;
            },
    }

    exports.data = util