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
        if (d !== '') {
            socket.emit('draw_line', d);
        }
    }
    // need this variable to keep track of whether we 
    // are still dragging previous line or this is a new one
    let needLastArr = true;

    socket.on('real_time_line', (d) => {
        if (needLastArr) line_history.push('');
        let lastIndex = line_history.length - 1;
        line_history[lastIndex] = d;
        //sends signal to all sockets except itself
        socket.broadcast.emit('real_time_line', d);
        needLastArr = false;
    });

    socket.on('stop_drag', () => {
        needLastArr = true;
        socket.broadcast.emit('stop_drag');
    });
    
    socket.on('undo', () => {
        line_history.pop();
        socket.broadcast.emit('undo');
    });
});
