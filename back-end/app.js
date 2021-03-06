// http://localhost:3002/
// Use this to hit the locally-running-server's homepage

// Required packages and set up ports for local hosting
const express = require('express');
const bodyParser = require('body-parser');
const service = require('./index.js');
const app = express();
const port = process.env.PORT || 3002;
const host = '0.0.0.0';
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://eric:csi330-group2@agile.xa93o.mongodb.net/test?retryWrites=true&w=majority";


// Stored data
let messages = []; // Objects representing messages containing "id", "msg", and "name"
let users_to_message_ids = {}; // Mapping of users to their respective message id counts
let sockets_to_names = []; // List of maps of socket ids to usernames: "id", and "name" keys


// Use Node.js body parsing middleware to help access message contents
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));


service(app); // Link endpoints page
app.use(express.static(path.join(__dirname + '/front-end'))); // Establish working directory in filesystem


// Start the server
const server = app.listen(port, host, (error) => {
  if (error) return console.log(`Error: ${error}`);
  console.log(`Server listening on port ${server.address().port}`);
});


// Initialize socket.io object linked to now-live server
const io = require('socket.io')(server);


// Handle messages received by server
function registerMessage(user, msg) {

  // Begin tracking new user and their respective message ids
  if (!(user in users_to_message_ids)) {
    users_to_message_ids[user] = {};
    users_to_message_ids[user]['nextmsgid']= 0;
  }

  // Increment user's message id count
  users_to_message_ids[user].nextmsgid += 1;

  // Construct message object
  let data = {
    id: (user + '-' + users_to_message_ids[user].nextmsgid),
    msg: msg,
    name: user
  };

  // Update list of messages
  messages.push(data);

  // Broadcast message to clients
  broadcastMessage(data);
}


// Send message received by server to all clients
function broadcastMessage(data_object) {
  io.emit('msgrecv', JSON.stringify(data_object));
}


// Update clients of change in online users
function broadcastChangeInOnlineUsers() {
  let validated_users = []

  // Pull currently online users out of map of socket ids to usernames
  for (var i in sockets_to_names) {
    validated_users.push(sockets_to_names[i]["name"])
  }

  // Broadcast new list of online users to all clients
  io.emit('updateonlineusers', validated_users);
}


// Socket connection event
io.on('connection', socket => {

  // Endpoint handling incoming message
  socket.on('chat', message => {
    let data = JSON.parse(message);
    registerMessage(data.name, data.msg);
  });


  // Endpoint registering new connection with a chosen username
  socket.on('login-name', name => {
    var socket_id = socket.id.toString()

    sockets_to_names.push({
      "id" : socket_id,
      "name" : name
    })

    broadcastChangeInOnlineUsers() // Update clients with new online user list
  });


  // Endpoint handling disconnects
  socket.on("disconnect", () => {

    // Find disconnecting socket and remove its entry in socket -> user map
    for (var i in sockets_to_names) {
      if (sockets_to_names[i]["id"] === socket.id) {
        sockets_to_names.splice(i, 1)
      }
    }

    broadcastChangeInOnlineUsers() // Update clients with new online user list
  });
})


// Handles database request
async function menu(operation, db_name = "", credentials_object = "") {

  // Initialize client object for this request
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  // Execute designated functionality
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    switch (operation) {
      case "store": { // Creates a new database storing user login credentials
        await store_credentials(client, db_name, credentials_object)
        break;
      }
      case "query": {  // Queries to check whether credentials are valid
        await check_credentials(client, db_name, credentials_object)
        break;
      }
    }

  } catch (e) {
    console.error(e); // Handle potential errors
  } finally {
    await client.close(); // Close database connection
  }
}


// Create a new database, with a "creds" collection storing a document of user login credentials
async function store_credentials(client, db_name, credentials_object) {
  try {
    await client.db(db_name).collection("creds").insertOne(credentials_object);
    console.log("Credentials stored successfully.")
  } catch (error) {
    console.log(`ERROR: When storing credentials in database: ${error}`)

  }
}


// Check user's database to see if provided credentials are valid
async function check_credentials(client, db_name, credentials_object) {
  try {
    await client.db(credentials_object["display-name"]).collection("creds").findOne(credentials_object);
    console.log("Credentials identified successfully.")
  } catch (error) {
    console.log(`ERROR: When querying database: ${error}`)
  }
}
