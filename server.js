var express = require('express'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    urlencoded = require('body-parser').urlencoded,
    socketIo = require('socket.io'),
    twilio = require('twilio');

const accountSid = 'AC2ceea3a33d11e9a9412fd25ae894828a';
const authToken = 'e8345cab51239a74558a895455dc93b2';
//https://www.twilio.com/console/voice/twiml/apps  // brain2 app  ++ the line 54
const appSID = 'AP1695bd9bd03148e7983d3616d396f48f';
const callerId = '+14045311571';

const ClientCapability = require('twilio').jwt.ClientCapability;
const VoiceResponse = require('twilio').twiml.VoiceResponse;

function tokenGenerator() {
    const identity = 'Guest';
    const capability = new ClientCapability({
        accountSid: accountSid,
        authToken: authToken,
    });

    capability.addScope(new ClientCapability.IncomingClientScope(identity));
    capability.addScope(new ClientCapability.OutgoingClientScope({
        applicationSid: appSID,
        clientName: identity,
    }));
    return {
        identity: identity,
        token: capability.toJwt(),
    };
};

const Router = require('express').Router;
const router = new Router();

router.get('/token', (req, res) => {
    res.send(tokenGenerator());
});

router.post('/voice', twilio.webhook({ validate: false }), function (req, res, next) {
    var twiml = new VoiceResponse();
    var dial = twiml.dial({
        callerId: callerId,
        record: 'record-from-answer',
        // record: 'record-from-ringing',
        //change that !!!!
        recordingStatusCallback: 'https://26bba057.ngrok.io/getRecording',
    });
    dial.conference('My conference')
    res.send(twiml.toString());
});


const client = require('twilio')(accountSid, authToken);
router.post('/getRecording', (req, res) => {
    // console.log(req.body['RecordingDuration']);
    let recordingId = req.body.RecordingSid;

    const promise = client.api.v2010
        .accounts(accountSid)
        .recordings(recordingId)
        .fetch();
    promise.then(response => {
        // console.log(response);
        let regexp = /([^]*?).json/;
        console.log('date created: ' + response.dateCreated);
        console.log('date updated: ' + response.dateUpdated);

        //save the audio file
        https.get(regexp.exec('https://api.twilio.com' + response.uri)[1] + '.mp3', (res) => {
            let fileStream = fs.createWriteStream('record3.mp3');
            res.pipe(fileStream);
        });
    });
})

const app = express();
app.use(express.static(__dirname + '/static'));
app.use(urlencoded({ extended: false }));
app.use(router);
const server = http.createServer(app)

console.log('Twilio Client app HTTP server running at http://localhost:3000');
server.listen(3000);
var io = socketIo.listen(server);


////############## canvas ################
// array of all lines drawn
var line_history = [];

// event-handler for new incoming connections
io.on('connection', function (socket) {
    // first send the history to the new client
    for (let objD of line_history) {
        if (objD !== '') {
            if (objD.type === 'polygon') {
                socket.emit('draw_poly', objD)
            } else {
                socket.emit('draw_line', objD);
            }

        }
    }
    // need this variable to keep track of whether we 
    // are still dragging previous line or this is a new one
    let needLastArr = true;

    socket.on('real_time_line', (objD) => {
        if (needLastArr) line_history.push('');
        let lastIndex = line_history.length - 1;
        line_history[lastIndex] = objD;
        //sends signal to all sockets except the socket it came from
        socket.broadcast.emit('real_time_line', objD);
        needLastArr = false;
    });

    socket.on('stop_drag', () => {
        needLastArr = true;
        socket.broadcast.emit('stop_drag');

    })

    socket.on('undo', () => {
        line_history.pop();
        //sends signal to everyone including the socket itself
        io.emit('undo');
    })

    socket.on('draw_poly', (objD) => {
        line_history.push(objD);
        socket.broadcast.emit('draw_poly', objD);
    })
});
