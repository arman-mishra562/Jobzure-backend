import express from 'express';
import { registerAdmin, loginAdmin } from '../controllers/admin.controller';
import { verifyTokenAdmin } from '../middlewares/middleware';
import { createCompanyListing } from '../utils/admin.companylisting';
import { verifyAdmin } from '../utils/admin.verify';

const AdminRouter = express.Router();

AdminRouter.post('/register', registerAdmin);
AdminRouter.post('/login', loginAdmin);
AdminRouter.post('/verify', verifyAdmin);
AdminRouter.post('/companyListing', verifyTokenAdmin, createCompanyListing);
export default AdminRouter;
