import { Request, Response } from 'express';
import prisma from '../config/Db';

// Create a new application for a user
export const createApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, companyName, role, applicationDate, status } = req.body;
        const application = await prisma.application.create({
            data: {
                userId: parseInt(userId),
                companyName,
                role,
                applicationDate: new Date(applicationDate),
                status,
            },
        });
        res.status(201).json({ message: 'Application created', application });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create application', error: error instanceof Error ? error.message : error });
    }
};

// List all applications for a user
export const getApplicationsByUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const applications = await prisma.application.findMany({ where: { userId: parseInt(userId) } });
        res.status(200).json({ applications });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch applications', error: error instanceof Error ? error.message : error });
    }
};

// Get a single application by its ID
export const getApplicationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const application = await prisma.application.findUnique({ where: { id: parseInt(applicationId) } });
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        res.status(200).json({ application });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch application', error: error instanceof Error ? error.message : error });
    }
};

// Update an application
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const { companyName, role, applicationDate, status } = req.body;
        const application = await prisma.application.update({
            where: { id: parseInt(applicationId) },
            data: {
                companyName,
                role,
                applicationDate: applicationDate ? new Date(applicationDate) : undefined,
                status,
            },
        });
        res.status(200).json({ message: 'Application updated', application });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update application', error: error instanceof Error ? error.message : error });
    }
};

// Delete an application
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { applicationId } = req.params;
        await prisma.application.delete({ where: { id: parseInt(applicationId) } });
        res.status(200).json({ message: 'Application deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete application', error: error instanceof Error ? error.message : error });
    }
};

// Get all applications for the authenticated user
export const getUserApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const applications = await prisma.application.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            message: 'Applications retrieved successfully',
            applications,
            count: applications.length
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch applications',
            error: error instanceof Error ? error.message : error
        });
    }
};

// Get a specific application by ID for the authenticated user
export const getUserApplicationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { applicationId } = req.params;

        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const application = await prisma.application.findFirst({
            where: {
                id: parseInt(applicationId),
                userId: userId
            }
        });

        if (!application) {
            res.status(404).json({ message: 'Application not found or access denied' });
            return;
        }

        res.status(200).json({
            message: 'Application retrieved successfully',
            application
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch application',
            error: error instanceof Error ? error.message : error
        });
    }
};

