import { Request, Response } from 'express';
import prisma from '../../../config/Db';

export const createOrUpdatePersonalDetails = async (req: Request, res: any) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.userId;
    const { 
      firstName, 
      lastName, 
      personalEmail, 
      countryResident, 
      targetJobLocation, 
      workAuthorization 
    } = req.body;

    if (!firstName || !lastName || !personalEmail || !countryResident || 
        !targetJobLocation || !workAuthorization) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingDetails = await prisma.personalDetails.findUnique({
      where: { userId }
    });

    let personalDetails;

    if (existingDetails) {
      personalDetails = await prisma.personalDetails.update({
        where: { userId },
        data: {
          firstName,
          lastName,
          personalEmail,
          countryResident,
          targetJobLocation,
          workAuthorization
        }
      });
    } else {
      personalDetails = await prisma.personalDetails.create({
        data: {
          firstName,
          lastName,
          personalEmail,
          countryResident,
          targetJobLocation,
          workAuthorization,
          userId
        }
      });
    }

    return res.status(200).json({
      message: 'Personal details saved successfully',
      personalDetails
    });
  } catch (error) {
    console.error('Error submitting personal details:', error);
    return res.status(500).json({ 
      message: 'Failed to save personal details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPersonalDetails = async (req: Request, res: any) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.userId;

    const personalDetails = await prisma.personalDetails.findUnique({
      where: { userId }
    });

    if (!personalDetails) {
      return res.status(404).json({ message: 'Personal details not found' });
    }

    return res.status(200).json({ 
      message: 'Personal details retrieved successfully',
      personalDetails 
    });
  } catch (error) {
    console.error('Error fetching personal details:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve personal details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};