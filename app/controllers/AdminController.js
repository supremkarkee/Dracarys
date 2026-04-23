const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.session.loggedIn || req.session.role !== 'admin') {
        return res.status(403).render('Error404', { 
            title: 'Access Denied', 
            message: 'Only admins can access this page',
            loggedIn: req.session.loggedIn || false
        });
    }
    next();
};

// ==================== MANAGE ALL USERS ====================
router.get('/admin/users', isAdmin, async (req, res) => {
    try {
        const roleFilter = req.query.role;
        let sql = 'SELECT * FROM users';
        let params = [];
        
        if (roleFilter) {
            sql += ' WHERE role = ?';
            params.push(roleFilter);
        }
        
        sql += ' ORDER BY user_id DESC';
        const users = await db.query(sql, params);
        
        const pageTitle = roleFilter === 'tutee' ? 'Manage Students' : (roleFilter === 'tutor' ? 'Manage Tutors' : 'Manage Users');
        
        res.render('AdminUsers', { 
            title: pageTitle,
            activePage: roleFilter === 'tutee' ? 'admin-students' : 'admin-users',
            users: users || [],
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading users:', err);
        res.render('AdminUsers', { 
            title: 'Manage Users',
            activePage: 'admin-users',
            users: [],
            error: 'Failed to load users',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// Delete user
router.post('/admin/users/delete/:id', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if user exists
        const checkSql = 'SELECT * FROM users WHERE user_id = ?';
        const user = await db.query(checkSql, [userId]);
        
        if (!user.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Delete the user record.
        // Thanks to the ON DELETE CASCADE constraints we added to the database,
        // this will automatically remove records from:
        // tutors, tutees, bookings, reviews, favourites, etc.
        await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
        
        console.log('User deleted:', userId);
        res.json({ success: true, message: 'User and all associated data deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user. There may be unresolved dependencies.' });
    }
});

// ==================== APPROVE TUTORS ====================
router.get('/admin/approve-tutors', isAdmin, async (req, res) => {
    try {
        const sql = `SELECT u.user_id, u.full_name, u.email, t.* FROM tutors t 
                     JOIN users u ON t.user_id = u.user_id 
                     ORDER BY u.user_id DESC`;
        const tutors = await db.query(sql);
        console.log('Tutors loaded:', tutors.length);
        
        res.render('AdminApproveTutors', { 
            title: 'Approve Tutors',
            activePage: 'admin-approve-tutors',
            tutors: tutors || [],
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading tutors:', err);
        res.render('AdminApproveTutors', { 
            title: 'Approve Tutors',
            activePage: 'admin-approve-tutors',
            tutors: [],
            error: 'Failed to load tutors',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// Approve tutor (verify tutor)
router.post('/admin/tutors/approve/:id', isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;
        
        // Fix: use tutor_id (the route param), not user_id
        const sql = 'UPDATE tutors SET verified = 1 WHERE tutor_id = ?';
        await db.query(sql, [tutorId]);
        
        console.log('Tutor approved:', tutorId);
        res.json({ success: true, message: 'Tutor approved successfully' });
    } catch (err) {
        console.error('Error approving tutor:', err);
        res.status(500).json({ error: 'Failed to approve tutor' });
    }
});

// ==================== VIEW REPORTS ====================
router.get('/admin/reports', isAdmin, async (req, res) => {
    try {
        // Get statistics
        const totalUsersSql = 'SELECT COUNT(*) as count FROM users';
        const totalTutorsSql = 'SELECT COUNT(*) as count FROM tutors';
        const totalStudentsSql = 'SELECT COUNT(*) as count FROM tutees';
        const flaggedTutorsSql = 'SELECT COUNT(DISTINCT tutor_id) as count FROM flagged_tutors';
        
        const totalUsers = await db.query(totalUsersSql);
        const totalTutors = await db.query(totalTutorsSql);
        const totalStudents = await db.query(totalStudentsSql);
        const totalFlagged = await db.query(flaggedTutorsSql);
        
        // Get user breakdown by role
        const roleSql = 'SELECT role, COUNT(*) as count FROM users GROUP BY role';
        const roleStats = await db.query(roleSql);
        
        // Get recent users
        const recentUsersSql = 'SELECT * FROM users ORDER BY user_id DESC LIMIT 5';
        const recentUsers = await db.query(recentUsersSql);
        
        console.log('Reports loaded');
        
        res.render('AdminReports', { 
            title: 'System Reports',
            activePage: 'admin-reports',
            totalUsers: totalUsers[0].count,
            totalTutors: totalTutors[0].count,
            totalStudents: totalStudents[0].count,
            totalFlagged: totalFlagged[0].count,
            roleStats: roleStats || [],
            recentUsers: recentUsers || [],
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading reports:', err);
        res.render('AdminReports', { 
            title: 'System Reports',
            activePage: 'admin-reports',
            totalUsers: 0,
            totalTutors: 0,
            totalStudents: 0,
            totalFlagged: 0,
            roleStats: [],
            recentUsers: [],
            error: 'Failed to load reports',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// ==================== SYSTEM SETTINGS ====================
router.get('/admin/settings', isAdmin, async (req, res) => {
    try {
        res.render('AdminSettings', { 
            title: 'System Settings',
            activePage: 'admin-settings',
            settings: {
                platform_name: 'Dracarys',
                platform_email: 'support@dracarys.com',
                max_tutors: 999,
                max_students: 999,
                maintenance_mode: false
            },
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading settings:', err);
        res.render('AdminSettings', { 
            title: 'System Settings',
            activePage: 'admin-settings',
            error: 'Failed to load settings',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// Update settings
router.post('/admin/settings/update', isAdmin, async (req, res) => {
    try {
        const { platform_name, platform_email, maintenance_mode } = req.body;
        console.log('Settings updated:', { platform_name, platform_email, maintenance_mode });
        
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ==================== MANAGE CONTENT ====================
router.get('/admin/content', isAdmin, async (req, res) => {
    try {
        const subjects = await db.query('SELECT * FROM subjects ORDER BY subject_id DESC');
        
        res.render('AdminContent', { 
            title: 'Manage Content',
            activePage: 'admin-content',
            subjects: subjects || [],
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading content:', err);
        res.render('AdminContent', { 
            title: 'Manage Content',
            activePage: 'admin-content',
            subjects: [],
            error: 'Failed to load content',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// Add subject
router.post('/admin/subjects/add', isAdmin, async (req, res) => {
    try {
        const { subject_name, description } = req.body;
        
        if (!subject_name || subject_name.trim() === '') {
            return res.status(400).json({ error: 'Subject name is required' });
        }
        
        const sql = 'INSERT INTO subjects (subject_name, description) VALUES (?, ?)';
        await db.query(sql, [subject_name.trim(), description || '']);
        
        console.log('Subject added:', subject_name);
        res.json({ success: true, message: 'Subject added successfully' });
    } catch (err) {
        console.error('Error adding subject:', err);
        res.status(500).json({ error: 'Failed to add subject' });
    }
});

// Delete subject
router.post('/admin/subjects/delete/:id', isAdmin, async (req, res) => {
    try {
        const subjectId = req.params.id;
        
        await db.query('DELETE FROM subjects WHERE subject_id = ?', [subjectId]);
        
        console.log('Subject deleted:', subjectId);
        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (err) {
        console.error('Error deleting subject:', err);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
});

// ==================== SUPPORT TICKETS ====================
router.get('/admin/support', isAdmin, async (req, res) => {
    try {
        res.render('AdminSupport', { 
            title: 'Support Tickets',
            activePage: 'admin-support',
            tickets: [],
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading support tickets:', err);
        res.render('AdminSupport', { 
            title: 'Support Tickets',
            activePage: 'admin-support',
            tickets: [],
            error: 'Failed to load support tickets',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// ==================== FLAGGED TUTORS ====================
router.get('/admin/flagged', isAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT t.tutor_id, u.user_id, u.full_name, u.email, 
                   COUNT(f.flag_id) as flag_count
            FROM tutors t
            JOIN users u ON t.user_id = u.user_id
            JOIN flagged_tutors f ON t.tutor_id = f.tutor_id
            GROUP BY t.tutor_id, u.user_id, u.full_name, u.email
            ORDER BY flag_count DESC
        `;
        const flaggedTutors = await db.query(sql);
        
        res.render('AdminFlagged', { 
            title: 'Flagged Tutors',
            activePage: 'admin-flagged',
            flaggedTutors: flaggedTutors || [],
            loggedIn: req.session.loggedIn || false
        });
    } catch (err) {
        console.error('Error loading flagged tutors:', err);
        res.render('AdminFlagged', { 
            title: 'Flagged Tutors',
            activePage: 'admin-flagged',
            flaggedTutors: [],
            error: 'Failed to load flagged tutors',
            loggedIn: req.session.loggedIn || false
        });
    }
});

// Resolve (dismiss) flags for a tutor
router.post('/admin/flagged/resolve/:id', isAdmin, async (req, res) => {
    try {
        const tutorId = req.params.id;
        await db.query('DELETE FROM flagged_tutors WHERE tutor_id = ?', [tutorId]);
        
        console.log('Flags resolved for tutor:', tutorId);
        res.json({ success: true, message: 'Flags dismissed successfully' });
    } catch (err) {
        console.error('Error resolving flags:', err);
        res.status(500).json({ error: 'Failed to resolve flags' });
    }
});

module.exports = router;
