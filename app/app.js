// Import express.js
const express = require("express");
const path = require("path");
const session = require("express-session");
// Create express app
var app = express();

// Very important for pug template to work.
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')


// Add static files location
app.use(express.static("static"));

// Middleware to parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'dracarys-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Get the functions in the db.js file to use
const db = require('./services/db');
const { User } = require('./models/users');
const authRoutes = require('./routes/auth');


// route for the root

app.get("/", function (req, res) {
    console.log(req.session);
    if (req.session.uid) {
        res.render("home", { loggedIn: req.session.loggedIn });
    } else {
        res.render("loginpage", { loggedIn: false });
    }
});

// route for about page

app.get("/about", function (req, res) {
    res.render("about", { loggedIn: req.session.loggedIn });
});

// Routes for home page

app.get("/home", function (req, res) {
    res.render("home", { loggedIn: req.session.loggedIn });
});

// Routes for signup page

app.get("/signup", function (req, res) {
    res.render("signup", { loggedIn: req.session.loggedIn });
});

// Mount the authentication form submission routes
app.use('/', authRoutes);

// Routes for login page

app.get("/login", function (req, res) {
    res.render("loginpage", { loggedIn: req.session.loggedIn });
});

// Profile page — only accessible when logged in
app.get("/profile", function (req, res) {
    if (!req.session.uid) {
        return res.redirect('/login');
    }
    res.render("profile", { loggedIn: true, userId: req.session.uid });
});

// Logout — destroy session and redirect to home
app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
});

app.get("/tutors", function (req, res) {
    res.send("tutors");
});

// test database routes.

app.get('/all-tutors', function (req, res) {
    var sql = "SELECT * FROM tutors";
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Database Error");
    });
});

// Check submitted email and password pair
app.post('/authenticate', async function (req, res) {
    const params = req.body;
    const user = new User(params.email);
    try {
        const uId = await user.getIdfromEmail();
        if (uId) {
            const match = await user.authenticate(params.password);
            if (match) {
                // Valid credentials — set session as per lab
                req.session.uid = uId;
                req.session.loggedIn = true;
                // OPTIONAL: examine the session in the console
                console.log(req.session.id);
                res.redirect('/home');
            } else {
                // TODO: improve user journey — render login page with error message
                res.status(401).send('Invalid password.');
            }
        } else {
            res.status(401).send('Invalid email — no account found.');
        }
    } catch (err) {
        console.error('Error while authenticating:', err.message);
        res.status(500).send('An error occurred during login. Please try again.');
    }
});

// Set-password route (lab pattern) - finds or creates a user then sets their password
app.post('/set-password', async function (req, res) {
    const params = req.body;
    const user = new User(params.email);
    try {
        const uId = await user.getIdfromEmail();
        if (uId) {
            // Existing user found — set their password and store session
            await user.setUserPassword(params.password);
            req.session.userId = uId;
            console.log('Session ID:', req.session.id);
            res.send('Password set successfully');
        } else {
            // No existing user found — create a new one
            const newId = await user.addUser(params.email);
            res.send('Perhaps a page where a new user sets a programme would be good here');
        }
    } catch (err) {
        console.error('Error while adding password:', err.message);
        res.status(500).send('An error occurred while setting the password.');
    }
});

// Catch-all route for unhandled requests (404 Page Not Found)
app.use(function (req, res, next) {
    res.status(404).render('404');
});

// Start server on port 3000


app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});
