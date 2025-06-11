import { Request, Response } from 'express';
import prisma from '../config/Db';

export const uploadUserCV = async (req: Request, res: Response) => {
	try {
		if (!req.userId) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		const userId = req.userId;
		const {
			full_name,
			personalEmail,
			countryResident,
			workAuthorization,
			salaryExp,
			visaSponsor,
			targetJobLocation,
			interestedRoles,
			intrstdIndstries,
		} = req.body;

		if (
			!full_name ||
			!personalEmail ||
			!countryResident ||
			!workAuthorization ||
			typeof salaryExp !== 'number' ||
			typeof visaSponsor !== 'boolean' ||
			!Array.isArray(targetJobLocation) ||
			!Array.isArray(interestedRoles) ||
			!Array.isArray(intrstdIndstries)
		) {
			return res.status(400).json({ message: 'Invalid input' });
		}

		const resumeFile = req.file;
		if (!resumeFile) {
			return res.status(400).json({ message: 'Resume file is required' });
		}

		const resumeUrl = resumeFile.path; // or whatever your file upload logic returns

		const targetLocationConnect = targetJobLocation.map((value: string) => ({
			value,
		}));
		const interestedRolesConnect = interestedRoles.map((value: string) => ({
			value,
		}));
		const interestedIndustriesConnect = intrstdIndstries.map(
			(value: string) => ({
				value,
			}),
		);

		const existingDetails = await prisma.personalDetails.findUnique({
			where: { userId },
		});

		let personalDetails;

		if (existingDetails) {
			personalDetails = await prisma.personalDetails.update({
				where: { userId },
				data: {
					full_name,
					personalEmail,
					countryResident,
					workAuthorization,
					salaryExp,
					visaSponsor,
					resumeUrl,
					targetJobLocation: {
						set: [],
						connect: targetLocationConnect,
					},
					interestedRoles: {
						set: [],
						connect: interestedRolesConnect,
					},
					intrstdIndstries: {
						set: [],
						connect: interestedIndustriesConnect,
					},
				},
				include: {
					targetJobLocation: true,
					interestedRoles: true,
					intrstdIndstries: true,
				},
			});
		} else {
			personalDetails = await prisma.personalDetails.create({
				data: {
					userId,
					full_name,
					personalEmail,
					countryResident,
					workAuthorization,
					salaryExp,
					visaSponsor,
					resumeUrl,
					targetJobLocation: {
						connect: targetLocationConnect,
					},
					interestedRoles: {
						connect: interestedRolesConnect,
					},
					intrstdIndstries: {
						connect: interestedIndustriesConnect,
					},
				},
				include: {
					targetJobLocation: true,
					interestedRoles: true,
					intrstdIndstries: true,
				},
			});
		}

		res.status(200).json({
			message: 'CV uploaded and personal details saved successfully',
			personalDetails,
		});
	} catch (error) {
		console.error('Error uploading CV:', error);
		res.status(500).json({
			message: 'Failed to upload CV',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};
