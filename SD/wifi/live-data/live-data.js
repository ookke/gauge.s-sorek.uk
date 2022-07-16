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
            widgetContainer.style.gridColumn = '2 / span 1';
            widgetContainer.style.gridRow = '2 / span 1';

            let widget = dots.dashboard.createWidget('LabelWidget');
            widget.settings.dataSource.value = 'Coolant Temp';

            dashboardContainer.appendChild(widgetContainer);

            widget.init.bind(widget, widgetContainer)();
            
            
        });

    },
    getInitialMarkup: function() {
        return `<div id="live_data">
            <button id="dashboard_menu_btn">Menu</button>
            <div id="dashboard_menu">
                <button id="edit_mode">Edit</button><br/>
                <button id="save_changes">Save</button><br/>
                <button id="cancel">Cancel</button><br/>
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


let listAvailableParameters = () => {
    //TODO: actual implementation would load config.json and parse ecuparams defs
    return [{header: 'Engine Speed', unit: 'rpm'}, { header: 'Coolant Temperature', unit: 'C'}]
}
})();
