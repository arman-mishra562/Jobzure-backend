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
	verifySuperAdmin,
	getUserPersonalDetails,
	updateUserPersonalDetails,
	deleteUserPersonalDetails,
	autoAssignUsers,
	getAssignmentQueue,
	dashboardSummary,
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
router.put(
	'/admins/:adminId',
	verifyTokenSuperAdmin,
	asyncHandler(updateAdmin),
);
router.delete(
	'/admins/:adminId',
	verifyTokenSuperAdmin,
	asyncHandler(deleteAdmin),
);

// User management routes
router.put('/users/:userId', verifyTokenSuperAdmin, asyncHandler(updateUser));
router.delete(
	'/users/:userId',
	verifyTokenSuperAdmin,
	asyncHandler(deleteUser),
);

// Viewing routes
router.get('/users', verifyTokenSuperAdmin, asyncHandler(getAllUsers));
router.get('/admins', verifyTokenSuperAdmin, asyncHandler(getAllAdmins));
router.get(
	'/users/:userId',
	verifyTokenSuperAdmin,
	asyncHandler(getUserDetails),
);
router.get(
	'/admins/:adminId',
	verifyTokenSuperAdmin,
	asyncHandler(getAdminDetails),
);

// User assignment route
router.post(
	'/assign-users',
	verifyTokenSuperAdmin,
	asyncHandler(assignUsersToAdmin),
);
router.get('/admin-users', verifyTokenSuperAdmin, asyncHandler(getAdminUsers));

// User personal details routes
router.get(
	'/users/:userId/personal-details',
	verifyTokenSuperAdmin,
	asyncHandler(getUserPersonalDetails),
);
router.put(
	'/users/:userId/personal-details',
	verifyTokenSuperAdmin,
	asyncHandler(updateUserPersonalDetails),
);
router.delete(
	'/users/:userId/personal-details',
	verifyTokenSuperAdmin,
	asyncHandler(deleteUserPersonalDetails),
);

// Placeholder: router.post('/auto-assign-users', verifyTokenSuperAdmin, asyncHandler(autoAssignUsers));
router.post(
	'/auto-assign-users',
	verifyTokenSuperAdmin,
	asyncHandler(autoAssignUsers),
);
router.get(
	'/assignment-queue',
	verifyTokenSuperAdmin,
	asyncHandler(getAssignmentQueue),
);

router.get(
	'/dashboard/summary',
	verifyTokenSuperAdmin,
	asyncHandler(dashboardSummary),
);

export default router;
