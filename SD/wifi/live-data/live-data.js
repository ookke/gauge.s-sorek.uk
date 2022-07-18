(() => {



let liveDataController = {
    attach: function() {
       
        let menuVisible = false;
        document.getElementById('dashboard_menu_btn').addEventListener('click', event => {
            document.getElementById('dashboard_menu').style.display = menuVisible ? 'none': 'block';
            menuVisible = !menuVisible;
        });

        document.getElementById('add_text_widget').addEventListener('click', event => {
            addWidget('TextWidget');
        }); 

        document.getElementById('add_angular_gauge_widget').addEventListener('click', event => {
            addWidget('AngularGaugeWidget');
        });  

        document.getElementById('save_dashboard').addEventListener('click', event => {
            saveDashboard();
        }); 

        document.getElementById('load_dashboard').addEventListener('click', event => {
            loadDashboard();
        }); 

        initDragEvents();

    },
    getInitialMarkup: function() {
        return `<div id="live_data">
            <button id="dashboard_menu_btn">Menu</button>
            <div id="dashboard_menu">
                <button id="add_text_widget">Add Text Widget</button><br/>
                <button id="add_angular_gauge_widget">Add Angular Gauge Widget</button><br/>
                <button id="save_dashboard">Save Dashboard</button><br/>
                <button id="load_dashboard">Load Dashboard</button><br/>
            </div>
            <div id="dashboard_container"></div> 
        </div>
       `;
    },
    destroy: function() {
        liveDataListenerUnsub();
    }
    

};

dots.tabs.register('live_data_tab', liveDataController);


let dashboard = {
   pages: [{ name: "Page1", widgets: [], active: true }]
}

dots.dashboard = {};

let widgetFactories = {};
dots.dashboard.registerWidget = (type, factoryFunc) => {
    widgetFactories[type] = factoryFunc;
};
createWidget = (type) => {
    let widget = widgetFactories[type]();
    widget.type = type;
    return widget;
}


var liveParameterListeners = {

}
dots.dashboard.subscribeLiveParameter = (header, callback) => {
    if(!liveParameterListeners[header]) {
        liveParameterListeners[header] = [];
    }
    liveParameterListeners[header].push(callback);
} 
let liveDataListenerUnsub = dots.http.subscribeLiveParameters(params => {
       params.forEach(param => {
            let header = param.header;
            let listeners = liveParameterListeners[header];
            if(listeners) {
                listeners.forEach(listener => listener(param));
            }
       })
});

let showWidgetSettingsDialog = (settings, save, cancel) => {
    let dialog = document.createElement('div');
    dialog.className='widget_setting_dialog'

    let form = document.createElement('form');
    dialog.appendChild(form);

    let fields = {};
    for(let property in settings) {
        let setting = settings[property];

        let label = document.createElement('label');
        label.innerHTML = setting.name;
        label.htmlFor = property;
        label.style.width='100%';
        form.appendChild(label);

        let input = null;
        if(setting.type == 'float' || setting.type == 'string') {
            input = document.createElement('input');
            input.type = 'text';
        }
        else if(setting.type == 'param') {
            input = document.createElement('input');
            input.type = 'text';
            //TODO: this should actually be a <select> populated with listAvailableParameters()
        }
        //TODO: should support at least bool also
        input.name = property;
        input.id = property;
        input.style.width='100%';
        form.appendChild(input); 
        fields[property] = input;       
    }

    let buttons = document.createElement("div");
    dialog.appendChild(buttons);

    let saveBtn = document.createElement("button");
    saveBtn.style.display = 'inline-block';
    saveBtn.innerHTML = "Save";
    buttons.appendChild(saveBtn);
    
    let cancelBtn = document.createElement("button");
    cancelBtn.style.display = 'inline-block';
    cancelBtn.innerHTML = "Cancel";
    buttons.appendChild(cancelBtn);

    document.body.appendChild(dialog);

    saveBtn.addEventListener('click', event => {
        for(let property in settings) {
            let input = fields[property];
            let setting = settings[property];
            if(setting.type == 'float') {
                setting.value = input.value ? parseFloat(input.value) : null;
            } else {
                setting.value = input.value ? input.value : null;
            }
        }   

        document.body.removeChild(dialog);
        save();
    });

    cancelBtn.addEventListener('click', event => {
        document.body.removeChild(dialog);
        cancel();
    });

}


let idToWidgetMapping = {};
let addWidget = (type) => {
    let widget = createWidget(type);
    widget.id = Date.now();
    widget.type = type;

    idToWidgetMapping[widget.id] = widget;
    dashboard.pages[0].widgets.push(widget);

    let dashboardContainer = document.getElementById('dashboard_container');
    
    showWidgetSettingsDialog(widget.settings, (save) => {
        let widgetContainer = createWidgetContainer(widget);
        dashboardContainer.appendChild(widgetContainer);
        widget.init.bind(widget, widgetContainer)();
    }, (cancel) => {});  

};

let createWidgetContainer = (widget) => {
    let widgetContainer = document.createElement('div');
    widgetContainer.className = 'dots-widget';
    widgetContainer.style.gridColumn = widget.position.col + ' / span 1';
    widgetContainer.style.gridRow = widget.position.row + ' / span 1';
    widgetContainer.id = widget.id;
    return widgetContainer;
}



let initDragEvents = () => {
    let dashboardContainer = document.getElementById('dashboard_container');

    //divs whose only purpose are to provide concrete grid row/col coordinates for mouse events by doing document.elementFromPoint()
    for(let col = 1; col < 16 + 1; col++) {
        for(let row = 1; row < 10 + 1; row++ ) {
            let listenerDiv = document.createElement('div');
            listenerDiv.style.gridColumn = col + ' / span 1';
            listenerDiv.style.gridRow = row + ' / span 1';
            listenerDiv.style.zIndex = 9;
            listenerDiv.className = 'dots-listener';

            dashboardContainer.appendChild(listenerDiv);
        }
    }


    let dragging = false;
    let latestCol = null;
    let latestRow = null;
    let draggingDiv = null;
    let draggingWidget = null;
    let listener = (event) => {
        if(event.type == 'mousemove') {
            if(!dragging) {
                return;
            }
            var elem = document.elementFromPoint(event.clientX, event.clientY);
            if(elem && elem.className == 'dots-listener') {
                var col = elem.style.gridColumn.split('/')[0];
                var row = elem.style.gridRow.split('/')[0];

                if(col != latestCol) {
                    draggingDiv.style.gridColumn = col + ' / span 1'; //TODO: handle widget sizes
                    latestCol = col;
                }
                if(row != latestRow) {
                    draggingDiv.style.gridRow = row + ' / span 1';
                    latestRow = row;
                }

                //console.log(`${col} ${row} ${event.type} ${event.target}`);
            }
        }
        else if(event.type == 'mousedown') {
            var elems = document.elementsFromPoint(event.clientX, event.clientY);
            var widgetDivs = elems.filter(elem => elem.className == 'dots-widget');
            if(widgetDivs && widgetDivs.length > 0) {
                let widgetDiv = widgetDivs[0];
                draggingWidget = idToWidgetMapping[widgetDiv.id];
                draggingDiv = widgetDiv;
                latestCol = parseInt(widgetDiv.style.gridColumn.split('/')[0]);
                latestRow = parseInt(widgetDiv.style.gridRow.split('/')[0]);
                dragging = true;
            }
        }
        else if(event.type == 'mouseup') {
            if(!dragging) {
                return;
            }
            draggingWidget.position.col = latestCol;
            draggingWidget.position.row = latestRow;
            
            dragging = false;
            draggingDiv = null;
            draggingWidget = null;
        }

        
    };
    dashboardContainer.addEventListener('mousedown', listener);
    dashboardContainer.addEventListener('mouseup', listener);
    dashboardContainer.addEventListener('mousemove', listener);
}

let saveDashboard = () => {
    //convert widgets into serializable objects
    let serializableDashboard = {};
    serializableDashboard.pages = dashboard.pages.map(page => { return {
        name: page.name,
        active: page.active,
        widgets: page.widgets.map(widget => { return { 
            id: widget.id,
            type: widget.type,
            position: widget.position,
            settings: widget.settings
        }})
    }});
    
    let state = JSON.stringify(serializableDashboard);
    localStorage.setItem('dots.dashboard.state', state);
}

let loadDashboard = () => {
    let state = localStorage.getItem('dots.dashboard.state');
    if(state == null) {
        alert('no dashboard state found in localStorage');
    }

    let dashboardContainer = document.getElementById('dashboard_container');
    dashboardContainer.querySelectorAll('.dots-widget').forEach(elem => elem.remove());

    let restoredDashboard = {};
    restoredDashboard.pages = JSON.parse(state).pages.map(page => { return {
        name: page.name,
        active: page.active,
        widgets: page.widgets.map(widgetInfo => {
            //TODO: should share more code with addWidget()
            var widget = createWidget(widgetInfo.type);
            widget.id = widgetInfo.id;
            idToWidgetMapping[widget.id] = widget;
            widget.position = widgetInfo.position;
            widget.settings = widgetInfo.settings;
            
            let widgetContainer = createWidgetContainer(widget);
            dashboardContainer.appendChild(widgetContainer);
            widget.init.bind(widget, widgetContainer)();

            return widget;  
        })
    }});
    dashboard = restoredDashboard;
}




let listAvailableParameters = () => {
    //TODO: actual implementation would load config.json and parse ecuparams defs
    return [{header: 'Engine Speed', unit: 'rpm'}, { header: 'Coolant Temperature', unit: 'C'}]
}
})();
