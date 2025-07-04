import express from 'express';
import {
	createApplication,
	getApplicationsByUser,
	getApplicationById,
	updateApplication,
	deleteApplication,
} from '../controllers/application.controller';
import { asyncHandler } from '../utils/asyncHandler';
import {
	verifyAdminOrSuperAdmin,
	verifyTokenSuperAdmin,
} from '../middlewares/middleware';

const router = express.Router();

router.post(
	'/applications',
	verifyAdminOrSuperAdmin,
	asyncHandler(createApplication),
);
router.get(
	'/applications/user/:userId',
	verifyAdminOrSuperAdmin,
	asyncHandler(getApplicationsByUser),
);
router.get(
	'/applications/:applicationId',
	verifyAdminOrSuperAdmin,
	asyncHandler(getApplicationById),
);
router.put(
	'/applications/:applicationId',
	verifyAdminOrSuperAdmin,
	asyncHandler(updateApplication),
);
router.delete(
	'/applications/:applicationId',
	verifyTokenSuperAdmin,
	asyncHandler(deleteApplication),
);

export default router;
