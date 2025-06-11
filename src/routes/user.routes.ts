import express from 'express';
import {
	registerUser,
	loginUser,
	logoutUser,
	resend_verifyLink,
	forgotPassword,
	resetPassword,
} from '../controllers/user.controller';
import { verifyToken } from '../middlewares/middleware';
import {
	createOrUpdatePersonalDetails,
	getPersonalDetails,
} from '../controllers/personalDetails.controller';
import { verifyUser } from '../utils/user.mail2FA';
import passport from 'passport';
import {
	deleteResume,
	getResumeUrl,
	handleResumeUpload,
	uploadResume,
} from '../services/user.cv';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', passport.authenticate('local'), loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifyUser);
router.post('/re-verify', resend_verifyLink);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post(
	'/personalDetails',
	verifyToken,
	asyncHandler(createOrUpdatePersonalDetails),
);
router.get(
	'/getpersonalDetails',
	verifyToken,
	asyncHandler(getPersonalDetails),
);
router.post('/uploadResume', verifyToken, uploadResume, handleResumeUpload);
router.get('/getResumeUrl', verifyToken, getResumeUrl);
router.post('/deleteResume', verifyToken, deleteResume);
export default router;
