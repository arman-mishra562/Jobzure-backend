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
    resend_verifyLink
} from '../controllers/admin.controller';
import { createCompanyListing } from '../utils/admin.companylisting';
import passport from 'passport';

const router = express.Router();

// Authentication routes
router.post('/register', registerAdmin);
router.post('/login', passport.authenticate('admin-local'), loginAdmin);
router.get('/verify', verifyAdmin);
router.post('/re-verify', resend_verifyLink);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verifyTokenAdmin, logoutAdmin);

// Company listing routes (protected)
router.post('/company-listing', verifyTokenAdmin, createCompanyListing);

// Assigned users routes (protected)
router.get('/assigned-users', verifyTokenAdmin, getAssignedUsers);
router.get('/assigned-users/:userId', verifyTokenAdmin, getAssignedUserDetails);
router.put('/assigned-users/:userId', verifyTokenAdmin, updateAssignedUserDetails);
router.get('/assigned-users/:userId/personal-details', verifyTokenAdmin, getAssignedUserPersonalDetails);

export default router; 