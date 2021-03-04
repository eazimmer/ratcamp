// Persistently stored data


// Endpoint Routing
const router = app => {

    // Homepage
    app.get('/', (request, response) => {
        // response.send({
        //     message: 'Node.js and Express REST API for CSI330-Group2'
        // });

        response.sendFile(__dirname + "/front-end/html/index.html");
    });

    app.get('/front-end/html/messageBoard.html', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/messageBoard.html");
    });

    app.get('/front-end/*', (req, res) => {
        console.log(req.originalUrl);
        res.sendFile(__dirname + req.originalUrl);
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
