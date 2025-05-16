import { Request, Response } from 'express';
import prisma from '../../../config/Db';

export const createCompanyListing = async (req: Request, res: Response) => {
  try {
    if (!req.adminId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const adminId = req.adminId;
    const { 
      name, 
      description, 
      registrationNumber, 
      companyLocation, 
      targetIndustry, 
      role 
    } = req.body;

    if (!name || !description || !registrationNumber || !companyLocation || !targetIndustry || !role) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if a company with this registration number already exists
    const existingCompany = await prisma.companyListing.findFirst({
      where: { registrationNumber }
    });

    if (existingCompany) {
      res.status(409).json({ message: 'A company with this registration number already exists' });
      return;
    }

    const companyListing = await prisma.companyListing.create({
      data: {
        name,
        description,
        registrationNumber,
        companyLocation,
        targetIndustry,
        role,
        adminId
      }
    });

    res.status(201).json({ 
      message: 'Company listing created successfully', 
      companyListing 
    });

  } catch (error) {
    console.error('Error creating company listing:', error);
    res.status(500).json({ 
      message: 'Failed to create company listing', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};