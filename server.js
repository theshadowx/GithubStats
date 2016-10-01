var port = process.env.PORT || 3000;
// express
var express = require('express');
var app = express();
// http
var http = require('http')
var server = http.Server(app)
// socket.io
var socketio = require('socket.io');
var io = socketio.listen(server);
// MongoDB Docker 
var databaseurl = process.env.HEROKUDB || "172.17.0.1:27017/contactList?autoReconnect=true";
var mongojs = require('mongojs');
var db = mongojs(databaseurl)
// body-parser
var bodyParser = require('body-parser');

function addContact(nameStr, emailStr, numberStr)
{
    contactList.save({name: nameStr, email: emailStr, number: numberStr}, function(err, saved) {
        if( err || !saved ) console.log("User not saved");
        else console.log("User saved");
    }); 
}

db.createCollection("contactList", {});
var contactList = db.collection('contactList');

db.on('error', function (err) {
    console.log('database error', err);
})

db.on('connect', function () {
    console.log('database connected');

    // get
    app.get('/containerList', function(req, res){
        console.log("received a GET request");

        contactList.find(function(err, docs){
            res.json(docs);
        });
    });

    io.on('connection', function (socket) {
        console.log("new socket connected");
        
        socket.on('contactAdded', function (data) {
            console.log(JSON.stringify(data, null,'\t'));
            if(data){
                contactList.insert(data);
                io.emit('updateContactAdded', data);
            }
        });
    });
})


app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/node_modules"));
app.use(bodyParser.json());

// start server
server.listen(port, function(){
    console.log('Start listening port ' + port);
});