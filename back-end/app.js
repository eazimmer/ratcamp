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
let verified_logins = []


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


// Handles database requests
async function menu(operation, db_name = "", credentials_object = "") {

  // Initialize client object for this request
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  let result = false

  // Execute designated functionality
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    switch (operation) {
      case "store": { // Creates a new database storing user login credentials
        result = await store_credentials(client, db_name, credentials_object)
        break;
      }
      case "query": {  // Queries to check whether credentials are valid
        result = await check_credentials(client, db_name, credentials_object, "login")
        break;
      }
    }

  } catch (e) {
    console.error(e); // Handle potential errors
  } finally {
    await client.close(); // Close database connection
    return result
  }
}


// Create a new database, with a "creds" collection storing a document of user login credentials
async function store_credentials(client, db_name, credentials_object) {
  try {
    if (await check_credentials(client, db_name, credentials_object, "signup")) { // Abort request if these creds already exist
      return false
    } else { // Proceed to store credentials if they are not already in database
      await client.db(db_name).collection("creds").insertOne(credentials_object);
      return true
    }
  } catch (error) { // Error handling
    console.log(`ERROR: When storing credentials in database: ${error}`)
  }
}


// Check users database to see if provided credentials are valid
async function check_credentials(client, db_name, credentials_object, action) {
  if (action === "login") { // Checking whether login credentials are valid
    try {
      let creds = await client.db(credentials_object["name"]).collection("creds").findOne({$and:[{"name" : credentials_object["name"]}, {"password" : credentials_object["password"]}]});
      if (creds == null) { // No credentials identified
        return false
      } else { // Credentials identified, login
        return true
      }
    } catch (error) { // Error handling
      console.log(`ERROR: When querying database: ${error}`)
      return false
    }
  } else { // Checking whether username is available for signup
      try {
        let creds = await client.db(credentials_object["name"]).collection("creds").findOne({"name" : credentials_object["name"]});
        if (creds == null) { // No credentials identified, signup will succeed
          return false
        } else { // Credentials identified, will fail
          return true
        }
      } catch (error) { // Error handling
        console.log(`ERROR: When querying database: ${error}`)
        return false
      }
  }
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


  // Endpoint registering new signup attempt
  socket.on('attempt-signup', async credentials_object => {
    if (await menu("store", credentials_object["name"], credentials_object)) {
      socket.emit("signup-result", "Success")
    } else {
      socket.emit("signup-result", "Failed")
    }
  });


  // Endpoint registering new login attempt
  socket.on('attempt-login', async credentials_object => {
    if (await menu("query", credentials_object["name"], credentials_object)) {
      socket.emit("login-result", "Success")
    } else {
      socket.emit("login-result", "Failed")
    }
  });


  // Endpoint verifying whether or not the account logging in is already online
  socket.on('already-online-check', name => {
    let found = false
    for (var i in sockets_to_names) {
      if (sockets_to_names[i]["name"] === name) {
        found = true
        break
      }
    }
    if (found) {
      socket.emit('online-check-result', true)
    } else {
      socket.emit('online-check-result', false)
    }
  });


  // Register the account as logged in
  socket.on('register-login', name => {
    verified_logins.push(name)
  });


  // Confirm whether user performed a login
  socket.on('verify-login', name => {
    if (verified_logins.includes(name)) {
      socket.emit('verify-login-response', true)
    } else {
      socket.emit('verify-login-response', false)
    }
  });


  // Designate a user's login token as spent
  socket.on('unverify-user', name => {
    if (verified_logins.includes(name)) {
      verified_logins.splice(name, 1)
    }
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
