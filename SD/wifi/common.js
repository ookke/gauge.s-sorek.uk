var dots = dots || { };

(() => {
dots.ui = {
    showSpinner: () => {
        let spinner = document.getElementById('dots_spinner');
        spinner.style.display = 'block';
    },
    hideSpinner: () => {
        let spinner = document.getElementById('dots_spinner');
        spinner.style.display = 'none';
    }
};

dots.http = {
    get: (url, success, error) => { 
        if(window.caches && url.indexOf('.csv') != -1) {
            return dots.http._getCached(url, success, error);
        }

        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            success(xhr.response)
        }
        xhr.onerror = () => {
            if(error) {
                error(xhr);
            } else {
                alert('Get failed, status '+xhr.status+ ' response: '+xhr.response);
            }
        }
        
        xhr.open("GET", url, true);
        xhr.send(null);
    },
    getWithSpinner: (url, success, error) => {
        dots.ui.showSpinner();
        dots.http.get(url, (response) => {
            dots.ui.hideSpinner();
            success(response);
        }, (xhr) => {
            dots.ui.hideSpinner();
            if(error) {
                error(xhr);
            } else {
                alert('Get failed, status '+xhr.status+ ' response: '+xhr.response);
            }
        });

    },
    _getCached: (url, success, error) =>  { 
        caches.open('dots.cache').then(cache => {
            let request = new Request(url);
            cache.match(request).then(cachedResponse => {
                if(cachedResponse != null) {
                    cachedResponse.text().then((text) => success(text));
                } else {
                    cache.add(request).then(response => response.text().then(text => success(text)));
                }
            });
        });
    },

    post: (url, payloadString, success, error) => {
        //TODO
    },
    postWithSpinner: (url, payloadString, success, error) => {
        //TODO
    }
};

dots.toggle_tablist = () => {
    var tabList = document.getElementById("dots_tab_list");
    tabList.style.display = tabList.style.display === "" ? "initial" : "";
}

let timerId = null;
let liveListeners = [];

let refreshLiveData = () => {

    let xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
        let response = msgpack.deserialize(xhr.response);
        if(response.ecuparam) {
            var data = response.ecuparam.map((point) => { return {
                header: point.h,
                value: point.v
            }});
            liveListeners.forEach(listener => {
                try { 
                    listener(data);
                } catch(ex) {
                    console.log('live data listener threw exceeption: '+ex);
                }
            })
        } else {
            console.log('warn: no ecuparam property in /parameters response ?');
        }
    }
    xhr.onerror = () => {
        if(error) {
            error(xhr);
        } else {
            alert('Get live data failed, status '+xhr.status+ ' response: '+xhr.response);
        }
    }
    
    xhr.open("GET", '/parameters', true);
    xhr.send(null);
}

//callback gets array of { header, value } each time live data is refreshed
//returns unsubscribe func, clean up on e.g. tab destroy!
let subscribeLiveParameters = (callback) => {
    liveListeners.push(callback);
    if(timerId == null) {
        timerId = setInterval(() => { refreshLiveData(); }, 100 );
    }

    let unsub = () => { 
        liveListeners = liveListeners.length > 1 ? liveListeners.filter(itm => itm != callback) : []; 
    }

    return unsub;
}
dots.http.subscribeLiveParameters = subscribeLiveParameters;


dots.tabs = { 
    _registry: {},
    _activeTabController: null,
    register: (tabHeaderId, controller) => {
        dots.tabs._registry[tabHeaderId] = controller;
    },
    init: () => {
        let tabList = document.getElementById('dots_tab_list');
        let tabs = Array.from(tabList.getElementsByTagName('li'));
        tabs.forEach(tab => tab.addEventListener('click', (event) => {

            let previousActive = tabs.filter(tab => tab.className.indexOf('active') != -1)[0];
            previousActive.className = previousActive.className.replace('active','');

            let newActive = event.target;
            let tabId = newActive.id;
            newActive.className += ' active';
            dots.tabs._activateTab(tabId);

            let tabList = document.getElementById('dots_tab_list');
            // are we in mobile mode?
            if(tabList.style.display === "initial") {
                tabList.style.display = ""
            }
        }));
        let defaultTab = tabs.filter(tab => tab.className.indexOf('active') != -1)[0];
        dots.tabs._activateTab(defaultTab.id);
    },
    //for programmatically switching tabs, optionally providing initParams context
    switchTab: (id, params = {}) => {
        let tabList = document.getElementById('dots_tab_list');
        let tabs = Array.from(tabList.getElementsByTagName('li'));

        let previousActive = tabs.filter(tab => tab.className.indexOf('active') != -1)[0];
        previousActive.className = previousActive.className.replace('active','');

        let newActive = document.getElementById(id);
        newActive.className += ' active';

        dots.tabs._activateTab(id, params);
    },
    _activateTab: (id, params = {}) => {
        let container = document.getElementById('tabs_content');

        //clean up old tab
        if(dots.tabs._activeTabController != null) {
            dots.tabs._activeTabController.destroy();
        }
        container.innerHtml = "";

        //in with the new
        let newTabController = dots.tabs._registry[id];
        let initialHtml = newTabController.getInitialMarkup();
        container.innerHTML = initialHtml;
        newTabController.attach(params);
        dots.tabs._activeTabController = newTabController;
    }

};
})();