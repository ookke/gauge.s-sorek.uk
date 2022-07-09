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
    post: (url, payloadString, success, error) => {
        //TODO
    },
    postWithSpinner: (url, payloadString, success, error) => {
        //TODO
    }
};