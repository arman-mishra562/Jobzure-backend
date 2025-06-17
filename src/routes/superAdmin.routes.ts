import express from 'express';
import {
    registerSuperAdmin,
    loginSuperAdmin,
    assignUsersToAdmin,
    getAdminUsers,
    getAllUsers,
    getAllAdmins,
    getUserDetails,
    getAdminDetails,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    updateUser,
    deleteUser,
    verifySuperAdmin
} from '../controllers/superAdmin.controller';
import { verifyTokenSuperAdmin } from '../middlewares/middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// Authentication routes
router.post('/register', asyncHandler(registerSuperAdmin));
router.post('/login', asyncHandler(loginSuperAdmin));
router.get('/verify', asyncHandler(verifySuperAdmin));

// Admin management routes
router.post('/admins', verifyTokenSuperAdmin, asyncHandler(createAdmin));
router.put('/admins/:adminId', verifyTokenSuperAdmin, asyncHandler(updateAdmin));
router.delete('/admins/:adminId', verifyTokenSuperAdmin, asyncHandler(deleteAdmin));

// User management routes
router.put('/users/:userId', verifyTokenSuperAdmin, asyncHandler(updateUser));
router.delete('/users/:userId', verifyTokenSuperAdmin, asyncHandler(deleteUser));

// Viewing routes
router.get('/users', verifyTokenSuperAdmin, asyncHandler(getAllUsers));
router.get('/admins', verifyTokenSuperAdmin, asyncHandler(getAllAdmins));
router.get('/users/:userId', verifyTokenSuperAdmin, asyncHandler(getUserDetails));
router.get('/admins/:adminId', verifyTokenSuperAdmin, asyncHandler(getAdminDetails));

// User assignment route
router.post('/assign-users', verifyTokenSuperAdmin, asyncHandler(assignUsersToAdmin));
router.get('/admin-users', verifyTokenSuperAdmin, asyncHandler(getAdminUsers));

export default router; 