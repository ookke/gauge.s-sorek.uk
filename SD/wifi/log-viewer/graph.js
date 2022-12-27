
GraphContainer = {
    mode : "scatter",

    traces : [],
    canvas : {},
    image  : {},
    ctx    : {},

    isMouseDown : false,
    initialMousePos : {},
    mouseDelta : 0,
    zoom : {},

    colour : null,

    colours : [
        "#FFFFFF",
        "#FFFF00",
        "#FF0000",
        "#00FF00"
    ],

    init : function(graphCanvas) {
        this.canvas = graphCanvas;
        this.ctx = this.canvas.getContext("2d");
        this.clearScreen();
        this.image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    },

    clearScreen : function() {
        this.ctx.fillStyle = "#282a36";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    resize : function(size) {
        if(size <= 0) {
            throw new Error("graph.js: negative size (" + size.toString() + ") has been requested");
            return;
        }
        this.canvas.width = size;
        this.canvas.height = size;
        
        if(this.traces.length == 0) {
            this.clearScreen();
            return;
        }
        this.graph();
    },

    map : (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2,

    min : function(array) {
        let min = array[0];
        for(let i = 0; i < array.length; i++) {
            if(array[i] < min) {
                min = array[i];
            }
        }
        return min;
    },

    max : function(array) {
        let max = array[0];
        for(let i = 0; i < array.length; i++) {
            if(array[i] > max) {
                max = array[i];
            }
        }
        return max;
    },

    // Converts a #ffffff hex string into an [r,g,b] array
    h2r : function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    },

    // Inverse of the above
    r2h : function(rgb) {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    },

    // Interpolates two [r,g,b] colors and returns an [r,g,b] of the result
    // Taken from the awesome ROT.js roguelike dev library at
    // https://github.com/ondras/rot.js
    _interpolateColor : function(color1, color2, factor) {
        if (arguments.length < 3) { factor = 0.5; }
        var result = color1.slice();
        for (var i=0;i<3;i++) {
            result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
        }
        return result;
    },

    // performs the above on two #ffffff hex strings
    interpolateColour : function(color1, color2, factor) {
        let rgb1 = this.h2r(color1);
        let rgb2 = this.h2r(color2);
        let result = this._interpolateColor(rgb1, rgb2, factor);
        return this.r2h(result);
    },

    graph : function() {
        this.clearScreen();
        if(this.traces.length == 0) return;
        let traceHeight = this.canvas.height / this.traces.length;
        this.traces.forEach((trace, traceIndex) => {
            let y_min = this.min(trace.y);
            let y_max = this.max(trace.y);
            var firstPoint = true;
            if(this.mode === "timeSeries") {
                this.ctx.strokeStyle = this.colours[traceIndex % this.colours.length];
                this.ctx.beginPath();
            }
            //console.log({x_min, x_max, y_min, y_max});
            for(let i = 0; i < trace.x.length; i++) {
                let x = this.map(trace.x[i], this.zoom.x_min, this.zoom.x_max, 0, this.canvas.width);
                let y = this.map(trace.y[i], y_min, y_max, traceHeight, 0) + traceHeight * traceIndex;
                
                if(this.colour != null) {
                    let factor = this.map(this.colour.values[i], this.colour.redValue, this.colour.greenValue, 0, 1);
                    if(factor < 0) {
                        factor = 0;
                    }
                    if(factor > 1) {
                        factor = 1;
                    }
                    this.ctx.fillStyle = this.interpolateColour("#ff0000", "#00ff00", factor);
                } else {
                    this.ctx.fillStyle = this.colours[traceIndex % this.colours.length];
                }
                
                if(this.mode === "timeSeries") {
                    if(firstPoint) {
                        this.ctx.moveTo(Math.round(x), Math.round(y));
                        firstPoint = false;
                    } else {
                        this.ctx.lineTo(Math.round(x), Math.round(y));
                    }
                } else {
                    this.fillCircle(Math.round(x), Math.round(y), 1);
                }
            }

            if(this.mode === "timeSeries") this.ctx.stroke();
        });

        this.image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    },

    fillCircle : function(centerX, centerY, radius, colour) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();
    },

    resetZoom : function() {
        if(this.traces.length == 0) return;
        this.zoom = {
            x_min: this.min(this.traces[0].x),
            x_max: this.max(this.traces[0].x)
        };
    },

    redraw : function() {
        this.clearScreen();
        this.ctx.putImageData(this.image, 0, 0);
    },

    mouseDown : function(mousePos) {
        this.isMouseDown = true;
        this.initialMousePos = mousePos;
    },

    mouseUp : function(mousePos) {
        this.isMouseDown = false;

        if(this.initialMousePos.x == mousePos.x && this.initialMousePos.y == mousePos.y) {
            this.resetZoom();
        } else {
            this.zoom = {
                x_min: this.map(this.initialMousePos.x, 0, this.canvas.width, this.zoom.x_min, this.zoom.x_max),
                x_max: this.map(mousePos.x, 0, this.canvas.width, this.zoom.x_min, this.zoom.x_max)
            };
            if(this.zoom.x_max < this.zoom.x_min) {
                let temp = this.zoom.x_max;
                this.zoom.x_max = this.zoom.x_min;
                this.zoom.x_min = temp;
            }
        }
        
        this.graph();
    },

    mouseMove : function(mousePos) {
        if(!this.isMouseDown) return;

        this.redraw();
        this.ctx.fillStyle = "#FFFFFF55";
        this.ctx.fillRect(this.initialMousePos.x, 0, mousePos.x - this.initialMousePos.x, this.canvas.height);
    },

    // this is here in case graph.js is not running as a worker
    postMessage : function(msg) {
        this.handleMessage({data: msg});
    },

    handleMessage : function(e) {
        //console.log("graph.js: recieved message: " + e.data.purpose);
        
        // listen: I know this is bad, just pretend it doesn't exist and I'll fix it later
    
        switch(e.data.purpose) {
            case "init":
                GraphContainer.init(e.data.canvas);
                break;
    
            case "mode":
                GraphContainer.mode = e.data.mode;
                GraphContainer.graph();
                break;
    
            case "resize":
                GraphContainer.resize(e.data.size);
                break;
    
            case "graphing":
                GraphContainer.traces = e.data.traces;
                GraphContainer.resetZoom();
                GraphContainer.graph();
                break;
    
            case "clearScreen":
                GraphContainer.clearScreen();
                break;
    
            case "mouseMove":
                GraphContainer.mouseMove(e.data.mousePos);
                break;
    
            case "mouseDown":
                GraphContainer.mouseDown(e.data.mousePos);
                break;
    
            case "mouseUp":
                GraphContainer.mouseUp(e.data.mousePos);
                break;
    
            case "colours":
                GraphContainer.colour = e.data.enabled ? e.data : null;
                GraphContainer.graph();
                break;
    
            default:
                break;
        }
    },
}

// check if we're a worker
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    onmessage = GraphContainer.handleMessage;
}