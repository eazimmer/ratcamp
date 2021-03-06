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

    // TEST: Store data in database
    app.get('/store', async (req, res) => {

        let credentials_object = {
            "email" : "example@gmail.com",
            "display-name" : "Eric",
            "password" : "unencryptedpassword"
        }

        await menu("store", credentials_object["display-name"], credentials_object);
    });

    // TEST: Query database for data
    app.get('/store', async (req, res) => {

        let credentials_object = {
            "email" : "example@gmail.com",
            "display-name" : "Eric",
            "password" : "unencryptedpassword"
        }

        await menu("query", credentials_object["display-name"], credentials_object);
    });
}

// Export the router
module.exports = router;
