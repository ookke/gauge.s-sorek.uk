var activationsController = {
    attach: function() {
        var buttonContainer = document.getElementById('activations');
        var activations = ['Read DTC', 'Clear DTC'];
        activations.forEach(activation => {
            var button = document.createElement('button');
            button.innerText = activation;
            buttonContainer.appendChild(button);
       } );
    },
    getInitialMarkup: function() {
        return `<div id="activations"></div>
        <div id="result">Result:<br><textarea></textarea></div>`;
    },
    destroy: function() {

    },

};

dots.tabs.register('activations_tab', activationsController);
