// Persistently stored data
let messages = []
let users = []

// Endpoint Routing
const router = app => {

    // Homepage
    app.get('/', (request, response) => {
        response.send({
            message: 'Node.js and Express REST API for CSI330-Group2'
        });
    });


    // ENDPOINT POST: Send a message from client to server
    app.post('/message', (request, response) => {
        const message = request.body;

        users.push(message["Username"])
        messages.push(message["Message"])

        console.log(message)
    });


    // ENDPOINT GET: Receive all messages from server
    app.get('/messages', (request, response) => {
        response.json(messages)
    });
}

// Export the router
module.exports = router;