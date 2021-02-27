// http://localhost:3002/
// Access this link to hit the locally-running-server's homepage

// Require packages and set the port
const express = require('express');
const bodyParser = require('body-parser');
const service = require('./index.js');
const app = express();
const port = process.env.PORT || 3002;
const host = "0.0.0.0";

// Use Node.js body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}));

service(app);

// Start the server
const server = app.listen(port, host, (error) => {
    if (error) return console.log(`Error: ${error}`);

    console.log(`Server listening on port ${server.address().port}`);
});