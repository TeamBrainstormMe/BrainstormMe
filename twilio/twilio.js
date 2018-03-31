var data = {
    body: 'Hello from Node',
    to: '+16184072992',
    from: '+15012145667'
};

var URL = 'http://localhost:8080';

var callBtn = document.getElementById('callBtn');

callBtn.addEventListener('click', function (event) {
    event.preventDefault();
    fetch(URL, {
        method: 'POST',
        body: JSON.stringify(data)
    })
        .then((response) => response.json())

});
