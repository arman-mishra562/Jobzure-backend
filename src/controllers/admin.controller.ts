import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from '../config/Db';
import { sendVerificationEmail, sendForgetEmail } from '../services/mail.service';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export const registerAdmin = async (req: Request, res: any) => {
	try {
		const { email, name, password } = req.body;
		const token = uuidv4();
		const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
		const verifyUrl = `${process.env.CLIENT_URL}/admin/verify?token=${token}`;

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const existingEmail = await prisma.admin.findUnique({
			where: { email },
		});
		if (existingEmail) {
			return res.status(409).json({ message: 'Email already exists' });
		}
		const admin = await prisma.admin.create({
			data: {
				email,
				name,
				password: hashedPassword,
				verificationToken: token,
				tokenExpiry: expiry,
			},
		});
		await sendVerificationEmail(email, verifyUrl);
		res.status(201).json({
			message: 'Admin registered successfully & verification email sent',
			admin: {
				id: admin.id,
				email: admin.email,
				name: admin.name,
				isVerified: admin.isVerified,
			},
		});
	} catch (error) {
		console.error('Error registering admin:', error);
		res.status(500).json({ message: 'Failed to register admin' });
	}
};

export const loginAdmin = async (req: Request, res: any) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: 'Email and password are required' });
		}
		const admin = await prisma.admin.findUnique({ where: { email } });
		if (!admin) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}
		const isValidPassword = await bcrypt.compare(password, admin.password);
		if (!isValidPassword) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}
		if (!process.env.JWT_SECRET_ADMIN) {
			console.error('JWT_SECRET_ADMIN is not defined in environment variables');
			return res.status(500).json({ message: 'Internal server error' });
		}
		if (!admin.isVerified) {
			return res.status(403).json({
				message: 'Account not verified. Please check your email for verification link',
				isVerified: false,
			});
		}
		const token = jwt.sign(
			{ adminId: admin.id },
			process.env.JWT_SECRET_ADMIN,
			{ expiresIn: '24h' },
		);
		const { password: _, ...adminWithoutPassword } = admin;
		res.status(200).json({
			message: 'Login successful',
			admin: adminWithoutPassword,
			token,
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ message: 'Failed to login' });
	}
};

export const logoutAdmin = (req: Request, res: Response) => {
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

export const resend_verifyLink = async (req: Request, res: any) => {
	try {
		const { email } = req.body;
		const admin = await prisma.admin.findUnique({ where: { email } });
		if (!admin) {
			res.status(404).json({ error: 'Admin not found' });
			return;
		}

		if (admin.isVerified) {
			res.status(400).json({ error: 'Email already verified' });
			return;
		}

		const token = uuidv4();
		const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
		const verifyUrl = `${process.env.CLIENT_URL}/admin/verify?token=${token}`;

		await prisma.admin.update({
			where: { id: admin.id },
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

export const forgotPassword = async (req: Request, res: any) => {
	try {
		const { email } = req.body;
		const admin = await prisma.admin.findUnique({ where: { email } });
		if (!admin) {
			return res.json({
				message: "If that email is registered, you'll receive a reset link.",
			});
		}

		const token = uuidv4();
		const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour
		const link = `${process.env.FRONTEND_URL}/admin/reset-password?token=${token}`;

		await prisma.admin.update({
			where: { id: admin.id },
			data: { resetToken: token, resetTokenExpiry: expiry },
		});

		await sendForgetEmail(email, link);
		res.json({
			message: "If that email is registered, you'll receive a reset link.",
		});
	} catch (error) {
		console.error('Forgot Password error:', error);
		res.status(500).json({
			message: 'Failed to Send Forget Password',
			error: error instanceof Error ? error.message : 'Internal server error',
		});
	}
};

export const resetPassword = async (req: Request, res: any) => {
	try {
		const { token, newPassword } = req.body;
		const admin = await prisma.admin.findFirst({
			where: {
				resetToken: token,
				resetTokenExpiry: { gt: new Date() },
			},
		});

		if (!admin) {
			return res.status(400).json({ error: 'Invalid or expired token' });
		}

		const hashed = await bcrypt.hash(newPassword, 10);
		await prisma.admin.update({
			where: { id: admin.id },
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
			message: 'Failed to Reset Password',
			error: error instanceof Error ? error.message : 'Internal server error',
		});
	}
};
