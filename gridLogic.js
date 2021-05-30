const RAD = 25; //Radius of the circle the hexagon is drawn within
const HEXMARGIN = 30/180; //Angle between each vertex is 60 deg
const DEGS = [Math.PI * HEXMARGIN, Math.PI/2, Math.PI * HEXMARGIN * 5, Math.PI * HEXMARGIN * 7, Math.PI * 1.5, Math.PI * HEXMARGIN * 11]
const TOPMARGIN = Math.floor(RAD - Math.sin(DEGS[0]) * RAD); //Empty space at top margin
const HEXWIDTH = Math.abs(Math.floor((Math.cos(DEGS[0]) - Math.cos(DEGS[2])) * RAD));
const HEXHEIGHT = RAD * 2 - TOPMARGIN;

var grid = document.getElementById("grid");
var polylist = []
var points = "";
var screenWidth = screen.width; //Change these to image resolution
var screenHeight = screen.height;

for(j = 0; j < Math.ceil(screenHeight/HEXHEIGHT); j++)
{
    for(k = 0; k < Math.ceil(screenWidth/HEXWIDTH); k++){
        points = "";
        var shift = j % 2 == 0 ? HEXWIDTH / 2 : 0;
        for(i = 0; i < 6; i++){
            var point = Math.floor(((RAD + (Math.cos(DEGS[i])) * RAD) + HEXWIDTH * k - shift + HEXHEIGHT/2) * 100)/100
            + ',' + 
            Math.floor(((RAD + (Math.sin(DEGS[i])) * RAD) - TOPMARGIN + HEXHEIGHT * j + HEXHEIGHT/2) * 100)/100 + (i < 5 ? ' ' : '');
            points += point;
        }
        polylist.push(points);
    }
}
var mask = document.getElementById("maskRect");
document.documentElement.style.setProperty('--maskWidth', screenWidth);
document.documentElement.style.setProperty('--maskHeight', screenHeight);

var canvas = document.getElementById("svgcontainer");
canvas.setAttribute("width", screenWidth);
canvas.setAttribute("height", screenHeight);
for(i = 0; i < polylist.length; i++){
    var polys = document.createElementNS("http://www.w3.org/2000/svg", 'polygon');
    polys.setAttribute("points", polylist[i]);
    canvas.appendChild(polys);
}
grid.appendChild(canvas);


// var hexthick = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--thick'), 10);
// for(i=Math.ceil(screenHeight/HEXHEIGHT); i > 0; i--){
//     var row = document.createElement('div');
//     row.classList.add("row");
//     for(j=Math.floor(screenWidth/HEXWIDTH) - 1; j > 0; j--){
//         hexagon.setAttribute("width", HEXWIDTH);
//         hexagon.setAttribute("height", Math.ceil(HEXHEIGHT) + hexthick);
//         hexagon.classList.add("hex"); //If you call it deprecated then at least propose a fucking alternative next time
//         polys.setAttribute("points", points);
//         hexagon.appendChild(polys);
//         row.appendChild(hexagon);
//     }
//     grid.appendChild(row);
// }