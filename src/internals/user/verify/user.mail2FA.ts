import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyUser = async (req: Request, res: any) => {
	try {
		const { token } = req.query;
		if (!token) return res.status(400).json({ error: 'Token is required.' });

		const user = await prisma.user.findFirst({
			where: { verificationToken: token as string },
		});
		if (!user)
			return res
				.status(400)
				.json({ error: 'Invalid or expired verification link.' });

		if (user.isVerified)
			return res.status(400).json({ message: 'User already verified' });

		if (user.tokenExpiry! < new Date())
			return res.status(401).json({ message: 'link expired' });

		await prisma.user.update({
			where: { id: user.id },
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
