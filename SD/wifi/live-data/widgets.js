(() => {
    
    let labelWidgetFactory = () => {
        let labelWidget = {
            position: { "col": 1, "row": 1 },
            settings: { fixedText: { name: "Fixed value", type: "string", value: null }, 
                dataSource: { name: "Parameter", type: "param", value: null },
                unit: { name:"Unit", type: "string", value: null } },
            init: function(container) {
                let span = document.createElement('span');
                container.style.whiteSpace = 'nowrap';
                container.appendChild(span);
                if(this.settings.fixedText.value) {
                    span.innerHTML = this.settings.fixedText.value;
                } 
                else {
                    dots.dashboard.subscribeLiveParameter(this.settings.dataSource.value, (param) => {
                        span.innerHTML = param.value + ( this.settings.unit.value ? " " + this.settings.unit.value : "");
                    });
                }
            }
        }
        return labelWidget;
    }
    dots.dashboard.registerWidget('LabelWidget', labelWidgetFactory);

    let gaugeWidgetFactory = () => {
        let gaugeWidget = {
            position: { "col": 1, "row": 1 },
            settings: { min: { name: "Min", type: "float", value: null }, 
                max: { name: "Max", type: "float", value: null }, 
                dataSource: { name: "Parameter", type: "param", value: null },
                unit: { name:"Unit", type: "string", value: null } },
            init: function(container) {
                if(this.settings.fixedText.value) {
                    container.innerHTML = this.settings.fixedText.value;
                } 
                else {
                    dots.dashboard.subscribeLiveParameter(this.settings.dataSource.value, (param) => {
                        container.innerHTML = param.value + ( this.settings.unit.value ? " " + this.settings.unit.value : "");
                    });
                }
            }
        }
        return gaugeWidget;
    }
    dots.dashboard.registerWidget('GaugeWidget', gaugeWidgetFactory);


})();