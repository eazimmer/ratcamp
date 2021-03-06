// Constants
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://eric:csi330-group2@agile.xa93o.mongodb.net/test?retryWrites=true&w=majority";

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

// Handles database request
async function menu(operation, db_name = "", credentials_object = "") {

    // Initialize client object for this request
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    // Execute designated functionality
    try {
        // Connect to the MongoDB cluster
        await client.connect();

        switch (operation) {
            case "store": { // Creates a new database storing user login credentials
                await store_credentials(client, db_name, credentials_object)
                break;
            }
            case "query": {  // Queries to check whether credentials are valid
                await check_credentials(client, db_name, credentials_object)
                break;
            }
        }

    } catch (e) {
        console.error(e); // Handle potential errors
    } finally {
        await client.close(); // Close database connection
    }
}


// Create a new database, with a "creds" collection storing a document of user login credentials
async function store_credentials(client, db_name, credentials_object) {
    try {
        await client.db(db_name).collection("creds").insertOne(credentials_object);
        console.log("Credentials stored successfully.")
    } catch (error) {
        console.log(`ERROR: When storing credentials in database: ${error}`)

    }
}


// Check user's database to see if provided credentials are valid
async function check_credentials(client, db_name, credentials_object) {
    try {
        await client.db(credentials_object["display-name"]).collection("creds").findOne(credentials_object);
        console.log("Credentials identified successfully.")
    } catch (error) {
        console.log(`ERROR: When querying database: ${error}`)
    }
}

// Export the router
module.exports = router;
