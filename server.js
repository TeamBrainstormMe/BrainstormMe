var express = require('express'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    urlencoded = require('body-parser').urlencoded,
    socketIo = require('socket.io'),
    twilio = require('twilio');

var promisify = require('util').promisify;

const pg = require('pg-promise')();
// const dbConfig = 'postgres://illia_chaban@localhost:5432/brainMe';
const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'brainMe',
    user: 'illia_chaban',
    // password: 'user-password'
};
const db = pg(dbConfig);

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
        recordingStatusCallback: 'https://ec2-18-219-233-254.us-east-2.compute.amazonaws.com/getRecording',
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
let getElementHistory = () => {
    return db.query(`SELECT * FROM el_history ORDER BY projectid, el_count;`)
        .then((elements) => {
            el_history = [];
            elements.forEach((element) => {
                element.d = JSON.parse(element.d);
                el_history.push(element);
            })
            return el_history;
        })
}

let insertDB = (objD) => {
    return db.query(`
            INSERT INTO el_history VALUES (
            1, ${objD.el_count}, '${objD.type}', '${JSON.stringify(objD.d)}', '${objD.color}', '${objD.size}');`);
}
    
let updateElDB = (objD) => {
    return db.query(`
            UPDATE el_history SET
                d = '${JSON.stringify(objD.d)}'
                WHERE projectid = ${objD.projectid} AND
                el_count = ${objD.el_count};`);
}

let deleteLastElDB = (projectId) => {
    return db.query(`
        SELECT max(el_count) FROM el_history
        WHERE projectid = ${projectId};`)
            .then( result => result[0].max)
            .then( (lastCount) => {
                db.query(`DELETE FROM el_history
                WHERE projectid = ${projectId} 
                AND el_count = ${lastCount};`)
            })
}

// event-handler for new incoming connections
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
