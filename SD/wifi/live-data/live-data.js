(() => {



let liveDataController = {
    attach: function() {
       
        let menuVisible = false;
        document.getElementById('dashboard_menu_btn').addEventListener('click', event => {
            document.getElementById('dashboard_menu').style.display = menuVisible ? 'none': 'block';
            menuVisible = !menuVisible;
        });

        document.getElementById('add_widget').addEventListener('click', event => {
            addWidget('LabelWidget');
            
        });  

        initDragEvents();

    },
    getInitialMarkup: function() {
        return `<div id="live_data">
            <button id="dashboard_menu_btn">Menu</button>
            <div id="dashboard_menu">
                <!--<button id="edit_mode">Edit</button><br/>
                <button id="save_changes">Save</button><br/>
                <button id="cancel">Cancel</button><br/> -->
                <button id="add_widget">Add Widget</button><br/>
                <button id="add_page">Add Page</button><br/>
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
dots.dashboard.createWidget = (type) => {
    return widgetFactories[type]();
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
    dialog.style.position = 'absolute';
    dialog.style.top = 'calc(50% - 10vw)';
    dialog.style.left = 'calc(50% - 10vw)';
    dialog.style.width='20vw';
    //TODO: maybe display as a centered modal, with a background etc?

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
        if(setting.type == 'number' || setting.type == 'string') {
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
            setting.value = input.value;
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
    let widget = dots.dashboard.createWidget(type);
    widget.id = Date.now();
    idToWidgetMapping[widget.id] = widget;

    let dashboardContainer = document.getElementById('dashboard_container');

    let widgetContainer = document.createElement('div');
    widgetContainer.className = 'dots-widget';
    widgetContainer.style.gridColumn = '2 / span 1';
    widgetContainer.style.gridRow = '2 / span 1';
    widgetContainer.id = widget.id;
    
    showWidgetSettingsDialog(widget.settings, (save) => {
        //widget.settings.dataSource.value = 'Coolant Temp';
        dashboardContainer.appendChild(widgetContainer);
        widget.init.bind(widget, widgetContainer)();
    }, (cancel) => {});  

};



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
            if(widgetDivs) {
                let widgetDiv = widgetDivs[0];
                draggingWidget = idToWidgetMapping[widgetDiv.id];
                draggingDiv = widgetDiv;
                startCol = parseInt(widgetDiv.style.gridColumn.split('/')[0]);
                startRow = parseInt(widgetDiv.style.gridRow.split('/')[0]);
                dragging = true;
            }
        }
        else if(event.type == 'mouseup') {
            //update widget.position
            dragging = false;
            draggingDiv = null;
            draggingWidget = null;
        }
        

        
    };
    dashboardContainer.addEventListener('mousedown', listener);
    dashboardContainer.addEventListener('mouseup', listener);
    dashboardContainer.addEventListener('mousemove', listener);
}


let listAvailableParameters = () => {
    //TODO: actual implementation would load config.json and parse ecuparams defs
    return [{header: 'Engine Speed', unit: 'rpm'}, { header: 'Coolant Temperature', unit: 'C'}]
}
})();
