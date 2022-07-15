(() => {
var liveDataController = {
    attach: function() {
        dots.http.subscribeLiveParameters((params) => console.log(params));
    },
    getInitialMarkup: function() {
        return `<div id="live_data">
           
        </div>
       `;
    },
    destroy: function() {
        //TODO: clean up timer for tab switch
    }
    

};

dots.tabs.register('live_data_tab', liveDataController);
})();
