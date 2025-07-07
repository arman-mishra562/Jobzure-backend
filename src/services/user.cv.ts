import { Request, Response } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import prisma from '../config/Db';

const keyFileJson = process.env.GOOGLE_CLOUD_KEYFILE_PATH;
if (!keyFileJson) {
	throw new Error(
		'Missing GOOGLE_CLOUD_KEYFILE_JSON in environment variables.',
	);
}
const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	credentials: JSON.parse(keyFileJson),
});

const bucket = storage.bucket(
	process.env.GOOGLE_CLOUD_BUCKET_NAME || 'user-resumes-bucket',
);

const multerStorage = multer.memoryStorage();

const upload = multer({
	storage: multerStorage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB file size limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only PDF, DOC, and DOCX files
		const allowedFileTypes = ['.pdf', '.doc', '.docx'];
		const ext = path.extname(file.originalname).toLowerCase();

		if (allowedFileTypes.includes(ext)) {
			cb(null, true);
		} else {
			cb(new Error('Only PDF, DOC, and DOCX files are allowed') as any);
		}
	},
}).single('resume');

export const uploadResume = (req: Request, res: Response, next: Function) => {
	upload(req, res, (err) => {
		if (err instanceof multer.MulterError) {
			return res.status(400).json({ message: `Multer error: ${err.message}` });
		} else if (err) {
			return res.status(400).json({ message: err.message });
		}
		next();
	});
};

export const handleResumeUpload = async (req: Request, res: any) => {
	try {
		if (!req.userId) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		if (!req.file) {
			return res.status(400).json({ message: 'No file uploaded' });
		}

		const userId = req.userId;
		const file = req.file;

		const timestamp = Date.now();
		const filename = `resumes/${userId}/${timestamp}-${file.originalname}`;

		const blob = bucket.file(filename);
		const blobStream = blob.createWriteStream({
			resumable: false,
			metadata: {
				contentType: file.mimetype,
			},
		});

		blobStream.on('error', (err) => {
			console.error('Error uploading file to Google Cloud Storage:', err);
			return res.status(500).json({ message: 'Failed to upload resume' });
		});
		blobStream.on('finish', async () => {
			try {
				const gcsPath = blob.name;
				const personalDetails = await prisma.personalDetails.findUnique({
					where: { userId },
				});

				// const data = {
				// 	resumeUrl: gcsPath,
				// 	full_name: '',
				// 	personalEmail: '',
				// 	countryResident: 'USA',
				// 	targetJobLocation: 'USA',
				// 	workAuthorization: 'NOT_SPECIFIED',
				// 	interestedRoles: 'Full_Stack_Developer',
				// 	intrstdIndstries: 'EDUCATION',
				// 	salaryExp: 0,
				// 	visaSponsor: false,
				// };

				if (personalDetails) {
					await prisma.personalDetails.update({
						where: { userId },
						data: { resumeUrl: gcsPath },
					});
				} else {
					await prisma.personalDetails.create({
						data: {
							resumeUrl: filename,
							userId,
							full_name: '',
							personalEmail: '',
							countryResident: 'USA',
							workAuthorization: 'NOT_SPECIFIED',
							targetJobLocation: {
								connectOrCreate: [
									{
										where: { value: 'USA' },
										create: { value: 'USA' },
									},
								],
							},
							interestedRoles: {
								connectOrCreate: [
									{
										where: { value: 'Full_Stack_Developer' },
										create: { value: 'Full_Stack_Developer' },
									},
								],
							},
							intrstdIndstries: {
								connectOrCreate: [
									{
										where: { value: 'EDUCATION' },
										create: { value: 'EDUCATION' },
									},
								],
							},
							salaryExp: 0,
							visaSponsor: false,
						},
					});
				}

				return res.status(200).json({
					message: 'Resume uploaded successfully',
					gcsPath: gcsPath,
				});
			} catch (error) {
				console.error('Database update error:', error);
				return res.status(500).json({
					message: 'Resume uploaded but database update failed',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		});

		blobStream.end(file.buffer);
	} catch (error) {
		console.error('Upload processing error:', error);
		return res.status(500).json({
			message: 'Resume upload processing failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

// Controller to get resume URL
export const getResumeUrl = async (req: Request, res: any) => {
	try {
		if (!req.userId) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		const personalDetails = await prisma.personalDetails.findUnique({
			where: { userId: req.userId },
			select: { resumeUrl: true },
		});

		if (!personalDetails?.resumeUrl) {
			return res.status(404).json({ message: 'Resume not found' });
		}

		// Generate signed URL
		const [signedUrl] = await bucket
			.file(personalDetails.resumeUrl)
			.getSignedUrl({
				version: 'v4',
				action: 'read',
				expires: Date.now() + 15 * 60 * 1000, // 15 minutes
			});

		return res.status(200).json({
			message: 'Resume URL retrieved successfully',
			resumeUrl: signedUrl,
		});
	} catch (error) {
		console.error('Error generating signed URL:', error);
		return res.status(500).json({
			message: 'Failed to retrieve resume URL',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const deleteResume = async (req: Request, res: any) => {
	try {
		if (!req.userId) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		const userId = req.userId;

		const personalDetails = await prisma.personalDetails.findUnique({
			where: { userId },
			select: { resumeUrl: true },
		});

		if (!personalDetails || !personalDetails.resumeUrl) {
			return res.status(404).json({ message: 'No resume found to delete' });
		}

		const urlParts = personalDetails.resumeUrl.split('/');
		const filename = urlParts.slice(4).join('/');

		try {
			await bucket.file(filename).delete();
		} catch (storageError) {
			console.error('Error deleting file from storage:', storageError);
		}

		await prisma.personalDetails.update({
			where: { userId },
			data: { resumeUrl: null },
		});

		return res.status(200).json({
			message: 'Resume deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting resume:', error);
		return res.status(500).json({
			message: 'Failed to delete resume',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};
