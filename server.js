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
// MongoDB
var databaseurl = "172.17.0.1:27017/contactList"
var mongojs = require('mongojs');
var db = mongojs('contactList', ['contactList'])
// body-parser
var bodyParser = require('body-parser');


db.on('error', function (err) {
    console.log('database error', err)
})

db.on('connect', function () {
    console.log('database connected')

    function addPersonToContactList(nameStr, emailStr, numberStr)
    {
        db.contactList.save({name: nameStr, email: emailStr, number: numberStr}, function(err, saved) {
            if( err || !saved ) console.log("User not saved");
            else console.log("User saved");
        }); 
    }

    db.contactList.count(function (err, count) {
        if (!err && count === 0) {
            addPersonToContactList("Ali", "ali@gmail.com", "111-111-1111");
            addPersonToContactList("Tom", "tom@gmail.com", "222-222-2222");
            addPersonToContactList("Jane", "jane@gmail.com", "333-333-3333");
            addPersonToContactList("Ahmed", "ahmed@gmail.com", "444-444-4444");
        }
    });

    // get
    app.get('/containerList', function(req, res){
        console.log("received a GET request");

        db.contactList.find(function(err, docs){
            res.json(docs);
        });
    });

    io.on('connection', function (socket) {
        console.log("new socket connected");
        
        socket.on('contactAdded', function (data) {
            console.log(JSON.stringify(data, null,'\t'));
            if(data){
                db.contactList.insert(data);
                io.emit('updateContactAdded', data);
            }
        });
    });
})


app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());



// start server
server.listen(port, function(){
    console.log('node server is just fine! and running on port - ' + port);
});