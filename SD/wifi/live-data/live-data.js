(() => {



let liveDataController = {
    attach: function() {
       

        let menuVisible = false;
        document.getElementById('dashboard_menu_btn').addEventListener('click', event => {
            document.getElementById('dashboard_menu').style.display = menuVisible ? 'none': 'block';
            menuVisible = !menuVisible;
        });

        document.getElementById('add_widget').addEventListener('click', event => {
            let dashboardContainer = document.getElementById('dashboard_container');

            let widgetContainer = document.createElement('div');
            widgetContainer.className = 'dots-widget';
            widgetContainer.style.gridColumn = '2 / span 1';
            widgetContainer.style.gridRow = '2 / span 1';

            let widget = dots.dashboard.createWidget('LabelWidget');
            showWidgetSettingsDialog(widget.settings, (save) => {
                //widget.settings.dataSource.value = 'Coolant Temp';
                dashboardContainer.appendChild(widgetContainer);
                widget.init.bind(widget, widgetContainer)();
            }, (cancel) => {});  
            
        });

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


let listAvailableParameters = () => {
    //TODO: actual implementation would load config.json and parse ecuparams defs
    return [{header: 'Engine Speed', unit: 'rpm'}, { header: 'Coolant Temperature', unit: 'C'}]
}
})();
