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


let availableParameters = null;
dots.http.listAvailableParameters(params => {
    availableParameters = params;
    //TODO: init default dashboard here mby if nothing saved
});

let showWidgetSettingsDialog = (widget, save, cancel) => {
    let settings = widget.settings; 
    let addLabel = (form, forInputName, text) => {
        let label = document.createElement('label');
        label.innerHTML = text;
        label.htmlFor = forInputName;
        form.appendChild(label);
    }

    let dialog = document.createElement('div');
    dialog.className = 'widget_setting_dialog';

    let form = document.createElement('form');
    dialog.appendChild(form);

    addLabel(form, 'widget_width', 'Width');
    let widthInput = document.createElement('input');
    widthInput.type = 'text';
    widthInput.name = 'widget_width';
    widthInput.value = widget.size.width; 
    form.appendChild(widthInput);

    addLabel(form, 'widget_height', 'Height');
    let heightInput = document.createElement('input');
    heightInput.type = 'text';
    heightInput.name = 'widget_height';
    heightInput.value = widget.size.width; 
    form.appendChild(heightInput);

    let fields = {};
    for(let property in settings) {
        let setting = settings[property];

        addLabel(form, property, setting.name);

        let input = null;
        if(setting.type == 'float' || setting.type == 'string') {
            input = document.createElement('input');
            input.type = 'text';
        }
        else if(setting.type == 'param') {
            let headers = availableParameters.map(param => param.header);

            input = document.createElement('select');

            let option = document.createElement("option");
                option.innerText = '--';
                option.value = "";
                input.appendChild(option);

            headers.forEach(hdr => {
                let option = document.createElement("option");
                option.innerText = hdr;
                option.value = hdr;
                input.appendChild(option);
            });
        }
        //TODO: should support at least bool also
        input.name = property;
        input.id = property;
        if(property.value != null) {
            //TODO: handle select options also so param doesn't get reset on settings edit
            input.value = property.value;
        }
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
        widget.size.width = widthInput.value;
        widget.size.height = heightInput.value;

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
    
    showWidgetSettingsDialog(widget, (save) => {
        let widgetContainer = createWidgetContainer(widget);
        dashboardContainer.appendChild(widgetContainer);
        widget.init.bind(widget, widgetContainer)();
    }, (cancel) => {});  

};

let createWidgetFromInfo = (widgetInfo) => {
    let widget = createWidget(widgetInfo.type);
    widget.id = widgetInfo.id;
    widget.type = widgetInfo.type;
    widget.settings = widgetInfo.settings;
    widget.size = widgetInfo.size;
    widget.position = widgetInfo.position;

    idToWidgetMapping[widget.id] = widget;
    dashboard.pages[0].widgets.push(widget);

    let dashboardContainer = document.getElementById('dashboard_container');

    let widgetContainer = createWidgetContainer(widget);
    dashboardContainer.appendChild(widgetContainer);
    widget.init.bind(widget, widgetContainer)();
    return widget;
}

let createWidgetContainer = (widget) => {
    let widgetContainer = document.createElement('div');
    widgetContainer.className = 'dots-widget';
    widgetContainer.style.gridColumn = widget.position.col + ' / span ' + widget.size.width;
    widgetContainer.style.gridRow = widget.position.row + ' / span ' + widget.size.height;
    widgetContainer.id = widget.id;
    return widgetContainer;
}




let initDragEvents = () => {
    let dashboardContainer = document.getElementById('dashboard_container');

    //divs whose only purpose are to provide concrete grid row/col coordinates for mouse events by doing document.elementFromPoint()
    //!! dimensions must be in sync with live-data.css #dashboard_container styles !!
    for(let col = 1; col < 24 + 1; col++) {
        for(let row = 1; row < 14 + 1; row++ ) {
            let listenerDiv = document.createElement('div');
            listenerDiv.style.gridColumn = col + ' / span 1';
            listenerDiv.style.gridRow = row + ' / span 1';
            listenerDiv.style.zIndex = 9;
            listenerDiv.className = 'dots-listener';

            dashboardContainer.appendChild(listenerDiv);
        }
    }

    let widgetButtons = document.createElement('div');
    widgetButtons.id = 'widget_buttons_toolbar';

    let deleteBtn = createDeleteButton();
    widgetButtons.appendChild(deleteBtn);
    deleteBtn.addEventListener('click', () => {
        if(selectedWidget != null) {
            removeWidget(selectedWidget, selectedDiv);
        }
    })

    let settingsBtn = createSettingsButton();
    widgetButtons.appendChild(settingsBtn);
    settingsBtn.addEventListener('click', () => {
        if(selectedWidget != null) {
            openSettings(selectedWidget, selectedDiv);
        }
    });

    
    dashboardContainer.appendChild(widgetButtons);
    

    let dragging = false;
    let latestCol = null;
    let latestRow = null;
    let draggingDiv = null;
    let draggingWidget = null;
    
  
    let listener = (event) => {
        
        if(event.type == 'mousemove' || event.type =='touchmove') {
            if(!dragging) {
                return;
            }
            //clear selection while dragging 
            if(selectedWidget != null) {
                selectWidget(null, null); 
            }

            //normalize mouse vs touch event
            let clientX = event.type == 'mousemove' ? event.clientX : event.changedTouches[0].clientX;
            let clientY = event.type == 'mousemove' ? event.clientY : event.changedTouches[0].clientY;

            var elem = document.elementFromPoint(clientX, clientY);
            if(elem && elem.className == 'dots-listener') {
                var col = elem.style.gridColumn.split('/')[0];
                var row = elem.style.gridRow.split('/')[0];

                if(col != latestCol) {
                    draggingDiv.style.gridColumn = col + ' / ' + draggingDiv.style.gridColumn.split('/')[1]; 
                    latestCol = col;
                }
                if(row != latestRow) {
                    draggingDiv.style.gridRow = row + ' / ' +  draggingDiv.style.gridRow.split('/')[1];
                    latestRow = row;
                }
            }
        }
        else if(event.type == 'mousedown' || event.type == 'touchstart') {

             //normalize mouse vs touch event
             let clientX = event.type == 'mousedown' ? event.clientX : event.touches[0].clientX;
             let clientY = event.type == 'mousedown' ? event.clientY : event.touches[0].clientY;

            var elems = document.elementsFromPoint(clientX, clientY);
            var widgetDivs = elems.filter(elem => elem.classList.contains('dots-widget'));
            if(widgetDivs && widgetDivs.length > 0) {
                let widgetDiv = widgetDivs[0];
                draggingWidget = idToWidgetMapping[widgetDiv.id];
                draggingDiv = widgetDiv;
                latestCol = parseInt(widgetDiv.style.gridColumn.split('/')[0]);
                latestRow = parseInt(widgetDiv.style.gridRow.split('/')[0]);
                dragging = true;
            } 
            
            
        }
        else if(event.type == 'mouseup' || event.type == 'touchend') {
            if(!dragging) {
                return;
            }
            draggingWidget.position.col = latestCol;
            draggingWidget.position.row = latestRow;

            dragging = false;
            draggingDiv = null;
            draggingWidget = null;
        }

        
    }

    dashboardContainer.addEventListener('mousedown', listener);
    dashboardContainer.addEventListener('touchstart', listener);

    dashboardContainer.addEventListener('mouseup', listener);
    dashboardContainer.addEventListener('touchend', listener);

    dashboardContainer.addEventListener('mousemove', listener);
    dashboardContainer.addEventListener('touchmove', listener);

    let selectedWidget = null;
    let selectedDiv = null;

    
    let removeWidget = (selectedWidget, selectedDiv) => {
        let dashboardContainer = document.getElementById('dashboard_container');
        dashboardContainer.removeChild(selectedDiv);
        dashboard.pages[0].widgets = dashboard.pages[0].widgets.filter(widget => widget != selectedWidget);
        selectWidget(null, null);
        //TODO: widget.destroy() or smt to clean up listeners etc
    }

    let openSettings = (selectedWidget, selectedDiv) => {

        showWidgetSettingsDialog(selectedWidget, (save) => { 
            removeWidget(selectedWidget, selectedDiv);
            let newWidget = createWidgetFromInfo(selectedWidget);
        }, (cancel) => {

        });

      
    }


    let selectWidget = (widget, widgetContainer) => {
        if(selectedDiv != null) {
            selectedDiv.classList.remove("selected_widget");
        }

        selectedWidget = widget;
        selectedDiv = widgetContainer;

        if(selectedDiv != null) {
            selectedDiv.classList.add("selected_widget")

            var col = parseInt(selectedDiv.style.gridColumn.split('/')[0]);
            var row = parseInt(selectedDiv.style.gridRow.split('/')[0]);

            widgetButtons.style.display = 'inline-block';
            widgetButtons.style.gridColumn = col + ' / span 1'; 
            widgetButtons.style.gridRow = row + ' / span 1';
        }
        else {
            widgetButtons.style.display = 'none';
        }
    }


    
    let clickListener = (event) => {
        var elems = document.elementsFromPoint(event.clientX, event.clientY);
        var widgetDivs = elems.filter(elem => elem.classList.contains('dots-widget'));
        if(widgetDivs && widgetDivs.length > 0) {
            let widgetDiv = widgetDivs[0];
            let targetWidget = idToWidgetMapping[widgetDiv.id];
            selectWidget(targetWidget, widgetDiv);        
        } else {
            //click outside to clear selection
            selectWidget(null, null);
        }

    }
    dashboardContainer.addEventListener('click', clickListener);
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
            size: widget.size,
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
            return createWidgetFromInfo(widgetInfo);
        })
    }});
    dashboard = restoredDashboard;
}



let createDeleteButton = () => {

    let deleteWidgetBtn = document.createElement('button');
    deleteWidgetBtn.id = 'delete_widget_button';
    deleteWidgetBtn.innerHTML =  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="widget-button-icon" viewBox="0 0 16 16"> <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/> <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/> </svg>`;

    return deleteWidgetBtn;
}

let createSettingsButton = () => {
    let settingsBtn = document.createElement('button');
    settingsBtn.id = 'widget_settings_button';
    settingsBtn.innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"  width="16" height="16" fill="currentColor" class="widget-button-icon" viewBox="0 0 512 512" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 512 512"><g><line y1="501" x1="303.1" y2="501" x2="302.1"/><g><path d="m501,300.8v-91.7h-45.3c-5.3-22.4-14.3-43.3-26.4-62.1l32.9-32.7-64.9-64.6-33.4,33.3c-18.8-11.5-39.6-19.9-61.8-24.8v-47.2h-92.1v48.3c-22,5.4-42.6,14.4-61.1,26.4l-34.2-34-64.9,64.6 35.3,35.2c-2.8,4.6-5.3,9.2-7.7,14-7.5,14.3-13.2,30-17.1,45.7h-49.3v91.7h50.3c1.5,6 3.3,11.9 5.3,17.8 0.1,0.4 0.3,0.8 0.4,1.2 0,0.1 0.1,0.2 0.1,0.4 4.9,14.2 11.3,27.7 19.1,40.2l-35.5,35.3 64.9,64.6 35.1-34.9c18.3,11.5 38.6,20.2 60.2,25.4v48.1h91.1v-47.1c22.7-5 44-13.7 63.1-25.6l32.2,32 64.9-64.6-32.1-31.9c12-19.1 20.9-40.3 26-62.9h44.9zm-94.8,64l29.9,29.8-36.6,36.5-29.5-29.4c-24.7,18.9-54.4,31.7-86.7,36v42.4h-51.3v-42.7c-31.5-4.6-60.4-17.2-84.6-35.7l-31.6,31.5-36.6-36.5 32.4-31.3c-17.9-24-30-52.4-34.4-83.4h-45.3v-51.1h44l1.5-3.6c4.7-29.7 16.5-57.1 33.6-80.3l-32-31.9 36.6-36.5 31,31.9c24-18.5 52.8-31.2 84.1-36v-42.7h51.3v42.3c32,4.1 61.3,16.4 86,34.8l30.3-30.1 35.6,36.5-29.6,29.5c18.2,23.8 30.7,52.2 35.5,83.1h45.4v51.1h-44.7c-3.9,31.8-16.1,61.1-34.3,85.8z"/><path d="m257,143.4c-61.8,0-113.1,50-113.1,112.6s51.4,112.6 113.1,112.6 113.1-51.1 113.1-112.6-51.3-112.6-113.1-112.6zm0,204.3c-51.3,0-92.1-40.7-92.1-91.7 0-51.1 41.9-91.7 92.1-91.7s92.1,40.7 92.1,91.7c0.1,51.1-41.8,91.7-92.1,91.7z"/></g></g></svg>`;
    return settingsBtn;
}


})();
