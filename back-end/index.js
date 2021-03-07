// Constants
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://eric:csi330-group2@agile.xa93o.mongodb.net/test?retryWrites=true&w=majority";

// Endpoint Routing
const router = app => {

    // Serve clients with homepage
    app.get('/', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/dashboard.html");
    });

    // Serve clients with message board
    app.get('/front-end/html/messageBoard.html', (request, response) => {
        response.sendFile(__dirname + "/front-end/html/messageBoard.html");
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

    // TEST: Store data in database
    app.get('/store', async (req, res) => {

        let credentials_object = {
            "email" : "example@gmail.com",
            "display-name" : "Eric",
            "password" : "unencryptedpassword"
        }

        credentials_object["password"] = encrypt_and_decrypt(credentials_object["password"], true)

        await menu("store", credentials_object["display-name"], credentials_object);
        res.send("Inserting credentials into database.")
    });

    // TEST: Query database for data
    app.get('/query', async (req, res) => {

        let credentials_object = {
            "email" : "example@gmail.com",
            "display-name" : "Eric",
            "password" : "unencryptedpassword"
        }

        credentials_object["password"] = encrypt_and_decrypt(credentials_object["password"], true)

        await menu("query", credentials_object["display-name"], credentials_object);
        res.send("Making query of database.")
    });
}

// Handles database requests
async function menu(operation, db_name = "", credentials_object = "") {

    // Initialize client object for this request
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    let result = false

    // Execute designated functionality
    try {
        // Connect to the MongoDB cluster
        await client.connect();

        switch (operation) {
            case "store": { // Creates a new database storing user login credentials
                result = await store_credentials(client, db_name, credentials_object)
                break;
            }
            case "query": {  // Queries to check whether credentials are valid
                result = await check_credentials(client, db_name, credentials_object)
                break;
            }
        }

    } catch (e) {
        console.error(e); // Handle potential errors
    } finally {
        await client.close(); // Close database connection
        return result
    }
}


// Create a new database, with a "creds" collection storing a document of user login credentials
async function store_credentials(client, db_name, credentials_object) {
    try {
        if (await check_credentials(client, db_name, credentials_object)) { // Abort request if these creds already exist
            console.log("An account with these credentials already exists. Cancelling storage.")
            return false
        } else { // Proceed to store credentials if they are not already in database
            await client.db(db_name).collection("creds").insertOne(credentials_object);
            return true
        }
    } catch (error) { // Error handling
        console.log(`ERROR: When storing credentials in database: ${error}`)
    }
}


// Check user's database to see if provided credentials are valid
async function check_credentials(client, db_name, credentials_object) {
    try {
        let creds = await client.db(credentials_object["display-name"]).collection("creds").findOne(credentials_object);
        if (creds == null) { // No credentials identified
            console.log("Failed to identify credentials.")
            return false
        } else { // Credentials identified
            //creds["password"] = encrypt_and_decrypt(credentials_object["password"], false)
            console.log(creds)
            return true
        }
    } catch (error) { // Error handling
        console.log(`ERROR: When querying database: ${error}`)
        return false
    }
}

// Encrypt and decrypt password depending on parameters
function encrypt_and_decrypt(pass, encrypt) {
    const alph = "abcdefghijklmnopqrstuvwxyz"
    let new_pass = []

    if (encrypt) {
        for (let index in pass) {
            if (!alph.includes(pass.charAt(index))) {
                new_pass.push(pass.charAt(index))
            } else {
                let new_char_index = alph.indexOf(pass.charAt(index))+3

                if (new_char_index > 25) {
                    new_char_index -= 26
                }

                new_pass.push(alph.charAt(new_char_index))
            }
        }
    } else {
        for (let index in pass) {
            if (!alph.includes(pass.charAt(index))) {
                new_pass.push(pass.charAt(index))
            } else {
                let new_char_index = alph.indexOf(pass.charAt(index))-3

                if (new_char_index < 0) {
                    new_char_index += 26
                }

                new_pass.push(alph.charAt(new_char_index))
            }
        }
    }
    return new_pass.join("")
}


// Export the router
module.exports = router;
