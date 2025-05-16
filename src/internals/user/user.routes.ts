import express from 'express';
import {
	registerUser,
	loginUser,
	logoutUser,
	resend_verifyLink,
} from './user.controller';
import { verifyToken } from '../../middleware';
import {
	createOrUpdatePersonalDetails,
	getPersonalDetails,
} from './ValidUser/user.personal';
import { verifyUser } from './verify/user.mail2FA';
import passport from 'passport';
import {
	deleteResume,
	getResumeUrl,
	handleResumeUpload,
	uploadResume,
} from './storage/user.cv';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', passport.authenticate('local'), loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifyUser);
router.post('/re-verify', resend_verifyLink);
router.post('/personalDetails', verifyToken, createOrUpdatePersonalDetails);
router.get('/getpersonalDetails', verifyToken, getPersonalDetails);
router.post('/uploadResume', verifyToken, uploadResume, handleResumeUpload);
router.get('/getResumeUrl', verifyToken, getResumeUrl);
router.post('/deleteResume', verifyToken, deleteResume);
export default router;
