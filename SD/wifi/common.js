var dots = dots || { };

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
        if(url.indexOf('.csv') != -1) {
            return dots.http._getCached(url, success, error);
        }

        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            success(xhr.responseText)
        }
        xhr.onerror = () => {
            if(error) {
                error(xhr);
            } else {
                alert('Get failed, status '+xhr.status+ ' response: '+xhr.responseText);
            }
        }
        
        xhr.open("GET", url, true);
        xhr.send(null);
    },
    getWithSpinner: (url, success, error) => {
        dots.ui.showSpinner();
        dots.http.get(url, (responseText) => {
            dots.ui.hideSpinner();
            success(responseText);
        }, (xhr) => {
            dots.ui.hideSpinner();
            if(error) {
                error(xhr);
            } else {
                alert('Get failed, status '+xhr.status+ ' response: '+xhr.responseText);
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
            dots.tabs.activateTab(tabId);
        }));
        let defaultTab = tabs.filter(tab => tab.className.indexOf('active') != -1)[0];
        dots.tabs.activateTab(defaultTab.id);
    },
    activateTab: (id) => {
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
        newTabController.attach();
        dots.tabs._activeTabController = newTabController;
    }

};
