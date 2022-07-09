let graph = null;

// -------- just for tab support -----------
var viewerController = {
    attach: function() {
        // TODO: the yaxes variable survives when navigating off the tab
        //       which means we can reload all the graph settings they had.
        //       Do that.

        // TODO: init the graph worker when the page is initially loaded
        //       that way we don't have to be connected to Gauge.S to
        //       properly click on the log viewer tab
        graph = new Worker("/wifi/log-viewer/graph.js");

        let canvas = document.getElementById("chart");
        if (!('transferControlToOffscreen' in canvas)) {
            throw new Error('webgl in worker unsupported');
        }

        var offscreen = canvas.transferControlToOffscreen();
        graph.postMessage({ 
            purpose: "init",
            canvas: offscreen 
        }, [offscreen]);

        sizeUI();

        listLogFiles();
    },
    getInitialMarkup: function() {
        return `<label for="log_select">Select log:</label>
        <select id="log_select"><option></option></select>
        <div>
            <canvas id="chart" onmousedown="chartMouseDown(event)" onmouseup="chartMouseUp(event)" onmousemove="chartMouseMove(event)"></canvas>
            <div id="settingsDiv">
                <p> 
                    <label for="xselect">X axis:</label> 
                    <select id="xselect" onchange="generatePlot()"></select> 
                </p>
                <div id="yaxiscontainer"></div>
                <button type="button" onclick="addyaxis()">Add Y axis</button>
                <div>
                    <label for="coloursCheckbox">Colours:</label>
                    <input id="coloursCheckbox" type="checkbox" onchange="toggleColours()"/>
                    <div id="hiddenColoursPanel">
                        <div>
                            <select id="colourSelect" onchange="updateColours()"></select>
                        </div>
                        <div>
                            <label for="redValue">Value of red</label>
                            <input id="redValue" type="number" onchange="updateColours()"/>
                        </div>
                        <div>
                            <label for="greenValue">Value of green</label>
                            <input id="greenValue" type="number" onchange="updateColours()"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },
    destroy: function() {

    },

};

dots.tabs.register('log_viewer_tab', viewerController);
// ----------------------

let logData = {};
let columns = [];
let yaxes = [];

toggleColours = function() {
    let coloursToggle = document.getElementById("coloursCheckbox");
    let coloursPanel = document.getElementById("hiddenColoursPanel");
    if(coloursToggle.checked) {
        coloursPanel.style.display = "block";
    } else {
        coloursPanel.style.display = "none";
    }
    updateColours();
}

updateColours = function() {
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

addyaxis = () => {
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
    axisSelect.setAttribute("onchange", "generatePlot()");
    axisSelect.className = "varSelect";

    columns.forEach((column) => {
            addOption(axisSelect, column);
    })
    axis.appendChild(axisSelect);
    axis.appendChild(removeButton);
    document.getElementById("yaxiscontainer").appendChild(axis);

    yaxes.push(axis);
    generatePlot();
}

function generatePlot() {
    let xvar = document.getElementById("xselect").value;

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

let parseLogFile = (fileData) => {
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
    logData.points_count = temp.length - 1;
    generatePlot();
}

let listLogFiles = () => {
    dots.http.getWithSpinner('/list?dir=/', (response) => {
        var files = JSON.parse(response);
        var logFiles = files.filter(file => file.name.indexOf('csv') != -1);
        var dropDown = document.getElementById('log_select');
        logFiles.forEach(log => {
            var option = document.createElement('option');
            option.innerText = log.name;
            dropDown.appendChild(option);
        });
        dropDown.addEventListener('change',(event) => {
            var fileName = event.target.value;
            dots.http.getWithSpinner(fileName, (responseText) => {
                parseLogFile(responseText);
              });
        });
    });

    
}

min = (a, b) => {
    return a < b ? a : b;
}

sizeUI = () => {
    let canvas = document.getElementById("chart");
    let chartSize = min(window.innerWidth, window.innerHeight) - 200 - document.getElementById("logo").height;
    graph.postMessage({
        purpose: "resize",
        size: chartSize
    })
}
window.onresize = sizeUI;