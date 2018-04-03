var http = require('http');
var fs = require('fs');
var twilio = require('twilio');
var http = require('http');
var fs = require('fs');
var promisify = require('util').promisify;
var readFile = promisify(fs.readFile);
const PORT = 8080;

var html = function (filePath) {
    return readFile(filePath, 'utf-8')
};

var server = http.createServer(function (request, response) {
    if (request.method === 'GET' && request.url === '/index.html') {
        response.end('hello')
    }
    else if (request.method === 'POST' && request.url === '/index.html') {
        let rawData = '';
        request.on('data', (chunk) => {
            rawData += chunk;
        });
        request.on('end', () => {
            let number = JSON.parse(rawData)
            console.log(number)
            response.end('END!')
        })
    }
    let rawData = '';
    request.on('data', (chunk) => {
        rawData += chunk;
    });
    request.on('end', () => {
        var filePath = '';
        if (request.url === '/') {
            filePath = 'index.html'
        }
        else { filePath = request.url.slice[1] }
        html(filePath)
            .then(data => response.end(data))
            .catch(() => response.end('404'))
    });
});

server.listen(PORT);


//Twilio browser to phone code

// var accountSid = 'AC5816afdd1fc2b012315ffeb06cc73ccb'; // Your Account SID from www.twilio.com/console
// var authToken = '35d3e7292f8bffcdac77522bdb030e6a';   // Your Auth Token from www.twilio.com/console

// var client = new twilio(accountSid, authToken);

// client.messages.create({
//     body: 'Hello from Node',
//     to: '+11111111111',  // Text this number
//     from: '+15012145667' // From a valid Twilio number
// })
//     .then((message) => console.log(message.sid));


