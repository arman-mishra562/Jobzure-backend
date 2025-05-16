import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from '../../config/Db';
import { generateOTP } from '../lib/mailOtp';
import { sendVerificationEmail } from '../service/mail.service';

dotenv.config();

export const registerAdmin = async (req: Request, res: any) => {
	try {
		const { email, name, password } = req.body;
		const otp = generateOTP();
		const codeExpiration = new Date(Date.now() + 10 * 60000);
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		const existingEmail = await prisma.admin.findUnique({
			where: {
				email,
			},
		});
		if (existingEmail) {
			return res.status(409).json({ message: 'Email already exists' });
		}
		const admin = await prisma.admin.create({
			data: {
				email,
				name,
				password: hashedPassword,
				verificationToken: otp,
				tokenExpiry: codeExpiration,
			},
		});
		await sendVerificationEmail(email, otp);
		res
			.status(201)
			.json({
				message: 'Admin registered successfully & verification email sent',
				admin,
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
				message:
					'Account not verified. Please check your email for verification code',
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
