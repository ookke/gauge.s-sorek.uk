(() => {

let liveDataListenerUnsubs = [];

let dashboard = {
   pages: [{ name: "Page1", widgets: [], active: true }]
}

let liveDataController = {
    attach: function() {
       

        let menuVisible = false;
        document.getElementById('dashboard_menu_btn').addEventListener('click', event => {
            document.getElementById('dashboard_menu').style.display = menuVisible ? 'none': 'block';
            menuVisible = !menuVisible;
        });

        document.getElementById('add_widget').addEventListener('click', event => {
            var dashboardContainer = document.getElementById('dashboard_container');

            var widgetContainer = document.createElement('div');
            widgetContainer.style.gridColumn = '2 / span 1';
            widgetContainer.style.gridRow = '2 / span 1';
            widgetContainer.innerHTML='LabelWidget';

            liveDataListenerUnsubs.push(dots.http.subscribeLiveParameters(params => {
                widgetContainer.innerHTML = params[0].value + '[LabelWidget]';
            }));

            dashboardContainer.appendChild(widgetContainer);
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
        liveDataListenerUnsubs.forEach(it => it());
    }
    

};

dots.tabs.register('live_data_tab', liveDataController);


let listAvailableParameters = () => {
    //TODO: actual implementation would load config.json and parse ecuparams defs
    return [{header: 'Engine Speed', unit: 'rpm'}, { header: 'Coolant Temperature', unit: 'C'}]
}
})();
