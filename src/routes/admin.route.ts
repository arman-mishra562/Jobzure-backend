import express from 'express';
import {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    resend_verifyLink,
    forgotPassword,
    resetPassword
} from '../controllers/admin.controller';
import { verifyTokenAdmin } from '../middlewares/middleware';
import { createCompanyListing } from '../utils/admin.companylisting';
import { verifyAdmin } from '../utils/admin.verify';
import passport from 'passport';

const AdminRouter = express.Router();

AdminRouter.post('/register', registerAdmin);
AdminRouter.post('/login', passport.authenticate('admin-local'), loginAdmin);
AdminRouter.post('/logout', logoutAdmin);
AdminRouter.post('/verify', verifyAdmin);
AdminRouter.post('/re-verify', resend_verifyLink);
AdminRouter.post('/forgot-password', forgotPassword);
AdminRouter.post('/reset-password', resetPassword);
AdminRouter.post('/companyListing', verifyTokenAdmin, createCompanyListing);

export default AdminRouter;
