var dots = { };
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


