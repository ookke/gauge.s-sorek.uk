
var mode = "scatter";

var traces = [];
var canvas;
var image;
var ctx;

var isMouseDown = false;
var initialMousePos = {};
var mouseDelta = 0;
var zoom = {};

var colour = null;

var colours = [
    "#FFFFFF",
    "#FFFF00",
    "#FF0000",
    "#00FF00"
];

init = function(graphCanvas) {
    canvas = graphCanvas;
    ctx = canvas.getContext("2d");
    clearScreen();
    image = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

clearScreen = function() {
    ctx.fillStyle = "#282a36";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

resize = function(size) {
    if(size <= 0) {
        throw new Error("graph.js: negative size (" + size.toString() + ") has been requested");
        return;
    }
    canvas.width = size;
    canvas.height = size;
    
    if(traces.length == 0) {
        clearScreen();
        return;
    }
    graph();
}

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

min = function(array) {
    let min = array[0];
    for(let i = 0; i < array.length; i++) {
        if(array[i] < min) {
            min = array[i];
        }
    }
    return min;
}

max = function(array) {
    let max = array[0];
    for(let i = 0; i < array.length; i++) {
        if(array[i] > max) {
            max = array[i];
        }
    }
    return max;
}

// Converts a #ffffff hex string into an [r,g,b] array
var h2r = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Inverse of the above
var r2h = function(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

// Interpolates two [r,g,b] colors and returns an [r,g,b] of the result
// Taken from the awesome ROT.js roguelike dev library at
// https://github.com/ondras/rot.js
var _interpolateColor = function(color1, color2, factor) {
  if (arguments.length < 3) { factor = 0.5; }
  var result = color1.slice();
  for (var i=0;i<3;i++) {
    result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
  }
  return result;
};

// performs the above on two #ffffff hex strings
var interpolateColour = function(color1, color2, factor) {
    let rgb1 = h2r(color1);
    let rgb2 = h2r(color2);
    let result = _interpolateColor(rgb1, rgb2, factor);
    return r2h(result);
}

graph = function() {
    clearScreen();
    if(traces.length == 0) return;
    let traceHeight = canvas.height / traces.length;
    traces.forEach((trace, traceIndex) => {
        let y_min = min(trace.y);
        let y_max = max(trace.y);
        var firstPoint = true;
        if(mode === "timeSeries") {
            ctx.strokeStyle = colours[traceIndex % colours.length];
            ctx.beginPath();
        }
        //console.log({x_min, x_max, y_min, y_max});
        for(let i = 0; i < trace.x.length; i++) {
            let x = map(trace.x[i], zoom.x_min, zoom.x_max, 0, canvas.width);
            let y = map(trace.y[i], y_min, y_max, traceHeight, 0) + traceHeight * traceIndex;
            
            if(colour != null) {
                let factor = map(colour.values[i], colour.redValue, colour.greenValue, 0, 1);
                if(factor < 0) {
                    factor = 0;
                }
                if(factor > 1) {
                    factor = 1;
                }
                ctx.fillStyle = interpolateColour("#ff0000", "#00ff00", factor);
            } else {
                ctx.fillStyle = colours[traceIndex % colours.length];
            }
            
            if(mode === "timeSeries") {
                if(firstPoint) {
                    ctx.moveTo(Math.round(x), Math.round(y));
                    firstPoint = false;
                } else {
                    ctx.lineTo(Math.round(x), Math.round(y));
                }
            } else {
                fillCircle(Math.round(x), Math.round(y), 1);
            }
        }

        if(mode === "timeSeries") ctx.stroke();
    });

    image = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

fillCircle = function(centerX, centerY, radius, colour) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fill();
}

resetZoom = function() {
    if(traces.length == 0) return;
    zoom = {
        x_min: min(traces[0].x),
        x_max: max(traces[0].x)
    };
}

redraw = function() {
    clearScreen();
    ctx.putImageData(image, 0, 0);
}

mouseDown = function(mousePos) {
    isMouseDown = true;
    initialMousePos = mousePos;
}

mouseUp = function(mousePos) {
    isMouseDown = false;

    if(initialMousePos.x == mousePos.x && initialMousePos.y == mousePos.y) {
        resetZoom();
    } else {
        zoom = {
            x_min: map(initialMousePos.x, 0, canvas.width, zoom.x_min, zoom.x_max),
            x_max: map(mousePos.x, 0, canvas.width, zoom.x_min, zoom.x_max)
        };
        if(zoom.x_max < zoom.x_min) {
            let temp = zoom.x_max;
            zoom.x_max = zoom.x_min;
            zoom.x_min = temp;
        }
    }
    
    graph();
}

mouseMove = function(mousePos) {
    if(!isMouseDown) return;

    redraw();
    ctx.fillStyle = "#FFFFFF55";
    ctx.fillRect(initialMousePos.x, 0, mousePos.x - initialMousePos.x, canvas.height);
}

onmessage = function(e) {
    //console.log("graph.js: recieved message: " + e.data.purpose);
    
    // listen: I know this is bad, just pretend it doesn't exist and I'll fix it later

    if(e.data.purpose === "init") {
        init(e.data.canvas);
        return;
    }

    if(e.data.purpose === "mode") {
        mode = e.data.mode;
        graph();
        return;
    }

    if(e.data.purpose === "resize") {
        resize(e.data.size);
        return;
    }

    if(e.data.purpose === "graphing") {
        traces = e.data.traces;
        resetZoom();
        graph();
        return;
    }

    if(e.data.purpose === "clearScreen") {
        clearScreen();
        return;
    }
    
    if(e.data.purpose === "mouseMove") {
        mouseMove(e.data.mousePos);
        return;
    }

    if(e.data.purpose === "mouseDown") {
        mouseDown(e.data.mousePos);
        return;
    }

    if(e.data.purpose === "mouseUp") {
        mouseUp(e.data.mousePos);
        return;
    }

    if(e.data.purpose === "colours") {
        colour = e.data.enabled ? e.data : null;
        graph();
        return;
    }
}