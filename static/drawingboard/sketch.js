let canvas = d3.select("body")
    .append("svg")
    .attr("width", '100vw')
    .attr("height", '100vh');


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

//pen color
var penColor = 'black';
const penColorButtons = document.querySelectorAll('.colors.size button');
penColorButtons.forEach( (btn) => {
    btn.addEventListener('click', () => {
        penColor = btn.id.split('').splice(6).join('');
        if (penColor === 'random') {
            penColor = getRandomColor();
            btn.style.backgroundColor = penColor;
        }
    })
})

//stroke-width
var strokeWidth = '3px';
const penSizeButtons = document.querySelectorAll('.pen-size button');
penSizeButtons.forEach( (btn) => {
    btn.addEventListener('click', () => {
        strokeWidth = btn.id.split('').splice(7).join('');
    })
})

var socket = io.connect();

let countElements = () => {
    return canvas._groups[0][0].childElementCount;
};

// keeps track of an active element
// possible bug when drawing simultaneously???
let active;

//determines how the drawn line curves using B-spline
let line = d3.line()
    .curve(d3.curveBasis);

const svg = d3.select("svg");

let drawBtn = document.querySelector('#drawTool');
drawBtn.addEventListener('click', () => {
    svg.call(d3.drag()
        .container(function () { return this; })
        .subject(function () { var p = [d3.event.x, d3.event.y]; return [p, p]; })
        .on('start', drawStarted));
});

//Freehand drawing tool function
function drawStarted() {
    var d = d3.event.subject;
    objD = {projectid: 1, el_count: countElements() + 1, d: d, color: penColor, size: strokeWidth, type: 'line' };
    let x0 = d3.event.x,
        y0 = d3.event.y;

    drawLine(objD);
    socket.emit('start_line', objD);

    d3.event.on("drag", function () {
        var x1 = d3.event.x,
            y1 = d3.event.y,
            dx = x1 - x0,
            dy = y1 - y0;

        if (dx * dx + dy * dy > 50) {
            objD.d.push([x0 = x1, y0 = y1]);
        }
        else objD.d[d.length - 1] = [x1, y1];

        updateLineRealTime(objD);
        socket.emit('real_time_line', objD);
    });
}

let drawLine = (objD) => {
    active = svg.append('path').datum(objD.d);
    active.attr('d', line);
    active.attr('stroke', objD.color);
    active.attr('stroke-width', objD.size);
};

let updateLineRealTime = (objD) => {
    active.datum(objD.d);
    active.attr('d', line);
    active.attr('stroke', objD.color);
    active.attr('stroke-width', objD.size);
};

let undo = () => {
    let lastPath = document.querySelector('svg').lastChild
    if (lastPath) lastPath.remove();
}

const undoButton = document.querySelector('#undo');
undoButton.addEventListener('click', () => socket.emit('undo', 1));  //projectId

////################### drawing polygon ####################
let poly = () => {

    var dragging = false,
        drawing = false,
        startPoint;

    let points = [],
        g;

    //begins drawing each line in the polygon after a mouse-click
    svg.on('mouseup', function () {
        if (dragging) return;
        drawing = true;
        startPoint = [d3.mouse(this)[0], d3.mouse(this)[1]];
        //Sets the g object's class to drawPoly
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
                .style('cursor', 'pointer');
        }
    });

    //after the polygon is drawn, append to variable
    function closePolygon() {
        svg.select('g.drawPoly').remove();
        var g = svg.append('g');
        g.append('polygon')
            .attr('points', points)
            .style('fill', penColor);

        let objD = {projectid: 1, el_count: countElements(), d: points, color: penColor, type: 'polygon', size: '3px'}
        socket.emit('draw_poly', objD);

        points.splice(0);
        drawing = false;
    }

    //While drawing, adds blue line preview and removes after each point
    svg.on('mousemove', function () {
        if (!drawing) return;
        var g = d3.select('g.drawPoly');
        //create and remove the blue line that traces out the polygon being drawn
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
        dragging = true;
    }
};

let polyBtn = document.querySelector('#polygonTool');
polyBtn.addEventListener('click', () => {
    //reset svg listening for drag event
    d3.select('svg').on('mousedown.drag', null);
    poly();

});

let drawPolyFromSocket = (objD) => {
    var g = svg.append('g');
    g.append('polygon')
        .attr('points', objD.d)
        .style('fill', objD.color);
}

socket.on('draw_poly', drawPolyFromSocket)
socket.on('undo', undo);
socket.on('draw_line', drawLine);
socket.on('real_time_line', updateLineRealTime);
socket.on('start_line', drawLine)




