(() => {
    
    let labelWidgetFactory = () => {
        let labelWidget = {
            position: { "col": 1, "row": 1 },
            settings: { fixedText: {name: "Fixed value", type: "string", value: null }, dataSource: {name: "Datasource", type: "param", value: null}},
            init: function(container) {
                if(this.settings.fixedText.value) {
                    container.innerHTML = this.settings.fixedText;
                } 
                else {
                    dots.dashboard.subscribeLiveParameter(this.settings.dataSource.value, (param) => {
                        container.innerHTML = param.value;
                    });
                }
            }
        }
        return labelWidget;
    }
    dots.dashboard.registerWidget('LabelWidget', labelWidgetFactory);


})();