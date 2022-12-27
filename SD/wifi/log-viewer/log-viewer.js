var logViewer = logViewer || { };

(() => {

graphWorkerEnabled = true;

function loadGraphContainer() {
    return new Promise((resolve) => {
        var script = document.createElement('script');
        script.src = '/wifi/log-viewer/graph.js';
        script.onload = () => {resolve()}
        var head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
    })
}

var graph;
if (HTMLCanvasElement.prototype.transferControlToOffscreen && graphWorkerEnabled) {
    graph = new Worker("/wifi/log-viewer/graph.js");
} else {
    wrapAsync = async () => {
        await loadGraphContainer();
        graph = GraphContainer;
    }
    wrapAsync();
}

// -------- just for tab support -----------
var viewerController = {
    attach: function(params) {

        let canvas = document.getElementById("chart");

        // if we can we want to graph using a worker
        var offscreen = canvas;
        if (HTMLCanvasElement.prototype.transferControlToOffscreen && graphWorkerEnabled) {
            offscreen = canvas.transferControlToOffscreen();
        }

        graph.postMessage({ 
            purpose: "init",
            canvas: offscreen,
        }, [offscreen]);

        sizeUI();
        listLogFiles(params);

        if(yaxes.length != 0) { // means a file is already open
            restoreDOM();
        }
    },
    getInitialMarkup: function() {
        return `
        <ul id="log_select"></ul>
        <canvas id="chart" onmousedown="chartMouseDown(event)" onmouseup="chartMouseUp(event)" onmousemove="chartMouseMove(event)"></canvas>
        <div id="settingsDiv">
            <ul id="modeTabs">
                <li id="scatter" onclick="logViewer.selectActiveTab('scatter')" class="dots-tab active">Scatter Plot</li>
                <li id="timeSeries" onclick="logViewer.selectActiveTab('timeSeries')" class="dots-tab">Time Series</li>
            </ul>
            <p id="xaxisP"> 
                <label for="xselect">X axis:</label> 
                <select id="xselect" onchange="logViewer.update_xvar();logViewer.generatePlot()"></select> 
            </p>
            <div id="yaxiscontainer"></div>
            <button type="button" onclick="logViewer.addyaxis()">Add Y axis</button>
            <div id="coloursDiv">
                <label for="coloursCheckbox">Colours:</label>
                <input id="coloursCheckbox" type="checkbox" onchange="logViewer.toggleColours()"/>
                <div id="hiddenColoursPanel">
                    <div>
                        <select id="colourSelect" onchange="logViewer.updateColours()"></select>
                    </div>
                    <div>
                        <label for="redValue">Value of red</label>
                        <input id="redValue" type="number" onchange="logViewer.updateColours()"/>
                    </div>
                    <div>
                        <label for="greenValue">Value of green</label>
                        <input id="greenValue" type="number" onchange="logViewer.updateColours()"/>
                    </div>
                </div>
            </div>
        </div>
        `;
    },
    destroy: function() {

    },

};

dots.tabs.register('log_viewer_tab', viewerController);
// ----------------------

let logData = {};
let columns = [];
let yaxes = [];
let xvar;

logViewer.selectActiveTab = function(id) {
    let tabsParent = document.getElementById("modeTabs");
    for(let tab of tabsParent.children) {
        tab.classList.remove("active");
    }
    document.getElementById(id).classList.add("active");

    graph.postMessage({
        purpose: "mode",
        mode: id
    });

    if(id === "timeSeries") {
        document.getElementById("xaxisP").style.display = "none";
        document.getElementById("coloursDiv").style.display = "none";
        document.getElementById("xselect").value = columns[0];
        xvar = columns[0];
        logViewer.generatePlot();
    } else {
        document.getElementById("xaxisP").style.display = "";
        document.getElementById("coloursDiv").style.display = "";
    }
}

logViewer.update_xvar = function() {
    xvar = document.getElementById("xselect").value;
}

let pageCleanup = function() {
    logData = {};
    columns = [];
    yaxes = [];
}

let restoreDOM = function() {
    var xselect = document.getElementById("xselect");
    var yaxis_div = document.getElementById("yaxiscontainer");

    for(var i = 0; i < columns.length; i++) {
        addOption(xselect, columns[i]);
    };

    for(var i = 0; i < yaxes.length; i++) {
        yaxis_div.appendChild(yaxes[i]);
    }

    logViewer.generatePlot();
}

logViewer.toggleColours = function() {
    let coloursToggle = document.getElementById("coloursCheckbox");
    let coloursPanel = document.getElementById("hiddenColoursPanel");
    if(coloursToggle.checked) {
        coloursPanel.style.display = "block";
    } else {
        coloursPanel.style.display = "none";
    }
    logViewer.updateColours();
}

logViewer.updateColours = function() {
    let colourToggle = document.getElementById("coloursCheckbox");
    let colourSelect = document.getElementById("colourSelect");
    let redValue = document.getElementById("redValue");
    let greenValue = document.getElementById("greenValue");
    graph.postMessage({
        purpose: "colours",
        enabled: colourToggle.checked,
        values: logData[colourSelect.value],
        redValue: Number(redValue.value),
        greenValue: Number(greenValue.value)
    });
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

chartMouseDown = function(e) {
    graph.postMessage({
        purpose: "mouseDown",
        mousePos: getMousePos(document.getElementById("chart"), e)
    });
}

chartMouseUp = function(e) {
    graph.postMessage({
        purpose: "mouseUp",
        mousePos: getMousePos(document.getElementById("chart"), e)
    });
}

chartMouseMove = function(e) {
    graph.postMessage({
        purpose: "mouseMove",
        mousePos: getMousePos(document.getElementById("chart"), e)
    });
}

logViewer.addyaxis = function() {
    let axis = document.createElement("div");
    axis.style.display = "block";

    let removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Delete";
    removeButton.onclick = () => {
        let index = yaxes.indexOf(axis);
        document.getElementById("yaxiscontainer").removeChild(yaxes[index]);
        yaxes.splice(index, 1);
        generatePlot();
    };

    let axisSelect = document.createElement("select");
    axisSelect.setAttribute("onchange", "logViewer.generatePlot()");
    axisSelect.className = "varSelect";

    columns.forEach((column) => {
            addOption(axisSelect, column);
    })
    axis.appendChild(axisSelect);
    axis.appendChild(removeButton);
    document.getElementById("yaxiscontainer").appendChild(axis);

    yaxes.push(axis);
    logViewer.generatePlot();
}

logViewer.generatePlot = function() {
    let traces = [];
    yaxes.forEach((axis) => {
        traces.push({
            x: logData[xvar],
            y: logData[axis.querySelector(".varSelect").value],
            mode: 'markers',
            type: 'scatter'
        });
    });
    if(traces.length == 0) {
        graph.postMessage({
            purpose: "clearScreen"
        })
        return;
    }

    graph.postMessage({
        purpose: "graphing",
        traces: traces
    });                
}

addOption = (select, value) => {
    let option = document.createElement("option");
    option.setAttribute("value", value);
    option.appendChild(document.createTextNode(value));
    select.appendChild(option);
}

// should only be called once when a file is loaded
let parseLogFile = (fileData) => {
    pageCleanup();

    let temp = fileData.split("\n");
    for(let i in temp) {
        temp[i] = temp[i].split(",");
    }

    for(let i in temp[0]) {
        logData[temp[0][i]] = [];
        for (let j=1; j<temp.length; j++) {
            logData[temp[0][i]].push(Number(temp[j][i]));
        }

        addOption(document.getElementById("xselect"), temp[0][i]);
        addOption(document.getElementById("colourSelect"), temp[0][i]);
        yaxes.forEach((axisDiv) => {
            let select = axisDiv.querySelector(".varSelect");
            addOption(select, temp[0][i]);
        });

        columns.push(temp[0][i]);
    }

    // xvar is only updated during the xselect onchange() which means
    // we need to initialize it during file load.
    xvar = temp[0][0];
    logViewer.addyaxis();
    
    logData.points_count = temp.length - 1;
    logViewer.generatePlot();
}

let listLogFiles = (initParams) => {
    dots.http.getWithSpinner('/list?dir=/', (response) => {
        var files = JSON.parse(response);
        var logFiles = files.filter(file => file.name.indexOf('csv') != -1);
        var dropDown = document.getElementById('log_select');
        logFiles.forEach(log => {
            var option = document.createElement('li');
            option.id = log.name;
            option.innerText = log.name;
            dropDown.appendChild(option);
            option.addEventListener('click', function() {
                var filename = this.id;
                dots.http.getWithSpinner(filename, (responseText) => {
                    parseLogFile(responseText);
                });
            });
        });

        //did file explorer pass us a filename?
        if(initParams && initParams.fileName) {
            var fileName = initParams.fileName;
            dots.http.getWithSpinner(fileName, (responseText) => {
                parseLogFile(responseText);
            });
        }
    });
}

min = (a, b) => {
    return a < b ? a : b;
}

sizeUI = () => {
    let canvas = document.getElementById("chart");
    if(!canvas) return;

    let chartSize = min(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight) - 10;
    graph.postMessage({
        purpose: "resize",
        size: chartSize
    })
}
window.onresize = sizeUI;

})();