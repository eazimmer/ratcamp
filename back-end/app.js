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
const {get} = require('http');
const https = require('https');
const uri =
    'mongodb+srv://eric:csi330-group2@agile.xa93o.mongodb.net/test?retryWrites=true&w=majority';
const TIME_BETWWEN_QUESTIONS = 20000;
let triviaRunning = false;
let triviaInstigator = "";
let pollCats = {
  'Any': 0,
  'Random': 0,
  'Entertainment': 0,
  'Science': 0,
  'Geography': 0,
  'Sports': 0,
  'Art': 0,
  'History': 0
};

const CAT_NUM_LOOKUP = {
  'General Knowledge': 9,
  'Entertainment: Books': 10,
  'Entertainment: Film': 11,
  'Entertainment: Music': 12,
  'Entertainment: Musicals &amp; Theatres': 13,
  'Entertainment: Television': 14,
  'Entertainment: Video Games': 15,
  'Entertainment: Board Games': 16,
  'Science &amp; Nature': 17,
  'Science: Computers': 18,
  'Science: Mathematics': 19,
  'Mythology': 20,
  'Sports': 21,
  'Geography': 22,
  'History': 23,
  'Politics': 24,
  'Art': 25,
  'Celebrities': 26,
  'Animals': 27,
  'Vehicles': 28,
  'Entertainment: Comics': 29,
  'Science: Gadgets': 30,
  'Entertainment: Japanese Anime &amp; Manga': 31,
  'Entertainment: Cartoon &amp; Animations': 32
}

let leaderboard = {}

// Stored data
let sockets_to_names =
    [];  // List of maps of socket ids to usernames: "id", and "name" keys
let verified_logins = []

// Use Node.js body parsing middleware to help access message contents
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));


service(app);  // Link endpoints page
app.use(express.static(path.join(
    __dirname + '/front-end')));  // Establish working directory in filesystem


// Start the server
const server = app.listen(port, host, (error) => {
  if (error) return console.log(`Error: ${error}`);
  console.log(`Server listening on port ${server.address().port}`);
});


// Initialize socket.io object linked to now-live server
const io = require('socket.io')(server);


// Handle messages received by server
function registerMessage(user, msg, private_message, recipient = '') {
  // Construct message object
  let data = {msg: msg, name: user};

  // Public message
  if (!private_message) {
    // Broadcast message to clients
    broadcastMessage(data);

  } else {  // Private message
    data['recipient'] = recipient
    let recipient_socket_id = ''
    let user_socket_id = ''

    // Grab target socket
    for (var i in sockets_to_names) {
      if (sockets_to_names[i]['name'] === recipient)
        recipient_socket_id = sockets_to_names[i]['id'];
      else if (sockets_to_names[i]['name'] === user)
        user_socket_id = sockets_to_names[i]['id'];
    }

    // If no recipient identified, cancel request
    if (recipient_socket_id === '' || user_socket_id == '') {
      console.log('Recipient for private message could not be identified.')
    } else {  // Private message to target socket
      console.log(`Sending private message to ${data.recipient}:`)
      io.to(recipient_socket_id).emit('msgrecv', JSON.stringify(data))
      io.to(user_socket_id).emit('msgrecv', JSON.stringify(data))
    }
  }
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
    validated_users.push(sockets_to_names[i]['name'])
  }

  // Broadcast new list of online users to all clients
  io.emit('updateonlineusers', validated_users);
}


// Handles database requests
async function menu(operation, db_name = '', credentials_object = '') {
  // Initialize client object for this request
  const client = new MongoClient(uri, {useUnifiedTopology: true});
  let result = false

  // Execute designated functionality
  try {
    // Connect to the MongoDB cluster
    await client.connect();

    switch (operation) {
      case 'store': {  // Cr>eates a new database storing user login credentials
        result = await store_credentials(client, db_name, credentials_object)
        break;
      }
      case 'query': {  // Queries to check whether credentials are valid
        result = await check_credentials(
            client, db_name, credentials_object, 'login')
        break;
      }
    }

  } catch (e) {
    console.error(e);  // Handle potential errors
  } finally {
    await client.close();  // Close database connection
    return result
  }
}


// Create a new database, with a "creds" collection storing a document of user
// login credentials
async function store_credentials(client, db_name, credentials_object) {
  try {
    if (await check_credentials(
            client, db_name, credentials_object,
            'signup')) {  // Abort request if these creds already exist
      return false
    } else {  // Proceed to store credentials if they are not already in
              // database
      await client.db(db_name).collection('creds').insertOne(
          credentials_object);
      return true
    }
  } catch (error) {  // Error handling
    console.log(`ERROR: When storing credentials in database: ${error}`)
  }
}


// Check users database to see if provided credentials are valid
async function check_credentials(client, db_name, credentials_object, action) {
  if (action === 'login') {  // Checking whether login credentials are valid
    try {
      let creds = await client.db(credentials_object['name'])
                      .collection('creds')
                      .findOne({
                        $and: [
                          {'name': credentials_object['name']},
                          {'password': credentials_object['password']}
                        ]
                      });
      if (creds == null) {  // No credentials identified
        return false
      } else {  // Credentials identified, login
        return true
      }
    } catch (error) {  // Error handling
      console.log(`ERROR: When querying database: ${error}`)
      return false
    }
  } else {  // Checking whether username is available for signup
    try {
      let creds = await client.db(credentials_object['name'])
                      .collection('creds')
                      .findOne({'name': credentials_object['name']});
      if (creds == null) {  // No credentials identified, signup will succeed
        return false
      } else {  // Credentials identified, will fail
        return true
      }
    } catch (error) {  // Error handling
      console.log(`ERROR: When querying database: ${error}`)
      return false
    }
  }
}

function buildAipUrl(amount) {
  let apiUrl = `/api.php?amount=${amount}&type=multiple`;
  let bigest = 'Any'
  for (let v in pollCats) {
    console.log(v);
    console.log(pollCats[v]);
    if (pollCats[v] > pollCats[bigest]) {
      bigest = v;
    }
  }
  if (bigest == 'Any') {
    return apiUrl;
  }
  let num = 9;
  if (bigest == 'Random') {
    num = Math.floor(Math.random() * 23) + 9;
  } else if (bigest == 'Entertainment') {
    num = Math.floor(Math.random() * 7) + 10;
  } else if (bigest == 'Science') {
    num = Math.floor(Math.random() * 3) + 17;
  } else if (bigest in CAT_NUM_LOOKUP) {
    num = CAT_NUM_LOOKUP[bigest];
  }

  apiUrl += '&category=' + num;
  console.log(apiUrl);
  return apiUrl;
}

async function handleTrivia(msgData) {
  if (triviaRunning) {
    return false;
  }
  pollCats = {
    'Any': 0,
    'Random': 0,
    'Entertainment': 0,
    'Science': 0,
    'Geography': 0,
    'Sports': 0,
    'Art': 0,
    'History': 0
  };
  io.emit('trivia-update', {
    code: 'poll-start',
  });
  await new Promise(resolve => setTimeout(resolve, 10000));

  let msgParts = msgData.msg.split(' ');
  let amount = 10;
  if (msgParts[1] != null && parseInt(msgParts[1]) != NaN) {
    console.log(msgParts[1]);
    amount = parseInt(msgParts[1]);
    if (amount > 25) {
      amount = 25;
    }
    if (amount < 3) {
      amount = 3;
    }
  }

  let apiUrl = buildAipUrl(amount);

  console.log('url: ' + apiUrl);


  triviaInstigator = msgData.name;
  triviaRunning = true;
  let questions = [];
  const req = https.request(
      {hostname: 'opentdb.com', port: 443, path: apiUrl, method: 'GET'},
      res => {
        if (res.statusCode != 200) {
          return false;
        }

        res.on('data', async (d) => {
          jsonStuff = JSON.parse(d.toString());
          if (jsonStuff.response_code != 0) {
            return false;
          }
          for (i = 0; i < jsonStuff.results.length; i++) {
            questions[i] = {};
            questions[i]['code'] = 'q' + i
            questions[i]['question'] = jsonStuff.results[i].question;
            questions[i]['answers'] = jsonStuff.results[i].incorrect_answers;
            questions[i]['correct_index'] = Math.floor(Math.random() * 4);
            questions[i]['answers'].splice(
                questions[i]['correct_index'], 0,
                jsonStuff.results[i].correct_answer);
          }

          console.log(questions);
          console.log(questions[0]);

          io.emit('trivia-update', {code: 'start', name: msgData.name});
          await new Promise(resolve => setTimeout(resolve, 5000));

          for (i = 0; i < questions.length; i++) {
            await new Promise(
              resolve => setTimeout(resolve, TIME_BETWWEN_QUESTIONS));
            if (!triviaRunning) {
              break;
            }
            console.log(i);
            io.emit('trivia-update', questions[i]);
            if (!triviaRunning) {
              break;
            }
          }
          triviaRunning = false;
          await new Promise(resolve => setTimeout(resolve, 10000));
          io.emit('trivia-update', {code: 'end', leaderboard: leaderboard});
        });
      });

  req.on('error', error => {console.error(error)});
  req.end();
}

// Socket connection event
io.on('connection', socket => {
  // Endpoint handling incoming message
  socket.on('chat', message => {
    let data = JSON.parse(message);

    if (data.msg.substring(0, 7) === '!trivia') {
      handleTrivia(data);
    } else if (data.msg == '!stop' && data.name == triviaInstigator) {
      triviaRunning = false;
    } else {
      if (data.recipient) {  // Private
        registerMessage(data.name, data.msg, true, data.recipient);
      } else {  // Public
        registerMessage(data.name, data.msg, false);
      }
    }
  });
  socket.on('poll', data => {
    if (data in pollCats) {
      pollCats[data] += 1;
    }
  });


  socket.on('trivia', data => {
    let pointdata = JSON.parse(data);  // { name : username, points: points };

    if (leaderboard[pointdata['name']]) {
      leaderboard[pointdata['name']] += pointdata['points'];

    } else {
      leaderboard[pointdata['name']] = pointdata['points'];
    }

    io.emit('update-leaderboard', leaderboard);
  });

  // Endpoint registering new connection with a chosen username
  socket.on('login-name', name => {
    var socket_id = socket.id.toString();

    sockets_to_names.push({'id': socket_id, 'name': name});

    broadcastChangeInOnlineUsers();  // Update clients with new online user list
  });


  // Endpoint registering new signup attempt
  socket.on('attempt-signup', async credentials_object => {
    if (await menu('store', credentials_object['name'], credentials_object)) {
      socket.emit('signup-result', 'Success')
    } else {
      socket.emit('signup-result', 'Failed')
    }
  });


  // Endpoint registering new login attempt
  socket.on('attempt-login', async credentials_object => {
    if (await menu('query', credentials_object['name'], credentials_object)) {
      socket.emit('login-result', 'Success')
    } else {
      socket.emit('login-result', 'Failed')
    }
  });


  // Endpoint verifying whether or not the account logging in is already
  // online
  socket.on('already-online-check', name => {
    let found = false
    for (var i in sockets_to_names) {
      if (sockets_to_names[i]['name'] === name) {
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
  socket.on('register-login', name => {verified_logins.push(name)});


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
  socket.on('disconnect', () => {
    // Find disconnecting socket and remove its entry in socket -> user map
    for (var i in sockets_to_names) {
      if (sockets_to_names[i]['id'] === socket.id) {
        sockets_to_names.splice(i, 1)
      }
    }

    broadcastChangeInOnlineUsers()  // Update clients with new online user
                                    // list
  });
})
