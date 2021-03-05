// http://localhost:3002/
// Access this link to hit the locally-running-server's homepage

// https://csi330-group2.herokuapp.com/
// Live Heroku server

// Require packages and set the port
const express = require('express');
const bodyParser = require('body-parser');
const service = require('./index.js');
const app = express();
const port = process.env.PORT || 3002;
const host = '0.0.0.0';
const path = require('path');

let messages = [];
let users = {};

let sockets_to_names = [];

// Use Node.js body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

service(app);

app.use(express.static(path.join(__dirname + '/front-end')));

// Start the server
const server = app.listen(port, host, (error) => {
  if (error) return console.log(`Error: ${error}`);

  console.log(`Server listening on port ${server.address().port}`);
});



const io = require('socket.io')(server);

function addMsg(name, msg) {
  if (!(name in users)) {
    users[name] = {};
    users[name]['nextmsgid']= 0;
  }
  let data = { id: (name + '-' + users[name].nextmsgid), msg: msg, name: name };
  messages.push(data);
  io.emit('msgrecv', JSON.stringify(data));
  users[name].nextmsgid += 1;
}

function onlineUsersChanged() {
  let validated_users = []

  var values = Object.keys(sockets_to_names).map(function(key) {
    return JSON.stringify(sockets_to_names[key]);
  })

  let socket_keys = Object.keys(sockets_to_names)

  for (var key in socket_keys) {
    validated_users.push(sockets_to_names[socket_keys[key]])
    console.log("Identified user: " + sockets_to_names[socket_keys[key]])
  }

  //io.emit('msgrecv', JSON.stringify(data));
  console.log("Online users: " + values)
}

io.on('connection', socket => {
  console.log('Some client connected');

  socket.on('chat', message => {
    let data = JSON.parse(message);
    console.log("Username received" + data.name)
    addMsg(data.name, data.msg);
  });

  socket.on('login-name', name => {
    console.log(`New user joined with login-name: ${name}`);
    var socket_id = socket.id.toString()
    sockets_to_names.push({[socket_id] : name.toString()})
    console.log("Online users: ")
    console.log(sockets_to_names)

    onlineUsersChanged()
  });

  socket.on("disconnect", () => {
    console.log(socket.id + " disconnected"); // undefined
    for (var i in sockets_to_names) {
      if (sockets_to_names[i].hasOwnProperty(socket.id.toString())) {
        sockets_to_names.splice(i, 1)
      }
    }
    console.log("Online users: ")
    console.log(sockets_to_names)

    onlineUsersChanged()
  });

})
