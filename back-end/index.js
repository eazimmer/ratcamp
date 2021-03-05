// Endpoint Routing
const router = app => {

    // Serve clients with homepage
    app.get('/', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/index.html");
    });

    // Serve clients with message board
    app.get('/front-end/html/messageBoard.html', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/messageBoard.html");
    });

    // CURRENTLY UNUSED
    // Serve client with varying file based on URL.
    app.get('/front-end/*', (req, res) => {
        res.sendFile(__dirname + req.originalUrl);
    });

    // CURRENTLY UNUSED
    // Receive all messages from server. Currently unused.
    app.get('/messages', (request, response) => {
        response.json(messages)
    });
}

// Export the router
module.exports = router;
