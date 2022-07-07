var gaugeS = {};

var chartColors = ['#A93A07','#A82743','#8C3368','#394A6F','#42A53F','#00786B','#2F4858','#604377'];
    
function getLog(logPath) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", logPath, true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            openLog(xhr.responseText);
        } else {
            console.error(xhr.statusText);
        }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.send(null);
}

function openLog(dataStr) {
    var start = Date.now();
    var strLines = dataStr.split('\n');
    var csvRows = strLines.length - 1;

    var headers = strLines[0].split(',');
    headers.shift();
    var dataSeries = headers.map(function(hdr) { 
    return { 
        name: hdr,
        data: Array(csvRows)
        } 
    });


    var timestamps = Array(csvRows);
    var rowCtr = 0;
    var logRows = strLines.map(function(rowStr) {
        var strCols = rowStr.split(',');
        
        var ts = parseFloat(strCols[0]);
        if(!isNaN(ts)) {
            timestamps[rowCtr] = new Date(ts);
            for(var i=1;i<strCols.length;i++) {
                var series = dataSeries[i-1];
                series.data[rowCtr] = parseFloat(strCols[i]);
            }
            rowCtr++;
        }
        
        return strCols;
    });
    gaugeS.dataSeries = dataSeries;
    gaugeS.timestamps = timestamps;
    initParams(headers);

    var duration = Date.now() - start;
    document.getElementById('stats').innerText = 'Parsed '+logRows.length+' CSV rows in '+duration+' ms';

    initChart();
    toggleParamsPopover();
}

function formatMillis(millis) {
    var mins = Math.floor(millis / 60000);
    var seconds = Math.floor((millis % 60000) / 1000);
    var millis = Math.floor(millis % 1000);
    return (mins > 0 ? (mins+"m "):"") + seconds + "." + millis + "s";
}
    
function initParams(params) {
    params.forEach(function(param) {
        var li = document.createElement('li');
        
        var cb = document.createElement('input');
        cb.type ='checkbox';
        cb.addEventListener('change', function() { toggleSeries(param) } );

        var label = document.createElement('label');
        label.innerText = param;
        
        li.appendChild(cb);
        li.appendChild(label);
        
        document.getElementById('params').appendChild(li);
    });
}

function toggleSeries(header) {
    var series = gaugeS.dataSeries.filter(function(ser) { return ser.name == header })[0];
    if(series) {
        let existingDataSet = gaugeS.chart.data.datasets.filter(function(ds) { return ds.label == header})[0];
        if(existingDataSet) { 
            gaugeS.chart.data.datasets = gaugeS.chart.data.datasets.filter(function(ds) { return ds.label != header});
        } else {
            gaugeS.chart.data.datasets.push({ label: header,  data: series.data,
                borderColor: chartColors[gaugeS.chart.data.datasets.length],
                pointRadius: 0,
                borderWidth: 1.5,
                parse: false
            });
        }
        var start = Date.now();
        gaugeS.chart.update();
        console.log('update chart took: '+(Date.now() - start));
    }
}
	  
function initChart() {
    var ctx = document.getElementById('teh_canvas');

    let zoomOptions = {
        pan: {
          //enabled: false,
          //mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          drag: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
          onZoomComplete({chart}) {
            // This update is needed to display up to date zoom level in the title.
            // Without this, previous zoom level is displayed.
            // The reason is: title uses the same beforeUpdate hook, and is evaluated before zoom.
            //chart.update('none');
          }
        },
        drag: {
            backgroundColor: '#45464c'
        }
      };
    
    gaugeS.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: gaugeS.timestamps,
            datasets: []
        },
        options: {
            responsive: true,
            animation: false,
            interaction: {
                intersect: false,
                mode: 'index',
                axis: 'x'
            },
            scales: {
                x: {
                    display: false,
                    type: 'time'
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            let milliStr = context[0].parsed.x;
    
                            if (milliStr) {
                                return formatMillis(milliStr)
                            }
                            return label;
                        }
                    }
                },
                zoom: zoomOptions,
                decimation: {
                    enabled: true
                },
                adapters: {
                    date: {
                        locale: 'utc'
                    }
                }
            }
        }  
	
    });
	  
}

var paramsVisible = false;
function toggleParamsPopover() {
    document.getElementById('parameters').style.display = paramsVisible ? 'none': 'block';
    paramsVisible = !paramsVisible;
}

