(() => {
var liveDataController = {
    attach: function() {

        var refreshData = () => {
           dots.http.get('/parameters', (responseText) => {
                let response = JSON.parse(responseText);
                let valuesList = document.getElementById("live_values");
                valuesList.innerHTML = "";
                if(response.ecuparam) {
                    response.ecuparam.forEach((point) => {
                        var header = point.h;
                        var value = point.v;
                        var itm= document.createElement("li");
                        itm.innerText = header + " = " + value;
                        valuesList.appendChild(itm);
                    })
                }
                
            }, (errorRes) => {
                console.log('error from server '+errorRes);
            });
        }

       var timerId = setInterval(() => { refreshData(); }, 1000 );
       document.getElementById("refresh_rate").addEventListener("change", (event) => {
            console.log('refresh interval changed: '+event.target.value);
            clearInterval(timerId);
            timerId = setInterval(() => { refreshData(); }, event.target.value );
       });
    },
    getInitialMarkup: function() {
        return `<div id="live_data">
            <select id="refresh_rate">
                <option value="1000">1Hz</option>
                <option value="500">2Hz</option>
                <option value="200">5Hz</option>
                <option value="100">10Hz</option>
                <option value="50">20Hz</option>
                <option value="20">50Hz</option>
            </select>
            <ul id="live_values"></ul>
        </div>
       `;
    },
    destroy: function() {
        //TODO: clean up timer for tab switch
    }
    

};

dots.tabs.register('live_data_tab', liveDataController);
})();
