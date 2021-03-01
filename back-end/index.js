const path = require('path')
// Persistently stored data
let messages = []
let users = []

// Endpoint Routing
const router = app => {

    // Homepage
    app.get('/', (request, response) => {
        // response.send({
        //     message: 'Node.js and Express REST API for CSI330-Group2'
        // });

        response.sendFile(__dirname + "/front-end/index.html");


    });



    // ENDPOINT POST: Send a message from client to server
    app.post('/message', (request, response) => {
        const message = request.body;

        let user = message["Username"]
        let message_contents = message["Message"]

        users.push(user)
        messages.push(message_contents)

        response.send("User: " + user + ", sent: " + message_contents)
    });


    // ENDPOINT GET: Receive all messages from server
    app.get('/messages', (request, response) => {
        response.json(messages)
    });
}

// Export the router
module.exports = router;