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

    // Serve clients varying file based on endpoint
    app.get('/front-end/*', (req, res) => {
        console.log(req.originalUrl);
        res.sendFile(__dirname + req.originalUrl);
    });
}

// Export the router
module.exports = router;
