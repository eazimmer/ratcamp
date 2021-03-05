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

  for (var i in sockets_to_names) {
    validated_users.push(sockets_to_names[i]["name"])
  }

  io.emit('updateonlineusers', validated_users);
}

io.on('connection', socket => {
  socket.join('newbie');
  messages.map((m) => io.to('newbie').emit('msgrecv', JSON.stringify(m)));
  socket.leave('newbie');


  socket.on('chat', message => {
    let data = JSON.parse(message);
    addMsg(data.name, data.msg);
  });

  socket.on('login-name', name => {
    var socket_id = socket.id.toString()
    sockets_to_names.push({
      "id" : socket_id,
      "name" : name
    })
    onlineUsersChanged()
  });

  socket.on("disconnect", () => {
    for (var i in sockets_to_names) {
      if (sockets_to_names[i]["id"] === socket.id) {
        sockets_to_names.splice(i, 1)
      }
    }
    onlineUsersChanged()
  });

})
