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
    const user = new User(req.session.uid);
    res.render("home", { loggedIn: req.session.loggedIn, user: user });
});

// Routes for signup page

app.get("/signup", function (req, res) {
    res.render("signup", { loggedIn: req.session.loggedIn });
});

// Routes for admin dashboard

app.get("/admin-dashboard", async function (req, res) {
    if (req.session.role !== 'admin') return res.redirect('/login');
    try {
        const tutors = await db.query(`
            SELECT u.user_id, u.first_name, u.last_name, u.email, t.status 
            FROM users u 
            JOIN tutors t ON u.user_id = t.user_id
        `);
        const activeTutors = tutors.filter(t => t.status === 'active' || !t.status);
        const flaggedTutors = tutors.filter(t => t.status === 'flagged');
        res.render("admin-dashboard", { 
            loggedIn: req.session.loggedIn, 
            activeTutors, 
            flaggedTutors 
        });
    } catch (err) {
        if (err.message.includes("Unknown column")) {
            const tutorsFallback = await db.query(`
                SELECT u.user_id, u.first_name, u.last_name, u.email 
                FROM users u 
                JOIN tutors t ON u.user_id = t.user_id
            `);
            res.render("admin-dashboard", { 
                loggedIn: req.session.loggedIn, 
                activeTutors: tutorsFallback, 
                flaggedTutors: [] 
            });
        }
        else res.status(500).send("Database Error");
    }
});

// Routes for admin users

app.get("/admin-users", function (req, res) {
    res.render("admin-users", { loggedIn: req.session.loggedIn });
});


// Routes for tutor dashboard
app.get("/tutor-dashboard", async function (req, res) {
    if (!req.session.uid || req.session.role !== 'tutor') return res.redirect('/login');
    try {
        // Find tutor_id for this user
        const tutors = await db.query("SELECT tutor_id FROM tutors WHERE user_id = ?", [req.session.uid]);
        if (tutors.length === 0) return res.status(404).send("Tutor profile not found");
        const tutorId = tutors[0].tutor_id;

        // Fetch bookings for this tutor
        const bookings = await db.query(`
            SELECT b.*, u.first_name as tutee_name
            FROM bookings b
            JOIN tutees t ON b.tutee_id = t.tutee_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutor_id = ?
            ORDER BY b.booking_date DESC
        `, [tutorId]);
        
        res.render("tutor-dashboard", { loggedIn: req.session.loggedIn, bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// Routes for tutee dashboard
app.get("/tutee-dashboard", async function (req, res) {
    if (!req.session.uid || req.session.role !== 'tutee') return res.redirect('/login');
    try {
        // Find tutee_id for this user
        const tutees = await db.query("SELECT tutee_id FROM tutees WHERE user_id = ?", [req.session.uid]);
        if (tutees.length === 0) return res.status(404).send("Tutee profile not found");
        const tuteeId = tutees[0].tutee_id;

        // Fetch bookings for this tutee
        const bookings = await db.query(`
            SELECT b.*, u.first_name as tutor_name
            FROM bookings b
            JOIN tutors t ON b.tutor_id = t.tutor_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.tutee_id = ?
            ORDER BY b.booking_date DESC
        `, [tuteeId]);
        
        res.render("tutee-dashboard", { loggedIn: req.session.loggedIn, bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// GET route to show book lesson form
app.get("/book-lesson/:tutor_id", async function (req, res) {
    if (!req.session.uid || req.session.role !== 'tutee') return res.redirect('/login');
    try {
        const tutorId = req.params.tutor_id;
        const tutors = await db.query(`
            SELECT t.tutor_id, u.first_name, u.last_name 
            FROM tutors t 
            JOIN users u ON t.user_id = u.user_id 
            WHERE t.tutor_id = ?
        `, [tutorId]);
        
        if (tutors.length === 0) return res.status(404).send("Tutor not found");
        
        res.render("book_lesson", { loggedIn: req.session.loggedIn, tutor: tutors[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// POST route to handle booking submission
app.post("/book-lesson/:tutor_id", async function (req, res) {
    if (!req.session.uid || req.session.role !== 'tutee') return res.redirect('/login');
    try {
        const tutorId = req.params.tutor_id;
        const { booking_date, notes } = req.body;
        
        // Find tutee_id for this user
        const tutees = await db.query("SELECT tutee_id FROM tutees WHERE user_id = ?", [req.session.uid]);
        if (tutees.length === 0) return res.status(404).send("Tutee profile not found");
        const tuteeId = tutees[0].tutee_id;
        
        const result = await db.query(
            "INSERT INTO bookings (tutee_id, tutor_id, booking_date, notes, status) VALUES (?, ?, ?, ?, 'pending')",
            [tuteeId, tutorId, booking_date, notes || null]
        );
        
        const bookingId = result.insertId;
        
        // Fetch booking details for success page
        const bookingDetails = await db.query(`
            SELECT b.*, u.first_name as tutor_name
            FROM bookings b
            JOIN tutors t ON b.tutor_id = t.tutor_id
            JOIN users u ON t.user_id = u.user_id
            WHERE b.booking_id = ?
        `, [bookingId]);
        
        res.render("booking_success", { loggedIn: req.session.loggedIn, booking: bookingDetails[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// POST route for tutor to confirm booking
app.post("/bookings/:id/confirm", async function(req, res) {
    if (!req.session.uid || req.session.role !== 'tutor') return res.redirect('/login');
    try {
        const bookingId = req.params.id;
        
        // Verify this tutor owns this booking
        const tutors = await db.query("SELECT tutor_id FROM tutors WHERE user_id = ?", [req.session.uid]);
        if (tutors.length === 0) return res.status(404).send("Tutor profile not found");
        const tutorId = tutors[0].tutor_id;
        
        await db.query("UPDATE bookings SET status = 'confirmed' WHERE booking_id = ? AND tutor_id = ?", [bookingId, tutorId]);
        res.redirect("/tutor-dashboard");
    } catch(err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// Admin Account Actions
app.post('/admin/create-admin', async (req, res) => {
    if (req.session.role !== 'admin') return res.redirect('/login');
    try {
        const { firstName, lastName, email, password } = req.body;
        const exists = await User.checkUserExists(email);
        if (exists) return res.send("Admin account already exists!");
        const adminData = { firstName, lastName, email, password, role: 'admin' };
        await User.createUser(adminData);
        res.redirect('/admin-dashboard');
    } catch (err) {
        res.status(500).send("Error creating admin");
    }
});

app.post('/admin/users/delete/:id', async (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const userId = req.params.id;
        
        const tutees = await db.query("SELECT tutee_id FROM tutees WHERE user_id = ?", [userId]);
        for (const t of tutees) {
            await db.query("DELETE FROM reviews WHERE tutee_id = ?", [t.tutee_id]);
            await db.query("DELETE FROM tutee_subjects WHERE tutee_id = ?", [t.tutee_id]);
        }
        
        const tutors = await db.query("SELECT tutor_id FROM tutors WHERE user_id = ?", [userId]);
        for (const t of tutors) {
            await db.query("DELETE FROM reviews WHERE tutor_id = ?", [t.tutor_id]);
            await db.query("DELETE FROM tutor_subjects WHERE tutor_id = ?", [t.tutor_id]);
        }
        
        await db.query("DELETE FROM tutees WHERE user_id = ?", [userId]);
        await db.query("DELETE FROM tutors WHERE user_id = ?", [userId]);
        await db.query("DELETE FROM users WHERE user_id = ?", [userId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Mount the authentication form submission routes
app.use('/', authRoutes);

// Routes for login page

app.get("/login", function (req, res) {
    // 1. Check if 'registered=true' is in the URL

    const isRegistered = req.query.registered === 'true';
    const accountExists = req.query.account_exists === 'true';


    // 2. Pass it to Pug using the exact name 'showSuccess'
    res.render("loginpage",
        {
            loggedIn: req.session.loggedIn,
            showSuccess: isRegistered,
            accountExists: accountExists,
        });
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

                // Fetch user details to get the role
                await user.getDetails();
                req.session.role = user.role;

                console.log(`User ${user.email} logged in with role: ${user.role}`);

                // Redirect based on role
                if (user.role === 'admin') {
                    res.redirect('/admin-dashboard');
                } else if (user.role === 'tutor') {
                    res.redirect('/tutor-dashboard');
                } else {
                    res.redirect('/tutee-dashboard');
                }
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
