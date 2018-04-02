let canvas = d3.select("body")
            .append("svg")
            .attr("width", 1024)
            .attr("height", 768);

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

//determines how the drawn line curves using B-spline
let line = d3.line()
            .curve(d3.curveBasis);
        
//identifies and starts a drag event within the svg container, returning x and y coordinates
let svg = d3.select("svg");


let drawBtn = document.querySelector('#drawTool');
drawBtn.addEventListener('click', () => {
        svg.call(d3.drag()
            .container(function() { return this; })
            .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on('start', drawStarted));
});

//Freehand drawing tool function
function drawStarted() {
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
        socket.emit('real_time_line', d);
    });

    d3.event.on("end", () => {
        // add dot
        if (!wasDragged) {
            active.attr("d", line);
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
        activeElement = svg.append("path");
    } 
    activeElement.datum(d);
    activeElement.attr('d', line);
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

//keeps track of whether we just started dragging
var dragging = false,
    drawing = false,
    startPoint;

// var svg = d3.select('body').append('svg')
//     .attr('height', 1000)
//     .attr('width', 1000);


let poly = () => {

    let points = [],
        g;

    //handles drag event behavior
    let polydrag = d3.drag()
        .on('start', handleDrag)
        .on('end', function (d) {
            dragging = false;
        });
    
    //begins drawing each line in the polygon after a mouse-click
    svg.on('mouseup', function () {
        if (dragging) return;
        drawing = true;
        startPoint = [d3.mouse(this)[0], d3.mouse(this)[1]];
        if (svg.select('g.drawPoly').empty()) g = svg.append('g').attr('class', 'drawPoly');
        if (d3.event.target.hasAttribute('is-handle')) {
            closePolygon();
            return;
        }

        //Pushes current mouse location to points array
        points.push(d3.mouse(this));

        //Places temporary outline to preview polygon while building
        g.select('polyline').remove();
        var polyline = g.append('polyline').attr('points', points)
            .style('fill', 'none')
            .attr('stroke', '#000');
        //Create circular nodes for shape reconnection
        for (var i = 0; i < points.length; i++) {
            g.append('circle')
                .attr('cx', points[i][0])
                .attr('cy', points[i][1])
                .attr('r', 3)
                .attr('fill', '#FF530D')
                .attr('stroke', 'none')
                .attr('is-handle', 'true')
                .style({
                    cursor: 'pointer'
                });
        }
    });

    //after the polygon is drawn, append to variable
    function closePolygon() {
        svg.select('g.drawPoly').remove();
        var g = svg.append('g');
        g.append('polygon')
            .attr('points', points)
            .style('fill', getRandomColor());
        //remove circular nodes after polygon is complete
        for (var i = 0; i < points.length; i++) {
            var circle = g.selectAll('circles')
                .data([points[i]])
                .enter()
                .append('circle')
                .attr('cx', points[i][0])
                .attr('cy', points[i][1])
                .attr('r', 1)
                .attr('fill', 'none')
                .attr('is-handle', 'true')
                .style({
                    cursor: 'move'
                })
                .call(polydrag);
        }
        points.splice(0);
        drawing = false;
    }

    //While drawing, adds blue line preview and removes after each point
    svg.on('mousemove', function () {
        if (!drawing) return;
        var g = d3.select('g.drawPoly');
        g.select('line').remove();
        var line = g.append('line')
            .attr('x1', startPoint[0])
            .attr('y1', startPoint[1])
            .attr('x2', d3.mouse(this)[0] + 2)
            .attr('y2', d3.mouse(this)[1])
            .attr('stroke', '#53DBF3')
            .attr('stroke-width', 1);
    });

    //handles new drag behavior
    function handleDrag() {
        if (drawing) return;
        var dragCircle = d3.select(this),
            newPoints = [],
            circle;
        dragging = true;
        var poly = d3.select(this.parentNode).select('polygon');
        var circles = d3.select(this.parentNode).selectAll('circle');
        dragCircle
            .attr('cx', d3.event.x)
            .attr('cy', d3.event.y);
        for (var i = 0; i < circles[0].length; i++) {
            circle = d3.select(circles[0][i]);
            newPoints.push([circle.attr('cx'), circle.attr('cy')]);
        }
        poly.attr('points', newPoints);
    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
};
//saves points where mouse clicks have stopped
let polyBtn = document.querySelector('#polygonTool');
polyBtn.addEventListener('click', poly);