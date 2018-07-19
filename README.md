# BrainstormMe

## Overview:
Online whiteboard for collaborative brainstorming. Users can: 
 * draw a line 
 * draw a polygon
 * change color
 * change width of the line
 * join a conference call (Twilio API)
 * undo drawing 


#### Watch demo:

<a href="https://youtu.be/flQ2z83v04A">
  <img src="https://user-images.githubusercontent.com/34459770/40571539-75e942d8-6068-11e8-9835-1cac2b655949.png" height="150"/>
</a>

#### Screenshots:


<br/>

<div>
  <img src="https://user-images.githubusercontent.com/34459770/40571487-b32efb7a-6067-11e8-8f2f-4d121173354b.png" height="300" border="5" style="margin: 50px;"/>
  <img src="https://user-images.githubusercontent.com/34459770/40571488-b46bf858-6067-11e8-94be-26d9e416cd12.png" height="300" style="margin: 50px;"/>
  <img src="https://user-images.githubusercontent.com/34459770/40571490-b566a29e-6067-11e8-927e-4674bd32a199.png" height="300" style="margin: 50px;"/>
</div>

## Team Members & Roles:
* [Illia Chaban](https://github.com/illiaChaban) 
* [Tigbemileke Ojo](https://github.com/SagePadawan) 
* [Jaehee Kim](https://github.com/jaeheekim051510) 

## Technologies used:
* Socket.io
* D3
* Node
* PostgreSQL 
* Javascript
* Twilio API
* Express
* HTML
* CSS
* Heroku

## Code snippets:

```javascript
io.on('connection', function (socket) {

    getElementHistory().then( (el_history) => {
        for (let objD of el_history) {
            if (objD !== '') {
                if (objD.type === 'polygon') {
                    socket.emit('draw_poly', objD)
                } else {
                    socket.emit('draw_line', objD);
                }
    
            }
        }
    })

    socket.on('start_line', (objD) => {
        insertDB(objD);
        socket.broadcast.emit('start_line', objD);
    })

    socket.on('real_time_line', (objD) => {
        updateElDB(objD);
        socket.broadcast.emit('real_time_line', objD);
        
    });

    socket.on('undo', (projectId) => {
        deleteLastElDB(projectId);
        io.emit('undo', (projectId));
    })

    socket.on('draw_poly', (objD) => {
        insertDB(objD);
        socket.broadcast.emit('draw_poly', objD);
        
    })
});

################### front end

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
```

