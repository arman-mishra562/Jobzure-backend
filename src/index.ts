import express, { Request, Response } from 'express';
import UserRouter from './routes/user.routes';
import cors from 'cors';
import dotenv from 'dotenv';
import AdminRouter from './routes/admin.routes';
import SuperAdminRouter from './routes/superAdmin.routes';
import ApplicationRouter from './routes/application.routes';
import session from 'express-session';
import passport from 'passport';
import './config/passport';
import { apiLimiter } from './services/rateLimit';
dotenv.config();
const app = express();
app.set('trust proxy', 1);

app.use(
	cors({
		origin: [
			'http://localhost:3000',
			'http://localhost:3001',
			'https://www.jobzure.com',
			'https://jobzure.com',
		],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		optionsSuccessStatus: 200,
	}),
);

app.use(
	session({
		secret: process.env.COOKIE_SECRET!,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
		},
	}),
);

app.use(express.json());
app.use(apiLimiter);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1/user', UserRouter);
app.use('/api/v1/admin', AdminRouter);
app.use('/api/v1/super-admin', SuperAdminRouter);
app.use('/api/v1/application', ApplicationRouter);
app.get('/api/v1', (req: Request, res: Response) => {
	res.send('Hello World!');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
