import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
	sendVerificationEmail,
	sendForgetEmail,
} from '../services/mail.service';
dotenv.config();
import prisma from '../config/Db';

export const registerUser = async (req: Request, res: any) => {
	try {
		const { email, name, password } = req.body;

		const token = uuidv4();
		const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const verifyUrl = `${process.env.FRONTEND_URL}/auth/user/verify?token=${token}`;

		const salt = await bcrypt.genSalt(10);
		const userpassword = await bcrypt.hash(password, salt);
		const existingEmail = await prisma.user.findUnique({
			where: { email },
		});
		if (existingEmail) {
			return res.status(409).json({ message: 'Email already exists' });
		}
		const user = await prisma.user.create({
			data: {
				email,
				name,
				password: userpassword,
				verificationToken: token,
				tokenExpiry: expiry,
			},
		});

		await sendVerificationEmail(email, verifyUrl);
		res.status(201).json({
			message: 'User created successfully and verification email sent',
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				isVerified: user.isVerified,
			},
		});
	} catch (error) {
		res.status(500).json({
			message: 'Failed to create user',
			error,
		});
	}
};

export const resend_verifyLink = async (req: Request, res: any) => {
	try {
		const { email } = req.body;
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		if (user.isVerified) {
			res.status(400).json({ error: 'Email already verified' });
			return;
		}
		const token = uuidv4();
		const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
		const verifyUrl = `${process.env.FRONTEND_URL}/auth/user/verify?token=${token}`;

		await prisma.user.update({
			where: { id: user.id },
			data: {
				verificationToken: token,
				tokenExpiry: expiry,
			},
		});

		await sendVerificationEmail(email, verifyUrl);

		res.status(201).json({
			message: 'Resent verification email',
		});
	} catch (error) {
		console.error('Failed to Resend Verification Link', error);
		res.status(500).json({
			message: 'Failed to Resend Verification Link',
			error: error instanceof Error ? error.message : 'Internal server error',
		});
	}
};

export const loginUser = async (req: Request, res: any) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: 'Email and password are required' });
		}
		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				personalDetails: {
					include: {
						targetJobLocation: true,
						interestedRoles: true,
						intrstdIndstries: true,
					},
				},
			}
		});
		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}
		if (!process.env.JWT_SECRET) {
			console.error('JWT_SECRET is not defined in environment variables');
			return res.status(500).json({ message: 'Internal server error' });
		}
		if (!user.isVerified) {
			return res.status(403).json({
				message: 'Account not verified. Please Verify your Account',
				isVerified: false,
			});
		}
		const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
			expiresIn: '1h',
		});
		const { password: _, ...userWithoutPassword } = user;

		// Check completeness of personal details
		let hasPersonalDetails = false;
		if (user.personalDetails) {
			const pd = user.personalDetails;
			hasPersonalDetails =
				!!pd.full_name &&
				!!pd.personalEmail &&
				!!pd.countryResident &&
				!!pd.workAuthorization &&
				typeof pd.salaryExp === 'number' && pd.salaryExp > 0 &&
				typeof pd.visaSponsor === 'boolean' &&
				Array.isArray(pd.targetJobLocation) && pd.targetJobLocation.length > 0 &&
				Array.isArray(pd.interestedRoles) && pd.interestedRoles.length > 0 &&
				Array.isArray(pd.intrstdIndstries) && pd.intrstdIndstries.length > 0;
		}

		res.status(200).json({
			message: 'Login successful',
			user: userWithoutPassword,
			token,
			hasPersonalDetails
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			message: 'Failed to login',
			error: error instanceof Error ? error.message : 'Internal server error',
		});
	}
};

// Forgot Password
export const forgotPassword = async (req: Request, res: any) => {
	try {
		const { email } = req.body;
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.json({
				message: "If that email is registered, you'll receive a reset link."
			});
		}

		const token = uuidv4();
		const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour
		const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
		await prisma.user.update({
			where: { id: user.id },
			data: { resetToken: token, resetTokenExpiry: expiry },
		});
		await sendForgetEmail(email, link);
		res.json({
			message: "If that email is registered, you'll receive a reset link."
		});
	} catch (error) {
		console.error('Forgot Password error:', error);
		res.status(500).json({
			message: 'Failed to Send Forget Password ',
			error: error instanceof Error ? error.message : 'Internal server error',
		});
	}
};

// Reset Password
export const resetPassword = async (req: Request, res: any) => {
	try {
		const { token, newPassword } = req.body;
		// find user with matching token
		const user = await prisma.user.findFirst({
			where: {
				resetToken: token,
				resetTokenExpiry: { gt: new Date() },
			},
		});
		if (!user) {
			return res.status(400).json({ error: 'Invalid or expired token' });
		}
		const hashed = await bcrypt.hash(newPassword, 10);
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashed,
				resetToken: null,
				resetTokenExpiry: null,
			},
		});
		res.json({ message: 'Password has been reset successfully' });
	} catch (error) {
		console.error('Reset Password error:', error);
		res.status(500).json({
			message: 'Failed to Reset Password ',
			error: error instanceof Error ? error.message : 'Internal server error',
		});
	}
};

export const logoutUser = (req: Request, res: Response) => {
	req.logout((err) => {
		if (err) {
			console.error('Logout error:', err);
			return res.status(500).json({ message: 'Error logging out' });
		}
		req.session.destroy((err) => {
			if (err) {
				console.error('Session destruction error:', err);
				return res.status(500).json({ message: 'Error destroying session' });
			}
			res.clearCookie('connect.sid');
			res.status(200).json({ message: 'Logged out successfully' });
		});
	});
};
