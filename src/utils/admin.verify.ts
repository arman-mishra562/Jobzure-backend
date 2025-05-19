import { Request } from 'express';
import prisma from '../config/Db';

export const verifyAdmin = async (req: Request, res: any) => {
	try {
		const { email, code } = req.body;

		const admin = await prisma.admin.findUnique({
			where: { email },
		});

		if (!admin) return res.status(404).json({ message: 'Admin not found' });
		if (admin.isVerified)
			return res.status(400).json({ message: 'Admin already verified' });
		if (admin.verificationToken !== code)
			return res.status(401).json({ message: 'Invalid OTP' });
		if (admin.tokenExpiry! < new Date())
			return res.status(401).json({ message: 'OTP expired' });

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
