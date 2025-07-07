import express from 'express';
import { verifyTokenAdmin } from '../middlewares/middleware';
import {
    registerAdmin,
    loginAdmin,
    verifyAdmin,
    forgotPassword,
    resetPassword,
    getAssignedUsers,
    getAssignedUserDetails,
    updateAssignedUserDetails,
    getAssignedUserPersonalDetails,
    logoutAdmin,
    resend_verifyLink,
    createUserApplication,
    listUserApplications,
    updateUserApplication,
    markUserAsCompleted,
    getAdminDashboardSummary
} from '../controllers/admin.controller';
import passport from 'passport';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Authentication routes
router.post('/register', registerAdmin);
router.post('/login', passport.authenticate('admin-local'), loginAdmin);
router.get('/verify', verifyAdmin);
router.post('/re-verify', resend_verifyLink);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verifyTokenAdmin, logoutAdmin);

// Assigned users routes (protected)
router.get('/assigned-users', verifyTokenAdmin, getAssignedUsers);
router.get('/assigned-users/:userId', verifyTokenAdmin, getAssignedUserDetails);
router.put('/assigned-users/:userId', verifyTokenAdmin, updateAssignedUserDetails);
router.get('/assigned-users/:userId/personal-details', verifyTokenAdmin, getAssignedUserPersonalDetails);

// Application management routes (protected)
router.post('/assigned-users/:userId/applications', verifyTokenAdmin, asyncHandler(createUserApplication));
router.get('/assigned-users/:userId/applications', verifyTokenAdmin, asyncHandler(listUserApplications));
router.put('/assigned-users/:userId/applications/:applicationId', verifyTokenAdmin, asyncHandler(updateUserApplication));

// Mark user as completed (protected)
router.post('/assigned-users/:userId/complete', verifyTokenAdmin, asyncHandler(markUserAsCompleted));

// Dashboard summary route (protected)
router.get('/dashboard-summary', verifyTokenAdmin, getAdminDashboardSummary);

export default router; 