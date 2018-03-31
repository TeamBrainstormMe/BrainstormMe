var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');


// start webserver on port 8080
var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(8080);

// add directory with our static files
app.use(express.static(__dirname + '/static'));
console.log("Server running on 127.0.0.1:8080");

// array of all lines drawn
var line_history = [];

// event-handler for new incoming connections
io.on('connection', function (socket) {

    // first send the history to the new client
    for (let d of line_history) {
        socket.emit('draw_line', d);
    }
    line_history.push('');
 
    socket.on('real_time_line', (d) => {
        line_history[line_history.length - 1] = d;
        io.emit('real_time_line', d);
    })

    socket.on('end', () => {
        line_history.push('');
        io.emit('end');
    })

});
