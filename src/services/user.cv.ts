import { Request, Response, NextFunction } from 'express';
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
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowedFileTypes = ['.pdf', '.doc', '.docx'];
		const ext = path.extname(file.originalname).toLowerCase();
		allowedFileTypes.includes(ext)
			? cb(null, true)
			: cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
	},
}).single('resume');

export const uploadResume = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	upload(req, res, (err) => {
		if (err instanceof multer.MulterError || err) {
			return res.status(400).json({ message: err.message });
		}
		next();
	});
};

export const handleResumeUpload = async (req: Request, res: Response) => {
	try {
		if (!req.userId)
			return res.status(401).json({ message: 'Authentication required' });
		if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

		const userId = req.userId;
		const file = req.file;
		const timestamp = Date.now();
		const filename = `resumes/${userId}/${timestamp}-${file.originalname}`;
		const blob = bucket.file(filename);

		const blobStream = blob.createWriteStream({
			resumable: false,
			metadata: { contentType: file.mimetype },
		});

		blobStream.on('error', (err) => {
			console.error('Upload error:', err);
			return res.status(500).json({ message: 'Failed to upload resume' });
		});

		blobStream.on('finish', async () => {
			try {
				const gcsPath = blob.name;
				const existing = await prisma.personalDetails.findUnique({
					where: { userId },
				});

				if (existing) {
					await prisma.personalDetails.update({
						where: { userId },
						data: { resumeUrl: gcsPath },
					});
				} else {
					await prisma.personalDetails.create({
						data: {
							resumeUrl: gcsPath,
							userId,
							full_name: '',
							personalEmail: '',
							countryResident: 'USA',
							workAuthorization: 'NOT_SPECIFIED',
							targetJobLocation: { connect: [{ value: 'USA' }] },
							interestedRoles: { connect: [{ value: 'Full_Stack_Developer' }] },
							intrstdIndstries: { connect: [{ value: 'EDUCATION' }] },
							salaryExp: 0,
							visaSponsor: false,
						},
					});
				}

				return res
					.status(200)
					.json({ message: 'Resume uploaded successfully', gcsPath });
			} catch (error) {
				console.error('DB update error:', error);
				return res.status(500).json({
					message: 'Resume uploaded but database update failed',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		});

		blobStream.end(file.buffer);
	} catch (error) {
		console.error('Upload handling error:', error);
		return res.status(500).json({
			message: 'Resume upload processing failed',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const getResumeUrl = async (req: Request, res: Response) => {
	try {
		if (!req.userId)
			return res.status(401).json({ message: 'Authentication required' });

		const record = await prisma.personalDetails.findUnique({
			where: { userId: req.userId },
			select: { resumeUrl: true },
		});

		if (!record?.resumeUrl) {
			return res.status(404).json({ message: 'Resume not found' });
		}

		const [signedUrl] = await bucket.file(record.resumeUrl).getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + 15 * 60 * 1000,
		});

		return res
			.status(200)
			.json({ message: 'Resume URL retrieved', resumeUrl: signedUrl });
	} catch (error) {
		console.error('Signed URL error:', error);
		return res.status(500).json({
			message: 'Failed to retrieve resume URL',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};

export const deleteResume = async (req: Request, res: Response) => {
	try {
		if (!req.userId)
			return res.status(401).json({ message: 'Authentication required' });

		const record = await prisma.personalDetails.findUnique({
			where: { userId: req.userId },
			select: { resumeUrl: true },
		});

		if (!record?.resumeUrl) {
			return res.status(404).json({ message: 'No resume found to delete' });
		}

		try {
			await bucket.file(record.resumeUrl).delete();
		} catch (storageError) {
			console.error('Storage deletion error:', storageError);
		}

		await prisma.personalDetails.update({
			where: { userId: req.userId },
			data: { resumeUrl: null },
		});

		return res.status(200).json({ message: 'Resume deleted successfully' });
	} catch (error) {
		console.error('Delete resume error:', error);
		return res.status(500).json({
			message: 'Failed to delete resume',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
};
