import { Request } from 'express';
import prisma from '../config/Db';

export const verifyAdmin = async (req: Request, res: any) => {
	try {
		const { token } = req.query;
		if (!token) return res.status(400).json({ error: 'Token is required.' });

		const admin = await prisma.admin.findFirst({
			where: { verificationToken: token as string },
		});

		if (!admin) {
			return res
				.status(400)
				.json({ error: 'Invalid or expired verification link.' });
		}

		if (admin.isVerified) {
			return res.status(400).json({ message: 'Admin already verified' });
		}

		if (admin.tokenExpiry! < new Date()) {
			return res.status(401).json({ message: 'Verification link expired' });
		}

		await prisma.admin.update({
			where: { id: admin.id },
			data: {
				isVerified: true,
				verificationToken: null,
				tokenExpiry: null,
			},
		});

		res.status(200).json({ message: 'Verification successful' });
	} catch (error) {
		res.status(500).json({
			message: 'Verification failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};
