let canvas = d3.select("body")
            .append("svg")
            .attr("width", 1024)
            .attr("height", 768);

var penColor='black';
var colorBlue = document.getElementById("color-blue");
var colorRed = document.getElementById("color-red");
var colorGreen = document.getElementById("color-green");
var colorBlue = document.getElementById("color-blue");
var colorYellow = document.getElementById("color-yellow");
var colorWhite = document.getElementById("color-white");

colorBlue.addEventListener('click', function(){
    penColor = 'blue';
})
colorRed.addEventListener('click', function(){
    penColor = 'red';
})
colorGreen.addEventListener('click', function(){
    penColor = 'green';
})
colorYellow.addEventListener('click', function(){
    penColor = 'yellow';
})
colorWhite.addEventListener('click', function(){
    penColor = 'white';
})

var socket  = io.connect();

circle = (hzPosition, vtPosition, radius, fill) => {
    let circle = canvas.append("circle")
                .attr("cx", hzPosition)
                .attr("cy", vtPosition)
                .attr("r", radius)
                .attr("fill", fill);
};
// circle(250,250,50,"red");

rect = (width, height) => {
    let rect = canvas.append("rect")
                .attr("width", width)
                .attr("height", height);
};
// rect(100,75);

strLine = (firstHz, distTop1, secondHz, distTop2, color, width) => {
    let line = canvas.append("line")
                .attr("x1", firstHz)
                .attr("y1", distTop1)
                .attr("x2", secondHz)
                .attr("y2",distTop2)
                .attr("stroke", color) 
                .attr("stroke-width", width);
};
// strLine(10,80,600,80, "blue",10);

let line = d3.line()
            .curve(d3.curveBasis);
        
let svg = d3.select("svg")
        .call(d3.drag()
            .container(function() { return this; })
            .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on("start", dragstarted));

function dragstarted() {
    var d = d3.event.subject,
        active = svg.append("path").datum(d),
        x0 = d3.event.x,
        y0 = d3.event.y;
    // need this variable to be able to add a single dot 
    // to a canvas
    let wasDragged = false;

    d3.event.on("drag", function() {
        var x1 = d3.event.x,
            y1 = d3.event.y,
            dx = x1 - x0,
            dy = y1 - y0;
            
        if (dx * dx + dy * dy > 100) {d.push([x0 = x1, y0 = y1]);
        }
        else d[d.length - 1] = [x1, y1];
        //add line
        active.attr("d", line);
        active.attr('stroke', penColor);
        socket.emit('real_time_line', d);
    });

    d3.event.on("end", () => {
        // add dot
        if (!wasDragged) {
            active.attr("d", line);
            active.attr('stroke', penColor);
            socket.emit('real_time_line', d);
        }
        socket.emit('stop_drag');
    });
}

// draw previously saved lines (when you reload)
let drawSavedLines = (d) => {
    let active = svg.append('path').datum(d);
    active.attr('d', line);
};

// keeping track of whether we just started dragging
// or just continue drawing previous line
let activeElement;
let needPath = true;

let drawLineRealTime = (d) => {
    if (needPath) {
        activeElement = svg.append("path")
    } 
    activeElement.datum(d);
    activeElement.attr('d', line);
    activeElement.attr('stroke', penColor);
    needPath = false;
};

let undo = (signalFromSocket) => {
    let lastPath = document.querySelector('svg').lastChild;
    lastPath.remove();

    if (!signalFromSocket) {
        socket.emit('undo');
    }
};


const undoButton = document.querySelector('#undo');
undoButton.addEventListener('click', () => { undo(false);} );

socket.on('undo', () => { undo(true); });

socket.on('draw_line', (d) => {
    drawSavedLines(d);
});

socket.on('real_time_line', (d) => {
    drawLineRealTime(d);
});

socket.on('stop_drag', () => {
    needPath = true;
});



