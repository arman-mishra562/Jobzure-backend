import { Request, Response } from 'express';
import prisma from '../config/Db';

export const createOrUpdatePersonalDetails = async (
	req: Request,
	res: Response,
) => {
	try {
		if (!req.userId) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		const userId = req.userId;
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

		if (
			!full_name ||
			!personalEmail ||
			!countryResident ||
			!Array.isArray(targetJobLocation) ||
			!workAuthorization ||
			!Array.isArray(interestedRoles) ||
			!Array.isArray(intrstdIndstries) ||
			typeof salaryExp !== 'number' ||
			typeof visaSponsor !== 'boolean'
		) {
			return res.status(400).json({
				message: 'All fields are required and must be correctly typed',
			});
		}

		const targetLocationConnect = targetJobLocation.map((value: string) => ({
			value,
		}));
		const interestedRolesConnect = interestedRoles.map((value: string) => ({
			value,
		}));
		const interestedIndustriesConnect = intrstdIndstries.map(
			(value: string) => ({ value }),
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
					targetJobLocation: {
						set: [], // Clear all first
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
					full_name,
					personalEmail,
					countryResident,
					workAuthorization,
					salaryExp,
					visaSponsor,
					userId,
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
			message: 'Personal details saved successfully',
			personalDetails,
		});
	} catch (error) {
		console.error('Error submitting personal details:', error);
		res.status(500).json({
			message: 'Failed to save personal details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getPersonalDetails = async (req: Request, res: Response) => {
	try {
		if (!req.userId) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		const userId = req.userId;

		const personalDetails = await prisma.personalDetails.findUnique({
			where: { userId },
			include: {
				targetJobLocation: true,
				interestedRoles: true,
				intrstdIndstries: true,
			},
		});

		if (!personalDetails) {
			return res.status(404).json({ message: 'Personal details not found' });
		}

		res.status(200).json({
			message: 'Personal details retrieved successfully',
			personalDetails,
		});
	} catch (error) {
		console.error('Error fetching personal details:', error);
		res.status(500).json({
			message: 'Failed to retrieve personal details',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};
