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

let line = d3.line()
            .curve(d3.curveBasis);
        

let svg = d3.select("svg")
        .call(d3.drag()
            .container(function() { return this; })
            .subject(function() { var p = [d3.event.x, d3.event.y]; return [p, p]; })
            .on("start", dragstarted));

let activeElement = svg.append("path");

function dragstarted() {
    var d = d3.event.subject,
        active = svg.append("path").datum(d),
        x0 = d3.event.x,
        y0 = d3.event.y;

    activeElement = active;

    d3.event.on("drag", function() {
        var x1 = d3.event.x,
            y1 = d3.event.y,
            dx = x1 - x0,
            dy = y1 - y0;
        
        if (dx * dx + dy * dy > 100) {d.push([x0 = x1, y0 = y1]);
        }
        else d[d.length - 1] = [x1, y1];
        active.attr("d", line);
        
        socket.emit('real_time_line', d);
    });

    d3.event.on("end", () => {
        socket.emit('end');
    })
}

let drawLineFromSocket = (d) => {
    let active = svg.append('path').datum(d);
    active.attr('d', line);
}

socket.on('draw_line', (d) => {
    drawLineFromSocket(d);
})

socket.on('real_time_line', (d) => {
    drawLineRealTime(d);
})

socket.on('end', () => {
    activeElement = svg.append("path");
})

let drawLineRealTime = (d) => {
    activeElement.datum(d);
    activeElement.attr('d', line);
}