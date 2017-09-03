var port = process.env.PORT || 3000;
// express
var express = require('express');
var app = express();
// http
var http = require('http')
var server = http.Server(app)
//request
var rp = require('request-promise');
// socket.io
var socketio = require('socket.io');
var io = socketio.listen(server);
// MongoDB Docker 
// docker run -d -p 27017:27017 -p 28017:28017 -e AUTH=no tutum/mongodb
var databaseurl = process.env.HEROKUDB || "172.17.0.1:27017/notesReleaseStat?autoReconnect=true";
var mongojs = require('mongojs');
var db = mongojs(databaseurl)
// body-parser
var bodyParser = require('body-parser');

const user = "nuttyartist";
const repo = "notes";
const releaseTag = "v1.0.0";
const hostUrl = 'https://api.github.com/repos/'+ user + '/' + repo + '/releases/tags/' + releaseTag;

var previousTotalValue   = 0;
var previousWindowsValue = 0;
var previousLinuxValue   = 0;
var previousMacValue     = 0;

function getDataFromGithub(){

    var options = {
        uri: hostUrl,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    var timestamp = Math.floor(Date.now()/60000) * 60000;

    rp(options)
    .then(function (release) {
        var countAll     = 0;
        var countLinux   = 0;
        var countWindows = 0;
        var countMac     = 0;
        
        release.assets.forEach(function(installer){
                
            var fileName = JSON.stringify(installer.name);

            if(fileName.indexOf(".dmg") !== -1){
                countMac = installer.download_count;
            }else if(fileName.indexOf(".exe")!== -1){
                countWindows = installer.download_count;
            }else if(fileName.indexOf(".deb")!== -1||
                fileName.indexOf(".snap")!== -1 ||
                fileName.indexOf(".AppImage")!== -1 ){
                countLinux += installer.download_count;
            }
        });

        countAll = countMac + countWindows + countLinux;

        previousTotalValue   = countAll;
        previousWindowsValue = countWindows;
        previousLinuxValue   = countLinux;
        previousMacValue     = countMac;

        addRecord(timestamp, releaseTag, countWindows, countMac, countLinux, countAll);
    })
    .catch(function (err) {
        var timestamp = Math.floor(Date.now()/60000) * 60000;
        addRecord(timestamp, releaseTag, previousWindowsValue, previousMacValue, previousLinuxValue, previousTotalValue);
        
        console.log("** ERROR : ", err.message);
        // API call failed...
    });
}

function addRecord(timestampValue, versionValue, windowsCntValue, macCntValue, linuxCntValue, totalCntValue)
{
    notesReleaseStat.save({
        timestamp:  timestampValue, 
        version:    versionValue, 
        windowsCnt: windowsCntValue, 
        macCnt:     macCntValue,
        linuxCnt:   linuxCntValue,
        totalCnt:   totalCntValue}
        , function(err, saved) {
            if( err || !saved ) console.log("User not saved");
            //else console.log("record saved : ", timestampValue, new Date(timestampValue).toTimeString(),totalCntValue);
    }); 
}


function sendTotal(socket){

    var totalRecord = [];

    notesReleaseStat.find().sort({"timestamp":-1}).toArray(function (err, items) {
        if(err){
            console("** ERROR [sendTotal]: ", err.message);
            return;
        }else{
            if(items.length > 0){
                totalRecord.push(items[0]);
            }            
        }

        socket.emit('updateRecordTotal', totalRecord);

    });
}


function sendHourValues(socket){
    var dateNow = Math.floor(Date.now()/60000) * 60000;
    var timestampMin = dateNow - (60*61*1000)

    var hourItems = [];

    notesReleaseStat.find({ timestamp: {$gte: timestampMin } }).sort({"timestamp":-1}).limit(61).toArray(function (err, items) {
                
        for(var i=1; i<61; i++){
            var minuteRangeMin =  dateNow - (60*i*1000);
            var minuteRangeMax =  dateNow - (60*(i-1)*1000);

            var diffMinuteWindowsValue = 0;
            var diffMinuteMacValue     = 0;
            var diffMinuteLinuxValue   = 0;
            var diffMinuteTotalValue   = 0;

            if(err){
                console("** ERROR [sendHourValues]: ", err.message);

            }else{

                var allMinuteItems;

                if(items.length > 0){

                    allMinuteItems = items.filter(function( item ) {
                        return (item.timestamp >= minuteRangeMin && item.timestamp <= minuteRangeMax);
                    }).sort({"timestamp":-1});

                    if(allMinuteItems.length == 2){
                        diffMinuteWindowsValue = allMinuteItems[0].windowsCnt - allMinuteItems[1].windowsCnt ;
                        diffMinuteMacValue     = allMinuteItems[0].macCnt     - allMinuteItems[1].macCnt     ;
                        diffMinuteLinuxValue   = allMinuteItems[0].linuxCnt   - allMinuteItems[1].linuxCnt   ;
                        diffMinuteTotalValue   = allMinuteItems[0].totalCnt   - allMinuteItems[1].totalCnt   ;
                    }
                }
            }

            hourItems.push({
                timestamp         : minuteRangeMax, 
                version           : releaseTag, 
                minuteWindows     : diffMinuteWindowsValue, 
                minuteMac         : diffMinuteMacValue,
                minuteLinux       : diffMinuteLinuxValue,
                minuteTotal       : diffMinuteTotalValue  
            });
        }


        socket.emit('updateRecordHour', hourItems);
    });
}

function sendDayValues(socket) {

    var dateNow = Math.floor(Date.now()/3600000) * 3600000;
    var timestampMin =  dateNow - (3600*25*1000);

    var dayItems = [];

    notesReleaseStat.find({ timestamp: { $gte: timestampMin} }).sort({"timestamp":-1}).limit(25*61).toArray(function (err, items) {

        for(var i=1; i<25; i++){
            var hourRangeMin =  dateNow - (3600*i*1000);
            var hourRangeMax =  dateNow - (3600*(i-1)*1000);

            var allHourItems;

            var hourWindowsValue = 0;
            var hourMacValue     = 0;
            var hourLinuxValue   = 0;
            var hourTotalValue   = 0;

            if(err){
                
                console("** ERROR [sendDayValues]: ", err.message);

            }else{

                if(items.length > 0){

                    allHourItems = items.filter(function( item ) {
                        return (item.timestamp > hourRangeMin && item.timestamp <= hourRangeMax);
                    }).sort(function(itemA,itemB){return itemB.timestamp - itemA.timestamp;});

                    if(allHourItems.length > 0){
                        hourWindowsValue = allHourItems[0].windowsCnt  - allHourItems[allHourItems.length - 1].windowsCnt ;
                        hourMacValue     = allHourItems[0].macCnt      - allHourItems[allHourItems.length - 1].macCnt     ;
                        hourLinuxValue   = allHourItems[0].linuxCnt    - allHourItems[allHourItems.length - 1].linuxCnt   ;
                        hourTotalValue   = allHourItems[0].totalCnt    - allHourItems[allHourItems.length - 1].totalCnt   ;
                    }
                }
            }

            dayItems.push({
                timestampHourMin : hourRangeMin, 
                timestampHourMax : hourRangeMax,
                version          : releaseTag, 
                hourWindows      : hourWindowsValue, 
                hourMac          : hourMacValue,
                hourLinux        : hourLinuxValue,
                hourTotal        : hourTotalValue
            });
        }

        socket.emit('updateRecordDay', dayItems);
        
    });
}

db.createCollection("notesReleaseStat", {});
var notesReleaseStat = db.collection('notesReleaseStat');

db.on('error', function (err) {
    console.log('database error', err);
})

db.on('connect', function () {
    console.log('database connected');
    var count = 0;




    // get
    app.get('/notesReleaseStat', function(req, res){
        console.log("received a GET request");

        notesReleaseStat.find(function(err, docs){
            res.json(docs);
        });
    });

    io.on('connection', function (socket) {
        
        var initGraphs = function(){
            sendTotal(socket);
            sendHourValues(socket);
            sendDayValues(socket);
        }

        console.log("new socket connected");
        initGraphs();

    })

    setInterval(function(){
            count++;
            //console.log(count);
            getDataFromGithub();
            sendTotal(io);
            sendHourValues(io);
            if(count / 60 === 1){
                count = 0;
                sendDayValues(io);
            }
        }, 60000);
})


app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/node_modules"));
app.use(bodyParser.json());

// start server
server.listen(port, function(){
    console.log('Start listening port ' + port);
});