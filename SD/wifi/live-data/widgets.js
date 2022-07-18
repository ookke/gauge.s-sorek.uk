(() => {
    
    let TextWidgetFactory = () => {
        let textWidget = {
            position: { "col": 4, "row": 4 },
            settings: { fixedText: { name: "Fixed value", type: "string", value: null }, 
                dataSource: { name: "Parameter", type: "param", value: null },
                unit: { name: "Unit", type: "string", value: null } },
            init: function(container) {
                let span = document.createElement('span');
                span.className='text_widget';
                container.style.whiteSpace = 'nowrap';
                container.style.cursor = 'default';
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
        return textWidget;
    }
    dots.dashboard.registerWidget('TextWidget', TextWidgetFactory);

    let angularGaugeWidgetFactory = () => {
        let gaugeWidget = {
            position: { "col": 4, "row": 4 },
            settings: {
                min: { name: "Min", type: "float", value: null }, 
                max: { name: "Max", type: "float", value: null }, 
                dataSource: { name: "Parameter", type: "param", value: null },
                title: { name: "Title", type: "string", value: null },
                unit: { name: "Unit", type: "string", value: null } 
            },
            init: function(container) {
                let canvas = document.createElement("canvas");
                container.appendChild(canvas);
                let gauge = new RadialGauge({
                    renderTo: canvas,
                    minValue: this.settings.min.value,
                    maxValue: this.settings.max.value,
                    title: this.settings.title.value,
                    units: this.settings.unit.value,
                    animationDuration: 50,
                    colorPlate: '#282a36',
                    colorMinorTicks: '#cc8800',
                    colorMajorTicks: '#cc8800',
                    colorBorderInner: '#cc8800',
                    colorBorderInnerEnd: null,
                    colorBorderMiddle: '#cc8800',
                    colorBorderMiddleEnd: null,
                    colorBorderOuter:'#cc8800',
                    colorBorderOuterEnd: null,
                    colorNumbers: '#cc8800',
                    needleShadow: false

                });
                gauge.draw();
                dots.dashboard.subscribeLiveParameter(this.settings.dataSource.value, (param) => {
                    gauge.value = param.value;
                });
            }
        }
        return gaugeWidget;
    }
    dots.dashboard.registerWidget('AngularGaugeWidget', angularGaugeWidgetFactory);


})();