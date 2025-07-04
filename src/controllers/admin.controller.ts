import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from '../config/Db';
import {
	sendVerificationEmail,
	sendForgetEmail,
} from '../services/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { processAssignmentQueue } from './superAdmin.controller';

dotenv.config();

export const registerAdmin = async (
	req: Request,
	res: Response,
): Promise<void> => {
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
			res.status(409).json({ message: 'Email already exists' });
			return;
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

export const loginAdmin = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			res.status(400).json({ message: 'Email and password are required' });
			return;
		}
		const admin = await prisma.admin.findUnique({ where: { email } });
		if (!admin) {
			res.status(401).json({ message: 'Invalid email or password' });
			return;
		}
		const isValidPassword = await bcrypt.compare(password, admin.password);
		if (!isValidPassword) {
			res.status(401).json({ message: 'Invalid email or password' });
			return;
		}
		if (!process.env.JWT_SECRET_ADMIN) {
			console.error('JWT_SECRET_ADMIN is not defined in environment variables');
			res.status(500).json({ message: 'Internal server error' });
			return;
		}
		if (!admin.isVerified) {
			res.status(403).json({
				message:
					'Account not verified. Please check your email for verification link',
				isVerified: false,
			});
			return;
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

export const resend_verifyLink = async (
	req: Request,
	res: Response,
): Promise<void> => {
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

export const forgotPassword = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { email } = req.body;
		const admin = await prisma.admin.findUnique({ where: { email } });
		if (!admin) {
			res.json({
				message: "If that email is registered, you'll receive a reset link.",
			});
			return;
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

export const resetPassword = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { token, newPassword } = req.body;
		const admin = await prisma.admin.findFirst({
			where: {
				resetToken: token,
				resetTokenExpiry: { gt: new Date() },
			},
		});

		if (!admin) {
			res.status(400).json({ error: 'Invalid or expired token' });
			return;
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

export const getAssignedUsers = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const users = await prisma.user.findMany({
			where: {
				assignedAdminId: adminId,
			},
			include: {
				personalDetails: {
					include: {
						targetJobLocation: true,
						interestedRoles: true,
						intrstdIndstries: true,
					},
				},
			},
		});
		res.status(200).json({
			message: 'Assigned users retrieved successfully',
			users,
		});
	} catch (error) {
		console.error('Error retrieving assigned users:', error);
		res.status(500).json({
			message: 'Failed to retrieve assigned users',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getAssignedUserDetails = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId } = req.params;
		const user = await prisma.user.findFirst({
			where: {
				id: parseInt(userId),
				assignedAdminId: adminId,
			},
			include: {
				personalDetails: {
					include: {
						targetJobLocation: true,
						interestedRoles: true,
						intrstdIndstries: true,
					},
				},
			},
		});
		if (!user) {
			res.status(404).json({
				message: 'User not found or not assigned to this admin',
			});
			return;
		}
		res.status(200).json({
			message: 'User details retrieved successfully',
			user,
		});
	} catch (error) {
		console.error('Error retrieving user details:', error);
		res.status(500).json({
			message: 'Failed to retrieve user details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const updateAssignedUserDetails = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId } = req.params;
		const { name, email } = req.body;
		const existingUser = await prisma.user.findFirst({
			where: {
				id: parseInt(userId),
				assignedAdminId: adminId,
			},
		});
		if (!existingUser) {
			res.status(404).json({
				message: 'User not found or not assigned to this admin',
			});
			return;
		}
		if (email && email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email },
			});
			if (emailExists) {
				res.status(409).json({ message: 'Email already exists' });
				return;
			}
		}
		const updatedUser = await prisma.user.update({
			where: { id: parseInt(userId) },
			data: {
				name: name || existingUser.name,
				email: email || existingUser.email,
			},
		});
		res.status(200).json({
			message: 'User details updated successfully',
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				isVerified: updatedUser.isVerified,
			},
		});
	} catch (error) {
		console.error('Error updating user details:', error);
		res.status(500).json({
			message: 'Failed to update user details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getAssignedUserPersonalDetails = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId } = req.params;
		const user = await prisma.user.findFirst({
			where: {
				id: parseInt(userId),
				assignedAdminId: adminId,
			},
			include: {
				personalDetails: {
					include: {
						targetJobLocation: true,
						interestedRoles: true,
						intrstdIndstries: true,
					},
				},
			},
		});
		if (!user) {
			res.status(404).json({
				message: 'User not found or not assigned to this admin',
			});
			return;
		}
		if (!user.personalDetails) {
			res.status(404).json({
				message: 'Personal details not found for this user',
			});
			return;
		}
		res.status(200).json({
			message: 'User personal details retrieved successfully',
			personalDetails: user.personalDetails,
		});
	} catch (error) {
		console.error('Error retrieving user personal details:', error);
		res.status(500).json({
			message: 'Failed to retrieve user personal details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const verifyAdmin = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { token } = req.query;

		if (!token) {
			res.status(400).json({ message: 'Verification token is required' });
			return;
		}

		const admin = await prisma.admin.findFirst({
			where: {
				verificationToken: token as string,
				tokenExpiry: { gt: new Date() },
			},
		});

		if (!admin) {
			res
				.status(400)
				.json({ message: 'Invalid or expired verification token' });
			return;
		}

		await prisma.admin.update({
			where: { id: admin.id },
			data: {
				isVerified: true,
				verificationToken: null,
				tokenExpiry: null,
			},
		});

		res.status(200).json({ message: 'Email verified successfully' });
	} catch (error) {
		console.error('Error verifying admin:', error);
		res.status(500).json({
			message: 'Failed to verify email',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

// Create application for a user (admin only for assigned users)
export const createUserApplication = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId } = req.params;
		const { companyName, role, applicationDate, status } = req.body;

		// Check if user is assigned to this admin
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId), assignedAdminId: adminId },
		});
		if (!user) {
			res.status(403).json({ message: 'User not assigned to this admin' });
			return;
		}

		const application = await prisma.application.create({
			data: {
				userId: user.id,
				companyName,
				role,
				applicationDate: new Date(applicationDate),
				status,
			},
		});
		res.status(201).json({ message: 'Application created', application });
	} catch (error) {
		res
			.status(500)
			.json({
				message: 'Failed to create application',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// List applications for a user (admin only for assigned users)
export const listUserApplications = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId } = req.params;
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId), assignedAdminId: adminId },
		});
		if (!user) {
			res.status(403).json({ message: 'User not assigned to this admin' });
			return;
		}
		const applications = await prisma.application.findMany({
			where: { userId: user.id },
		});
		res.status(200).json({ applications });
	} catch (error) {
		res
			.status(500)
			.json({
				message: 'Failed to fetch applications',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// Update application status (admin only for assigned users)
export const updateUserApplication = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId, applicationId } = req.params;
		const { status } = req.body;
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId), assignedAdminId: adminId },
		});
		if (!user) {
			res.status(403).json({ message: 'User not assigned to this admin' });
			return;
		}
		const application = await prisma.application.update({
			where: { id: parseInt(applicationId) },
			data: { status },
		});
		res.status(200).json({ message: 'Application updated', application });
	} catch (error) {
		res
			.status(500)
			.json({
				message: 'Failed to update application',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// Mark user as completed (disable user)
export const markUserAsCompleted = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const adminId = req.adminId;
		const { userId } = req.params;
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId), assignedAdminId: adminId },
		});
		if (!user) {
			res.status(403).json({ message: 'User not assigned to this admin' });
			return;
		}
		await prisma.user.update({
			where: { id: user.id },
			data: { status: 'DISABLED' },
		});
		await processAssignmentQueue();
		res.status(200).json({ message: 'User marked as completed and disabled' });
	} catch (error) {
		res
			.status(500)
			.json({
				message: 'Failed to mark user as completed',
				error: error instanceof Error ? error.message : error,
			});
	}
};
