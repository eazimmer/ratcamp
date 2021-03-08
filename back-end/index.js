// Endpoint Routing
const router = app => {

    // Serve clients with homepage
    app.get('/', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/dashboard.html");
    });

    // Serve clients with message board
    app.get('/front-end/html/messageBoard.html', (request, response) => {
        let online_users = []

        for (var i in sockets_to_names) {
            online_users.push(sockets_to_names[i]["name"])
        }

        if (online_users.includes(request.query.name)) {
            console.log("Authenticated user identified")
            response.sendFile(__dirname + "/front-end/html/messageBoard.html");
        } else {
            console.log("Unauthenticated user identified")
            response.send("ERROR: Please login before attempting to access the message board.");
        }
    });

    // Serve clients login page
    app.get('/front-end/html/login.html', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/login.html");
    });

    // Serve clients signup page
    app.get('/front-end/html/signup.html', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/signup.html");
    });

    // Serve clients varying file based on endpoint
    app.get('/front-end/*', (req, res) => {
        console.log(req.originalUrl);
        res.sendFile(__dirname + req.originalUrl);
    });
}

// Export the router
module.exports = router;
