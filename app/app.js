// Import express.js
const express = require("express");

// Create express app
var app = express();



// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res)
 {
    res.send("Hello world!");
    console.log(req.url);
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});


// route for testing db with parameters
app.get("/db_test2", function(req, res) {
    res.send("Database test working");
});

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a route for /about
app.get("/about", function(req, res) {
    res.sendFile("about.html", { root: "./static" });
});


app.get("/roehampton", function(req, res) {
    console.log(req.url);
    let path = req.url;
    res.send("Hello roehampton " + path.substring(0,3));
});


// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});


app.get("/user/:id", function(req, res) 
{
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'id' parameter and use it in a dynamically generated page
    res.send("your user id is :  " + req.params.id);
});



app.get("/Student/:name/:id", function(req, res) 
{
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'id' parameter and use it in a dynamically generated page
    res.send("Hi dear studnet  :  " + req.params.name + "  your student id is : " + req.params.id);
    //res.send("Your student id is : " + req.params.id);
});
// Start server on port 3000


app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});
