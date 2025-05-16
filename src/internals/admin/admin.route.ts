import express from 'express'
import { registerAdmin, loginAdmin } from './admin.controller'  
import { verifyTokenAdmin } from '../../middleware'
import { createCompanyListing } from './Company-Listing/admin.companylisting'
import { verifyAdmin } from './verify/admin.verify'

const AdminRouter = express.Router()

AdminRouter.post('/register', registerAdmin)
AdminRouter.post('/login', loginAdmin)
AdminRouter.post('/verify', verifyAdmin)
AdminRouter.post('/companyListing', verifyTokenAdmin, createCompanyListing);
export default AdminRouter
