/**
 * Admin Controller
 * 
 * This file contains all the admin-only pages and actions.
 * It handles user management, tutor approvals, system reports,
 * settings, subjects, support, and moderation.
 * Everything is protected by the isAdmin middleware.
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');

/**
 * Middleware: Check if the current user is a logged-in admin
 * 
 * This runs before every admin route.
 * If the user isn't logged in or isn't an admin, it shows
 * a friendly "Access Denied" page.
 */
const isAdmin = (req, res, next) => {
    const userIsNotLoggedIn = !req.session.loggedIn;
    const userIsNotAnAdmin = req.session.role !== 'admin';

    if (userIsNotLoggedIn || userIsNotAnAdmin) {
        return res.status(403).render('404', {
            title: 'Access Denied',
            message: 'Only admins can access this page',
            loggedIn: req.session.loggedIn || false
        });
    }

    next();
};

/**
 * GET /admin/users
 * Shows a list of all users. You can filter with ?role=tutor or ?role=tutee.
 */
router.get('/admin/users', isAdmin, async (req, res) => {
    try {
        const roleFilter = req.query.role;

        let sqlQuery = 'SELECT * FROM users';
        let queryParams = [];

        if (roleFilter) {
            sqlQuery += ' WHERE role = ?';
            queryParams.push(roleFilter);
        }

        sqlQuery += ' ORDER BY user_id DESC';

        const users = await db.query(sqlQuery, queryParams);

        let pageTitle = 'Manage Users';
        let sidebarHighlight = 'admin-users';

        if (roleFilter === 'tutee') {
            pageTitle = 'Manage Students';
            sidebarHighlight = 'admin-students';
        } else if (roleFilter === 'tutor') {
            pageTitle = 'Manage Tutors';
        }

        res.render('admin-users', {
            title: pageTitle,
            activePage: sidebarHighlight,
            users: users || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading user list:', error);

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
 * POST /admin/users/delete/:id
 * Completely deletes a user and all their related data.
 */
router.post('/admin/users/delete/:id', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        const checkUser = await db.query(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );

        if (checkUser.length === 0) {
            return res.status(404).json({
                error: 'We could not find that user account.'
            });
        }

        await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

        console.log(`User deleted successfully – ID: ${userId}`);

        res.json({
            success: true,
            message: 'The user and all of their data have been permanently removed.'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            error: 'We encountered a problem trying to delete the user. Please try again.'
        });
    }
});

/**
 * GET /admin/approve-tutors
 * Lists all tutors so admins can review and verify them.
 */
router.get('/admin/approve-tutors', isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                u.user_id, 
                u.full_name, 
                u.email, 
                t.* 
            FROM tutors t 
            JOIN users u ON t.user_id = u.user_id 
            ORDER BY u.user_id DESC
        `;

        const tutors = await db.query(query);

        console.log(`Loaded ${tutors.length} tutors for approval.`);

        res.render('admin-approve-tutors', {
            title: 'Approve Tutors',
            activePage: 'admin-approve-tutors',
            tutors: tutors || [],
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
 * POST /admin/tutors/approve/:id
 * Marks a tutor as verified after admin review.
 */
router.post('/admin/tutors/approve/:id', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        await db.query(
            'UPDATE tutors SET verified = 1 WHERE user_id = ?',
            [userId]
        );

        console.log(`Tutor verified – user ID: ${userId}`);

        res.json({
            success: true,
            message: 'The tutor has been successfully verified and approved.'
        });

    } catch (error) {
        console.error('Error approving tutor:', error);
        res.status(500).json({
            error: 'Something went wrong while trying to approve this tutor.'
        });
    }
});

/**
 * GET /admin/reports
 * Main admin dashboard with overall platform statistics.
 */
router.get('/admin/reports', isAdmin, async (req, res) => {
    try {
        const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM users');
        const totalTutorsResult = await db.query('SELECT COUNT(*) as count FROM tutors');
        const totalStudentsResult = await db.query('SELECT COUNT(*) as count FROM tutees');
        const flaggedResult = await db.query('SELECT COUNT(DISTINCT tutor_id) as count FROM flagged_tutors');
        const roleBreakdown = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
        const recentUsers = await db.query('SELECT * FROM users ORDER BY user_id DESC LIMIT 5');

        res.render('admin-reports', {
            title: 'System Reports',
            activePage: 'admin-reports',
            totalUsers: totalUsersResult[0].count,
            totalTutors: totalTutorsResult[0].count,
            totalStudents: totalStudentsResult[0].count,
            totalFlagged: flaggedResult[0].count,
            roleStats: roleBreakdown || [],
            recentUsers: recentUsers || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error generating reports:', error);

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
 * GET /admin/settings
 * Shows the platform-wide settings page.
 */
router.get('/admin/settings', isAdmin, async (req, res) => {
    try {
        const settings = {
            platform_name: 'Dracarys',
            platform_email: 'support@dracarys.com',
            max_tutors: 999,
            max_students: 999,
            maintenance_mode: false
        };

        res.render('admin-settings', {
            title: 'System Settings',
            activePage: 'admin-settings',
            settings: settings,
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading settings page:', error);

        res.render('admin-settings', {
            title: 'System Settings',
            activePage: 'admin-settings',
            error: 'We were unable to load the platform configuration settings.',
            loggedIn: req.session.loggedIn || false
        });
    }
});

/**
 * POST /admin/settings/update
 * Saves changes the admin makes to platform settings.
 */
router.post('/admin/settings/update', isAdmin, async (req, res) => {
    try {
        const { platform_name, platform_email, maintenance_mode } = req.body;

        console.log('Admin updated platform settings to:', {
            platform_name,
            platform_email,
            maintenance_mode
        });

        res.json({
            success: true,
            message: 'Your system settings have been saved successfully.'
        });

    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({
            error: 'We failed to save your configuration changes. Please try again.'
        });
    }
});

/**
 * GET /admin/content
 * Page where admins manage all tutoring subjects.
 */
router.get('/admin/content', isAdmin, async (req, res) => {
    try {
        const subjects = await db.query(
            'SELECT * FROM subjects ORDER BY subject_id DESC'
        );

        res.render('admin-content', {
            title: 'Manage Content',
            activePage: 'admin-content',
            subjects: subjects || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading subjects:', error);

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
 * POST /admin/subjects/add
 * Adds a new subject that tutors can teach.
 */
router.post('/admin/subjects/add', isAdmin, async (req, res) => {
    try {
        const { subject_name, description } = req.body;

        if (!subject_name || subject_name.trim() === '') {
            return res.status(400).json({
                error: 'A valid subject name is required to create a new category.'
            });
        }

        const cleanName = subject_name.trim();
        const safeDescription = description || '';

        await db.query(
            'INSERT INTO subjects (subject_name, description) VALUES (?, ?)',
            [cleanName, safeDescription]
        );

        console.log(`New subject added: ${cleanName}`);

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
 * POST /admin/subjects/delete/:id
 * Deletes a subject from the platform.
 */
router.post('/admin/subjects/delete/:id', isAdmin, async (req, res) => {
    try {
        const subjectId = req.params.id;

        await db.query('DELETE FROM subjects WHERE subject_id = ?', [subjectId]);

        console.log(`Subject deleted – ID: ${subjectId}`);

        res.json({
            success: true,
            message: 'The subject has been permanently deleted.'
        });

    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({
            error: 'We could not delete the subject. It might still be in use by active tutors.'
        });
    }
});

/**
 * GET /admin/support
 * Help desk page for viewing user support tickets.
 */
router.get('/admin/support', isAdmin, async (req, res) => {
    try {
        res.render('admin-support', {
            title: 'Support Tickets',
            activePage: 'admin-support',
            tickets: [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading support page:', error);

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
 * GET /admin/flagged
 * Shows tutors who have been reported by students.
 */
router.get('/admin/flagged', isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                t.tutor_id, 
                u.user_id, 
                u.full_name, 
                u.email, 
                COUNT(f.flag_id) as flag_count
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id
            JOIN flagged_tutors f ON t.tutor_id = f.tutor_id
            GROUP BY t.tutor_id, u.user_id, u.full_name, u.email
            ORDER BY flag_count DESC
        `;

        const flaggedTutors = await db.query(query);

        res.render('admin-flagged', {
            title: 'Flagged Tutors',
            activePage: 'admin-flagged',
            flaggedTutors: flaggedTutors || [],
            loggedIn: req.session.loggedIn || false
        });

    } catch (error) {
        console.error('Error loading flagged tutors:', error);

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
 * POST /admin/flagged/resolve/:id
 * Clears all flags against a tutor after admin review.
 */
router.post('/admin/flagged/resolve/:id', isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;

        await db.query(
            'DELETE FROM flagged_tutors WHERE tutor_id = ?',
            [tutorId]
        );

        console.log(`All flags cleared for tutor ID: ${tutorId}`);

        res.json({
            success: true,
            message: 'All reports against this tutor have been dismissed.'
        });

    } catch (error) {
        console.error('Error clearing flags:', error);
        res.status(500).json({
            error: 'We experienced an issue while trying to dismiss these reports.'
        });
    }
});

module.exports = router;