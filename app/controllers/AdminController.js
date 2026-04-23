const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * Middleware: Verify Admin Access
 * This function runs before any admin route to ensure the user is logged in
 * and has the appropriate 'admin' privileges. If they don't, we stop them 
 * and show a 404 error page to protect restricted areas.
 */
const isAdmin = (req, res, next) => {
    const isNotLoggedIn = !req.session.loggedIn;
    const isNotAnAdmin = req.session.role !== 'admin';

    // If the user isn't logged in, or they are logged in but aren't an admin, deny access.
    if (isNotLoggedIn || isNotAnAdmin) {
        return res.status(403).render('404', { 
            title: 'Access Denied', 
            message: 'Only admins can access this page',
            loggedIn: req.session.loggedIn || false
        });
    }

    // The user is a valid admin, so let them proceed to the requested page.
    next();
};

/**
 * ==========================================
 * MANAGE ALL USERS (LISTING & DELETING)
 * ==========================================
 */

/**
 * Route: View and Filter Users
 * This page displays a list of everyone in the system. We can optionally 
 * filter the list via the URL to only show 'tutors' or 'tutees' (students).
 */
router.get('/admin/users', isAdmin, async (req, res) => {
    try {
        // We look for a 'role' parameter in the URL (e.g., ?role=tutor)
        const roleFilter = req.query.role;
        
        // We start with a baseline query to get everyone
        let sqlQuery = 'SELECT * FROM users';
        let queryParameters = [];
        
        // If a specific role was requested, we narrow the search
        if (roleFilter) {
            sqlQuery += ' WHERE role = ?';
            queryParameters.push(roleFilter);
        }
        
        // Always show the newest accounts first
        sqlQuery += ' ORDER BY user_id DESC';
        
        // Execute the database request
        const usersList = await db.query(sqlQuery, queryParameters);
        
        // Figure out the correct page title and sidebar highlight based on what we're looking at
        let displayTitle = 'Manage Users';
        let highlightedSidebarItem = 'admin-users';

        if (roleFilter === 'tutee') {
            displayTitle = 'Manage Students';
            highlightedSidebarItem = 'admin-students';
        } else if (roleFilter === 'tutor') {
            displayTitle = 'Manage Tutors';
            // The sidebar item remains 'admin-users' for tutors by default
        }
        
        // Send the data to our template to generate the HTML
        res.render('admin-users', { 
            title: displayTitle,
            activePage: highlightedSidebarItem,
            users: usersList || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading the user list:', error);
        
        // If the database fails, don't crash the app. Just show an empty list and an error warning.
        res.render('admin-users', { 
            title: 'Manage Users',
            activePage: 'admin-users',
            users: [],
            error: 'We had trouble loading the users from the database.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * Route: Delete a User
 * This completely purges a user account and all their related data from the platform.
 */
router.post('/admin/users/delete/:id', isAdmin, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        
        // First, let's make sure the user actually exists before we try to delete them
        const findUserQuery = 'SELECT * FROM users WHERE user_id = ?';
        const foundUser = await db.query(findUserQuery, [targetUserId]);
        
        if (foundUser.length === 0) {
            return res.status(404).json({ 
                error: 'We could not find that user account.' 
            });
        }
        
        // Remove the user from the database completely.
        // Because our database tables use 'ON DELETE CASCADE', deleting the core user
        // will automatically wipe their tutor/student profiles, bookings, and reviews too.
        const deleteUserQuery = 'DELETE FROM users WHERE user_id = ?';
        await db.query(deleteUserQuery, [targetUserId]);
        
        console.log(`Successfully deleted user with ID: ${targetUserId}`);
        
        res.json({ 
            success: true, 
            message: 'The user and all of their related data have been permanently removed.' 
        });

    } catch (error) {
        console.error('Error during user deletion:', error);
        
        res.status(500).json({ 
            error: 'We encountered a problem trying to delete the user. Please try again.' 
        });
    }
});

/**
 * ==========================================
 * TUTOR VERIFICATION & APPROVALS
 * ==========================================
 */

/**
 * Route: View Tutors Pending Approval
 * This page lists all the tutors on the platform so the admin can review their 
 * credentials and verify them.
 */
router.get('/admin/approve-tutors', isAdmin, async (req, res) => {
    try {
        // We need the user's basic details (name, email) combined with their 
        // tutor-specific profile details, so we join the two tables.
        const fetchTutorsQuery = `
            SELECT 
                u.user_id, 
                u.full_name, 
                u.email, 
                t.* 
            FROM tutors t 
            JOIN users u ON t.user_id = u.user_id 
            ORDER BY u.user_id DESC
        `;
        
        const pendingTutors = await db.query(fetchTutorsQuery);
        console.log(`Successfully loaded ${pendingTutors.length} tutors for review.`);
        
        res.render('admin-approve-tutors', { 
            title: 'Approve Tutors',
            activePage: 'admin-approve-tutors',
            tutors: pendingTutors || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error fetching tutors for approval:', error);
        
        res.render('admin-approve-tutors', { 
            title: 'Approve Tutors',
            activePage: 'admin-approve-tutors',
            tutors: [],
            error: 'We ran into an issue while loading the tutor list.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * Route: Mark a Tutor as Verified
 * When an admin has checked a tutor's background, they use this button to 
 * officially grant them verified status.
 */
router.post('/admin/tutors/approve/:id', isAdmin, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        
        // Update the tutor's record to show they are now verified (1 means true)
        const verifyTutorQuery = 'UPDATE tutors SET verified = 1 WHERE user_id = ?';
        await db.query(verifyTutorQuery, [targetUserId]);
        
        console.log(`Successfully verified tutor for user ID: ${targetUserId}`);
        
        res.json({ 
            success: true, 
            message: 'The tutor has been successfully verified and approved.' 
        });

    } catch (error) {
        console.error('Error marking tutor as approved:', error);
        
        res.status(500).json({ 
            error: 'Something went wrong while trying to approve this tutor.' 
        });
    }
});

/**
 * ==========================================
 * SYSTEM DASHBOARD & REPORTS
 * ==========================================
 */

/**
 * Route: View Overall System Reports
 * This dashboard gives the admin a quick, high-level summary of the entire platform,
 * like the total number of users, recent sign-ups, and moderation issues.
 */
router.get('/admin/reports', isAdmin, async (req, res) => {
    try {
        // We define all of our statistical queries up front so it's easy to read
        const countAllUsersQuery   = 'SELECT COUNT(*) as count FROM users';
        const countTutorsQuery     = 'SELECT COUNT(*) as count FROM tutors';
        const countStudentsQuery   = 'SELECT COUNT(*) as count FROM tutees';
        const countFlaggedQuery    = 'SELECT COUNT(DISTINCT tutor_id) as count FROM flagged_tutors';
        const breakdownByRoleQuery = 'SELECT role, COUNT(*) as count FROM users GROUP BY role';
        const fetchRecentUsersQuery = 'SELECT * FROM users ORDER BY user_id DESC LIMIT 5';
        
        // Execute all the counting queries against the database
        const totalUsersResult    = await db.query(countAllUsersQuery);
        const totalTutorsResult   = await db.query(countTutorsQuery);
        const totalStudentsResult = await db.query(countStudentsQuery);
        const totalFlaggedResult  = await db.query(countFlaggedQuery);
        
        // Grab the detailed breakdowns
        const roleBreakdownStats  = await db.query(breakdownByRoleQuery);
        const newestRegistrations = await db.query(fetchRecentUsersQuery);
        
        console.log('System dashboard reports generated successfully.');
        
        // Pass all these metrics down to the template to be displayed in the charts
        res.render('admin-reports', { 
            title: 'System Reports',
            activePage: 'admin-reports',
            totalUsers: totalUsersResult[0].count,
            totalTutors: totalTutorsResult[0].count,
            totalStudents: totalStudentsResult[0].count,
            totalFlagged: totalFlaggedResult[0].count,
            roleStats: roleBreakdownStats || [],
            recentUsers: newestRegistrations || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error generating system reports:', error);
        
        // If gathering stats fails, still show the page but zero out the numbers safely
        res.render('admin-reports', { 
            title: 'System Reports',
            activePage: 'admin-reports',
            totalUsers: 0,
            totalTutors: 0,
            totalStudents: 0,
            totalFlagged: 0,
            roleStats: [],
            recentUsers: [],
            error: 'We could not generate the system reports at this time.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * ==========================================
 * GLOBAL SYSTEM SETTINGS
 * ==========================================
 */

/**
 * Route: View System Configuration Page
 * Displays general settings for the entire platform, like the site name, 
 * contact email, and maintenance mode toggle.
 */
router.get('/admin/settings', isAdmin, async (req, res) => {
    try {
        // Currently, we are providing a set of static default settings.
        // Eventually, these could be loaded directly from a 'settings' database table.
        const defaultPlatformSettings = {
            platform_name: 'Dracarys',
            platform_email: 'support@dracarys.com',
            max_tutors: 999,
            max_students: 999,
            maintenance_mode: false
        };

        res.render('admin-settings', { 
            title: 'System Settings',
            activePage: 'admin-settings',
            settings: defaultPlatformSettings,
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error rendering the settings page:', error);
        
        res.render('admin-settings', { 
            title: 'System Settings',
            activePage: 'admin-settings',
            error: 'We were unable to load the platform configuration settings.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * Route: Save Updated Settings
 * When the admin updates platform details (like the main email) and clicks save,
 * this endpoint captures those form changes.
 */
router.post('/admin/settings/update', isAdmin, async (req, res) => {
    try {
        // Pull out the specific fields the admin typed into the form
        const { platform_name, platform_email, maintenance_mode } = req.body;
        
        // For now we just log them. To make this fully functional later,
        // we'd write an UPDATE SQL query to save these to the database.
        console.log('The admin requested to update settings to:', { 
            platform_name, 
            platform_email, 
            maintenance_mode 
        });
        
        res.json({ 
            success: true, 
            message: 'Your system settings have been saved successfully.' 
        });

    } catch (error) {
        console.error('Error saving new settings:', error);
        
        res.status(500).json({ 
            error: 'We failed to save your configuration changes. Please try again.' 
        });
    }
});

/**
 * ==========================================
 * PLATFORM CONTENT (SUBJECTS)
 * ==========================================
 */

/**
 * Route: View Content Management Page
 * Here the admin can see and manage all the tutoring subjects offered on the platform 
 * (like "Mathematics", "Science", or "History").
 */
router.get('/admin/content', isAdmin, async (req, res) => {
    try {
        // Fetch the list of subjects, putting the newest additions at the top
        const fetchSubjectsQuery = 'SELECT * FROM subjects ORDER BY subject_id DESC';
        const availableSubjects = await db.query(fetchSubjectsQuery);
        
        res.render('admin-content', { 
            title: 'Manage Content',
            activePage: 'admin-content',
            subjects: availableSubjects || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading subject list:', error);
        
        res.render('admin-content', { 
            title: 'Manage Content',
            activePage: 'admin-content',
            subjects: [],
            error: 'We encountered an error trying to load the subjects.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * Route: Create a New Subject
 * Lets the admin add a brand new topic category that tutors can choose to teach.
 */
router.post('/admin/subjects/add', isAdmin, async (req, res) => {
    try {
        const { subject_name, description } = req.body;
        
        // Make sure they actually typed a name. We don't want empty or space-only subjects.
        const isNameMissingOrEmpty = !subject_name || subject_name.trim() === '';
        
        if (isNameMissingOrEmpty) {
            return res.status(400).json({ 
                error: 'A valid subject name is required to create a new category.' 
            });
        }
        
        // Insert it into the database. If they left the description blank, just use an empty string.
        const insertSubjectQuery = 'INSERT INTO subjects (subject_name, description) VALUES (?, ?)';
        const cleanName = subject_name.trim();
        const safeDescription = description || '';
        
        await db.query(insertSubjectQuery, [cleanName, safeDescription]);
        
        console.log(`Successfully created a new subject category: ${cleanName}`);
        
        res.json({ 
            success: true, 
            message: `The subject "${cleanName}" was added successfully.` 
        });

    } catch (error) {
        console.error('Error creating new subject:', error);
        
        res.status(500).json({ 
            error: 'We failed to add the new subject due to a server error.' 
        });
    }
});

/**
 * Route: Delete an Existing Subject
 * Removes a specific subject from the list of available teaching topics.
 */
router.post('/admin/subjects/delete/:id', isAdmin, async (req, res) => {
    try {
        const subjectIdToRemove = req.params.id;
        
        const deleteSubjectQuery = 'DELETE FROM subjects WHERE subject_id = ?';
        await db.query(deleteSubjectQuery, [subjectIdToRemove]);
        
        console.log(`Successfully deleted subject ID: ${subjectIdToRemove}`);
        
        res.json({ 
            success: true, 
            message: 'The subject has been permanently deleted.' 
        });

    } catch (error) {
        console.error('Error removing subject:', error);
        
        res.status(500).json({ 
            error: 'We could not delete the subject. It might still be in use by active tutors.' 
        });
    }
});

/**
 * ==========================================
 * USER SUPPORT & HELP DESK
 * ==========================================
 */

/**
 * Route: View Support Tickets
 * This page acts as a help desk where admins can see messages, bugs, or issues 
 * submitted by students and tutors.
 */
router.get('/admin/support', isAdmin, async (req, res) => {
    try {
        // Currently, we don't have a tickets table, so we just render a placeholder.
        // Later, we can add a database query here to fetch real user complaints.
        res.render('admin-support', { 
            title: 'Support Tickets',
            activePage: 'admin-support',
            tickets: [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error accessing the support desk page:', error);
        
        res.render('admin-support', { 
            title: 'Support Tickets',
            activePage: 'admin-support',
            tickets: [],
            error: 'We ran into a problem loading the help desk.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * ==========================================
 * MODERATION (FLAGGED TUTORS)
 * ==========================================
 */

/**
 * Route: View Reported/Flagged Tutors
 * Shows a list of tutors who have been reported by students for bad behavior.
 * We calculate the total number of complaints each tutor has received.
 */
router.get('/admin/flagged', isAdmin, async (req, res) => {
    try {
        // We join three tables to gather the necessary context:
        // 1. 'tutors' to get their tutor profile ID.
        // 2. 'users' to get their actual name and email address.
        // 3. 'flagged_tutors' to count exactly how many complaints they have.
        const fetchReportedTutorsQuery = `
            SELECT 
                t.tutor_id, 
                u.user_id, 
                u.full_name, 
                u.email, 
                COUNT(f.flag_id) as flag_count
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id
            JOIN flagged_tutors f ON t.tutor_id = f.tutor_id
            GROUP BY 
                t.tutor_id, 
                u.user_id, 
                u.full_name, 
                u.email
            ORDER BY flag_count DESC
        `;
        
        // Execute the query to get our list of suspicious or highly-reported accounts
        const reportedTutors = await db.query(fetchReportedTutorsQuery);
        
        res.render('admin-flagged', { 
            title: 'Flagged Tutors',
            activePage: 'admin-flagged',
            flaggedTutors: reportedTutors || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading the list of flagged tutors:', error);
        
        res.render('admin-flagged', { 
            title: 'Flagged Tutors',
            activePage: 'admin-flagged',
            flaggedTutors: [],
            error: 'We failed to load the moderation queue at this time.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * Route: Dismiss All Flags for a Tutor
 * If an admin investigates a tutor and decides the reports were false or have 
 * been resolved, this endpoint completely clears the tutor's warning record.
 */
router.post('/admin/flagged/resolve/:id', isAdmin, async (req, res) => {
    try {
        const targetTutorId = req.params.id;
        
        // Erase all the complaint records associated with this specific tutor profile
        const clearFlagsQuery = 'DELETE FROM flagged_tutors WHERE tutor_id = ?';
        await db.query(clearFlagsQuery, [targetTutorId]);
        
        console.log(`Successfully cleared all flags for tutor ID: ${targetTutorId}`);
        
        res.json({ 
            success: true, 
            message: 'All reports against this tutor have been dismissed.' 
        });

    } catch (error) {
        console.error('Error clearing tutor flags:', error);
        
        res.status(500).json({ 
            error: 'We experienced an issue while trying to dismiss these reports.' 
        });
    }
});

// Finally, we export our fully configured router so the main Express app can use it.
module.exports = router;
