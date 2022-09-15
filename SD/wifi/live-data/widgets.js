(() => {
    
    let TextWidgetFactory = () => {
        let textWidget = {
            position: { "col": 4, "row": 4 },
            size: { "width": 3, "height": 3},
            settings: { title: { name: "Title", type: "string", value: null }, 
                dataSource: { name: "Parameter", type: "param", value: null },
                unit: { name: "Unit", type: "string", value: null } },
            init: function(container) {
                let wrapper = document.createElement('div');
                wrapper.className = 'text-widget';
                container.appendChild(wrapper);

                if(this.settings.title.value) {
                    let titleSpan = document.createElement('span');
                    wrapper.appendChild(titleSpan);
                    titleSpan.className = 'title-span';
                    titleSpan.innerHTML = this.settings.title.value;
                } 
                if(this.settings.dataSource.value) {
                    let valueSpan =  document.createElement('span');
                    wrapper.appendChild(valueSpan);
                    valueSpan.className = 'value-span';
                    dots.dashboard.subscribeLiveParameter(this.settings.dataSource.value, (param) => {
                        valueSpan.innerHTML = param.value;
                    });
                }
                if(this.settings.unit.value) {
                    let unitSpan = document.createElement('span');
                    wrapper.appendChild(unitSpan);
                    unitSpan.className = 'unit-span';
                    unitSpan.innerHTML = this.settings.unit.value;
                }
            }
        }
        return textWidget;
    }
    dots.dashboard.registerWidget('TextWidget', TextWidgetFactory);

    let angularGaugeWidgetFactory = () => {
        let gaugeWidget = {
            position: { "col": 4, "row": 4 },
            size: { "width": 4, "height": 4 },
            settings: {
                min: { name: "Min", type: "float", value: null }, 
                max: { name: "Max", type: "float", value: null }, 
                dataSource: { name: "Parameter", type: "param", value: null },
                title: { name: "Title", type: "string", value: null },
                unit: { name: "Unit", type: "string", value: null } 
            },
            init: function(container) {
                let containerWidth = container.clientWidth;
                let containerHeight = container.clientHeight;

                let canvas = document.createElement("canvas");
                container.appendChild(canvas);

                

                let min = this.settings.min.value || 0;
                let max = this.settings.max.value || 100;

                //needs some 'nice numbers' algo to adjust tick marks to arrive at nice round numbers somehow
                let range = max - min;
                var nrTicks = 4;
                var tickMarks = [];
                for(let tick = min; tick <= max; tick = tick + (range / nrTicks)) {
                    tickMarks.push(tick);
                }
                

                let gauge = new RadialGauge({
                    renderTo: canvas,
                    width: containerWidth,
                    height: containerHeight,
                    minValue: this.settings.min.value,
                    maxValue: this.settings.max.value,
                    majorTicks: tickMarks,
                    title: this.settings.title.value,
                    units: this.settings.unit.value,
                    fontNumbers: 'BHL',
                    fontTitle: 'BHL',
                    fontUnit: 'BHL',
                    fontValue: 'BHL',
                    animationDuration: 50,
                    colorPlate: '#282a36',
                    colorMinorTicks: '#FBBD2D',
                    colorMajorTicks: '#FBBD2D',
                    colorBorderInner: '#FBBD2D',
                    colorBorderInnerEnd: null,
                    colorBorderMiddle: '#FBBD2D',
                    colorBorderMiddleEnd: null,
                    colorBorderOuter:'#FBBD2D',
                    colorBorderOuterEnd: null,
                    colorNumbers: '#FBBD2D',
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