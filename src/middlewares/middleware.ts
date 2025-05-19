import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Extend the Express Request interface to include userId
declare global {
	namespace Express {
		interface Request {
			userId?: number;
			adminId?: string;
		}
	}
}

export const verifyToken = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			res.status(401).json({ message: 'Authorization token required' });
			return;
		}

		const token = authHeader.split(' ')[1];

		if (!process.env.JWT_SECRET) {
			console.error('JWT_SECRET is not defined in environment variables');
			res.status(500).json({ message: 'Internal server error' });
			return;
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
			userId: number;
		};

		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
		});

		if (!user) {
			res.status(401).json({ message: 'User not found' });
			return;
		}

		req.userId = decoded.userId;
		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			res.status(401).json({ message: 'Token expired' });
		} else if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({ message: 'Invalid token' });
		} else {
			console.error('Authentication error:', error);
			res.status(401).json({ message: 'Unauthorized' });
		}
	}
};

export const verifyTokenAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		// Authorization check
		if (!authHeader?.startsWith('Bearer ')) {
			res.status(401).json({ message: 'Authorization token required' });
			return;
		}

		const token = authHeader.split(' ')[1];

		// Environment check
		if (!process.env.JWT_SECRET_ADMIN) {
			console.error('JWT_SECRET_ADMIN missing');
			res.status(500).json({ message: 'Server configuration error' });
			return;
		}

		// Token verification
		const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN) as {
			adminId: string;
		};

		// Admin lookup
		const admin = await prisma.admin.findUnique({
			where: { id: decoded.adminId },
		});

		if (!admin) {
			res.status(401).json({ message: 'Admin not found' });
			return;
		}

		// Attach admin ID to request
		req.adminId = decoded.adminId;

		// Proceed to next middleware
		next();
		return;
	} catch (error) {
		// Error handling
		if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({ message: 'Invalid token' });
		} else if (error instanceof jwt.TokenExpiredError) {
			res.status(401).json({ message: 'Token expired' });
		} else {
			console.error('Authentication error:', error);
			res.status(401).json({ message: 'Unauthorized' });
		}
		return;
	}
};
