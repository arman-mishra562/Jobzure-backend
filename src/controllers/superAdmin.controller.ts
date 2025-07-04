import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/Db';
import { sendVerificationEmail } from '../services/mail.service';
import dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

dotenv.config();

const MAX_USERS_PER_ADMIN = 10;

export const registerSuperAdmin = async (req: Request, res: Response) => {
	try {
		const { email, name, password } = req.body;
		const token = uuidv4();
		const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
		const verifyUrl = `${process.env.CLIENT_URL}/super-admin/verify?token=${token}`;

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const existingEmail = await prisma.superAdmin.findUnique({
			where: { email },
		});

		if (existingEmail) {
			return res.status(409).json({ message: 'Email already exists' });
		}

		const superAdmin = await prisma.superAdmin.create({
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
			message: 'Super Admin registered successfully & verification email sent',
			superAdmin: {
				id: superAdmin.id,
				email: superAdmin.email,
				name: superAdmin.name,
				isVerified: superAdmin.isVerified,
			},
		});
	} catch (error) {
		console.error('Error registering super admin:', error);
		res.status(500).json({ message: 'Failed to register super admin' });
	}
};

export const loginSuperAdmin = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res
				.status(400)
				.json({ message: 'Email and password are required' });
		}

		const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
		if (!superAdmin) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const isValidPassword = await bcrypt.compare(password, superAdmin.password);
		if (!isValidPassword) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		if (!process.env.JWT_SECRET_SUPER_ADMIN) {
			console.error(
				'JWT_SECRET_SUPER_ADMIN is not defined in environment variables',
			);
			return res.status(500).json({ message: 'Internal server error' });
		}

		if (!superAdmin.isVerified) {
			return res.status(403).json({
				message:
					'Account not verified. Please check your email for verification link',
				isVerified: false,
			});
		}

		const token = jwt.sign(
			{ superAdminId: superAdmin.id },
			process.env.JWT_SECRET_SUPER_ADMIN,
			{ expiresIn: '24h' },
		);

		const { password: _, ...superAdminWithoutPassword } = superAdmin;

		res.status(200).json({
			message: 'Login successful',
			superAdmin: superAdminWithoutPassword,
			token,
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ message: 'Failed to login' });
	}
};

export const assignUsersToAdmin = async (req: Request, res: Response) => {
	try {
		const { adminId, userIds } = req.body;

		if (
			!adminId ||
			!userIds ||
			!Array.isArray(userIds) ||
			userIds.length === 0
		) {
			return res
				.status(400)
				.json({ message: 'Admin ID and user IDs are required' });
		}

		const admin = await prisma.admin.findUnique({
			where: { id: adminId },
		});

		if (!admin) {
			return res.status(404).json({ message: 'Admin not found' });
		}

		// Check if assigning these users would exceed the limit of 5
		const currentUserCount = await prisma.user.count({
			where: { assignedAdminId: adminId },
		});

		if (currentUserCount + userIds.length > 5) {
			return res.status(400).json({
				message: 'Cannot assign more than 5 users to an admin',
			});
		}

		// Assign users to admin
		await prisma.user.updateMany({
			where: {
				id: { in: userIds.map((id: string) => parseInt(id)) },
			},
			data: {
				assignedAdminId: adminId,
			},
		});

		res.status(200).json({
			message: 'Users assigned successfully to admin',
		});
	} catch (error) {
		console.error('Error assigning users to admin:', error);
		res.status(500).json({
			message: 'Failed to assign users to admin',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getAdminUsers = async (req: Request, res: Response) => {
	try {
		const admins = await prisma.admin.findMany({
			include: {
				assignedUsers: true,
			},
		});

		res.status(200).json({
			message: 'Admin users retrieved successfully',
			admins,
		});
	} catch (error) {
		console.error('Error retrieving admin users:', error);
		res.status(500).json({ message: 'Failed to retrieve admin users' });
	}
};

export const getAllUsers = async (req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany({
			include: {
				personalDetails: {
					include: {
						targetJobLocation: true,
						interestedRoles: true,
						intrstdIndstries: true,
					},
				},
				assignedAdmin: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		res.status(200).json({
			message: 'All users retrieved successfully',
			users,
		});
	} catch (error) {
		console.error('Error retrieving all users:', error);
		res.status(500).json({
			message: 'Failed to retrieve users',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getAllAdmins = async (req: Request, res: Response) => {
	try {
		const admins = await prisma.admin.findMany({
			include: {
				assignedUsers: {
					include: {
						personalDetails: {
							include: {
								targetJobLocation: true,
								interestedRoles: true,
								intrstdIndstries: true,
							},
						},
					},
				},
			},
		});

		res.status(200).json({
			message: 'All admins retrieved successfully',
			admins,
		});
	} catch (error) {
		console.error('Error retrieving all admins:', error);
		res.status(500).json({
			message: 'Failed to retrieve admins',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getUserDetails = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		const user = await prisma.user.findUnique({
			where: {
				id: parseInt(userId),
			},
			include: {
				personalDetails: {
					include: {
						targetJobLocation: true,
						interestedRoles: true,
						intrstdIndstries: true,
					},
				},
				assignedAdmin: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
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

export const getAdminDetails = async (req: Request, res: Response) => {
	try {
		const { adminId } = req.params;

		const admin = await prisma.admin.findUnique({
			where: { id: adminId },
			include: {
				assignedUsers: {
					include: {
						personalDetails: {
							include: {
								targetJobLocation: true,
								interestedRoles: true,
								intrstdIndstries: true,
							},
						},
					},
				},
			},
		});

		if (!admin) {
			return res.status(404).json({ message: 'Admin not found' });
		}

		res.status(200).json({
			message: 'Admin details retrieved successfully',
			admin,
		});
	} catch (error) {
		console.error('Error retrieving admin details:', error);
		res.status(500).json({
			message: 'Failed to retrieve admin details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const createAdmin = async (req: Request, res: Response) => {
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
			message: 'Admin created successfully & verification email sent',
			admin: {
				id: admin.id,
				email: admin.email,
				name: admin.name,
				isVerified: admin.isVerified,
			},
		});
	} catch (error) {
		console.error('Error creating admin:', error);
		res.status(500).json({
			message: 'Failed to create admin',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const updateAdmin = async (req: Request, res: Response) => {
	try {
		const { adminId } = req.params;
		const { name, email } = req.body;

		const existingAdmin = await prisma.admin.findUnique({
			where: { id: adminId },
		});

		if (!existingAdmin) {
			return res.status(404).json({ message: 'Admin not found' });
		}

		// If email is being changed, check if it's already in use
		if (email && email !== existingAdmin.email) {
			const emailExists = await prisma.admin.findUnique({
				where: { email },
			});
			if (emailExists) {
				return res.status(409).json({ message: 'Email already exists' });
			}
		}

		const updatedAdmin = await prisma.admin.update({
			where: { id: adminId },
			data: {
				name: name || existingAdmin.name,
				email: email || existingAdmin.email,
			},
		});

		res.status(200).json({
			message: 'Admin updated successfully',
			admin: {
				id: updatedAdmin.id,
				email: updatedAdmin.email,
				name: updatedAdmin.name,
				isVerified: updatedAdmin.isVerified,
			},
		});
	} catch (error) {
		console.error('Error updating admin:', error);
		res.status(500).json({
			message: 'Failed to update admin',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const deleteAdmin = async (req: Request, res: Response) => {
	try {
		const { adminId } = req.params;

		const admin = await prisma.admin.findUnique({
			where: { id: adminId },
		});

		if (!admin) {
			return res.status(404).json({ message: 'Admin not found' });
		}

		// Remove admin assignment from users
		await prisma.user.updateMany({
			where: { assignedAdminId: adminId },
			data: { assignedAdminId: null },
		});

		// Delete the admin
		await prisma.admin.delete({
			where: { id: adminId },
		});

		res.status(200).json({
			message: 'Admin deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting admin:', error);
		res.status(500).json({
			message: 'Failed to delete admin',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const updateUser = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const { name, email } = req.body;

		const existingUser = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
		});

		if (!existingUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		// If email is being changed, check if it's already in use
		if (email && email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email },
			});
			if (emailExists) {
				return res.status(409).json({ message: 'Email already exists' });
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
			message: 'User updated successfully',
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				isVerified: updatedUser.isVerified,
			},
		});
	} catch (error) {
		console.error('Error updating user:', error);
		res.status(500).json({
			message: 'Failed to update user',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Delete user's personal details first
		await prisma.personalDetails.deleteMany({
			where: { userId: parseInt(userId) },
		});

		// Delete the user
		await prisma.user.delete({
			where: { id: parseInt(userId) },
		});

		res.status(200).json({
			message: 'User deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting user:', error);
		res.status(500).json({
			message: 'Failed to delete user',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const verifySuperAdmin = async (req: Request, res: Response) => {
	try {
		const { token } = req.query;
		if (!token) {
			return res.status(400).json({ error: 'Token is required.' });
		}

		const superAdmin = await prisma.superAdmin.findFirst({
			where: { verificationToken: token as string },
		});

		if (!superAdmin) {
			return res
				.status(400)
				.json({ error: 'Invalid or expired verification link.' });
		}

		if (superAdmin.isVerified) {
			return res.status(400).json({ message: 'Super Admin already verified' });
		}

		if (superAdmin.tokenExpiry! < new Date()) {
			return res.status(401).json({ message: 'Verification link expired' });
		}

		await prisma.superAdmin.update({
			where: { id: superAdmin.id },
			data: {
				isVerified: true,
				verificationToken: null,
				tokenExpiry: null,
			},
		});

		res.status(200).json({ message: 'Verification successful' });
	} catch (error) {
		console.error('Verification error:', error);
		res.status(500).json({
			message: 'Verification failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

// Get a user's personal details
export const getUserPersonalDetails = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const details = await prisma.personalDetails.findUnique({
			where: { userId: parseInt(userId) },
			include: {
				targetJobLocation: true,
				interestedRoles: true,
				intrstdIndstries: true,
			},
		});
		if (!details)
			return res.status(404).json({ message: 'Personal details not found' });
		res.status(200).json({ personalDetails: details });
	} catch (error) {
		console.error('Failed to fetch personal details:', error);
		res
			.status(500)
			.json({
				message: 'Failed to fetch personal details',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// Update a user's personal details
export const updateUserPersonalDetails = async (
	req: Request,
	res: Response,
) => {
	try {
		const { userId } = req.params;
		const {
			full_name,
			personalEmail,
			countryResident,
			targetJobLocation,
			workAuthorization,
			interestedRoles,
			intrstdIndstries,
			salaryExp,
			visaSponsor,
		} = req.body;
		const details = await prisma.personalDetails.update({
			where: { userId: parseInt(userId) },
			data: {
				full_name,
				personalEmail,
				countryResident,
				workAuthorization,
				salaryExp,
				visaSponsor,
				targetJobLocation: {
					set: [],
					connectOrCreate: (targetJobLocation as string[]).map(
						(value: string) => ({ where: { value }, create: { value } }),
					),
				},
				interestedRoles: {
					set: [],
					connectOrCreate: (interestedRoles as string[]).map(
						(value: string) => ({ where: { value }, create: { value } }),
					),
				},
				intrstdIndstries: {
					set: [],
					connectOrCreate: (intrstdIndstries as string[]).map(
						(value: string) => ({ where: { value }, create: { value } }),
					),
				},
			},
			include: {
				targetJobLocation: true,
				interestedRoles: true,
				intrstdIndstries: true,
			},
		});
		res
			.status(200)
			.json({ message: 'Personal details updated', personalDetails: details });
	} catch (error) {
		console.error('Failed to update personal details:', error);
		res
			.status(500)
			.json({
				message: 'Failed to update personal details',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// Delete a user's personal details
export const deleteUserPersonalDetails = async (
	req: Request,
	res: Response,
) => {
	try {
		const { userId } = req.params;
		const details = await prisma.personalDetails.findUnique({
			where: { userId: parseInt(userId) },
		});
		if (!details) {
			return res.status(404).json({ message: 'Personal details not found' });
		}
		await prisma.personalDetails.delete({
			where: { userId: parseInt(userId) },
		});
		res.status(200).json({ message: 'Personal details deleted' });
	} catch (error) {
		console.error('Failed to delete personal details:', error);
		res
			.status(500)
			.json({
				message: 'Failed to delete personal details',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// Assign unassigned users to admins or queue them
export const autoAssignUsers = async (req: Request, res: Response) => {
	try {
		// Get all admins and their assigned user counts
		const admins = await prisma.admin.findMany({
			include: { assignedUsers: true },
		});
		// Get all unassigned users (not disabled)
		const unassignedUsers = await prisma.user.findMany({
			where: { assignedAdminId: null, status: 'ACTIVE' },
		});
		let assigned = 0,
			queued = 0;
		for (const user of unassignedUsers) {
			// Find admin with the fewest users and under the limit
			const availableAdmins = admins.filter(
				(a) => a.assignedUsers.length < MAX_USERS_PER_ADMIN,
			);
			if (availableAdmins.length > 0) {
				// Assign to the admin with the fewest users
				availableAdmins.sort(
					(a, b) => a.assignedUsers.length - b.assignedUsers.length,
				);
				await prisma.user.update({
					where: { id: user.id },
					data: { assignedAdminId: availableAdmins[0].id },
				});
				assigned++;
				// Update in-memory count for this loop
				availableAdmins[0].assignedUsers.push(user);
			} else {
				// Add to queue if not already queued
				const alreadyQueued = await prisma.userAssignmentQueue.findUnique({
					where: { userId: user.id },
				});
				if (!alreadyQueued) {
					await prisma.userAssignmentQueue.create({
						data: { userId: user.id },
					});
					queued++;
				}
			}
		}
		res
			.status(200)
			.json({ message: 'Auto-assignment complete', assigned, queued });
	} catch (error) {
		console.error('Auto-assignment error:', error);
		res
			.status(500)
			.json({
				message: 'Failed to auto-assign users',
				error: error instanceof Error ? error.message : error,
			});
	}
};

// Process the queue when an admin becomes available
export const processAssignmentQueue = async () => {
	// Find all admins with available slots
	const admins = await prisma.admin.findMany({
		include: { assignedUsers: true },
	});
	const availableAdmins = admins.filter(
		(a) => a.assignedUsers.length < MAX_USERS_PER_ADMIN,
	);
	if (availableAdmins.length === 0) return;
	// Get users in the queue, ordered by createdAt
	const queue = await prisma.userAssignmentQueue.findMany({
		orderBy: { createdAt: 'asc' },
	});
	for (const admin of availableAdmins) {
		let slots = MAX_USERS_PER_ADMIN - admin.assignedUsers.length;
		while (slots > 0 && queue.length > 0) {
			const nextUser = queue.shift();
			if (!nextUser) break;
			await prisma.user.update({
				where: { id: nextUser.userId },
				data: { assignedAdminId: admin.id },
			});
			await prisma.userAssignmentQueue.delete({
				where: { userId: nextUser.userId },
			});
			slots--;
		}
	}
};

// Get the current assignment queue
export const getAssignmentQueue = async (req: Request, res: Response) => {
	try {
		const queue = await prisma.userAssignmentQueue.findMany({
			include: { user: true },
			orderBy: { createdAt: 'asc' },
		});
		res.status(200).json({ queue });
	} catch (error) {
		console.error('Failed to fetch assignment queue:', error);
		res
			.status(500)
			.json({
				message: 'Failed to fetch assignment queue',
				error: error instanceof Error ? error.message : error,
			});
	}
};

export const dashboardSummary = async (req: Request, res: Response) => {
	try {
		const totalUsers = await prisma.user.count();
		const activeUsers = await prisma.user.count({
			where: { status: 'ACTIVE' },
		});
		const disabledUsers = await prisma.user.count({
			where: { status: 'DISABLED' },
		});
		const totalAdmins = await prisma.admin.count();
		const usersInQueue = await prisma.userAssignmentQueue.count();
		const usersAssigned = await prisma.user.count({
			where: { assignedAdminId: { not: null } },
		});
		const usersUnassigned = await prisma.user.count({
			where: { assignedAdminId: null },
		});
		const applicationsCount = await prisma.application.count();
		res.status(200).json({
			totalUsers,
			activeUsers,
			disabledUsers,
			totalAdmins,
			usersInQueue,
			usersAssigned,
			usersUnassigned,
			applicationsCount,
		});
	} catch (error) {
		console.error('Dashboard summary error:', error);
		res
			.status(500)
			.json({
				message: 'Failed to fetch dashboard summary',
				error: error instanceof Error ? error.message : error,
			});
	}
};
