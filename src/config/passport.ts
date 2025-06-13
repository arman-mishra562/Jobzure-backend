import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import prisma from '../config/Db';
import bcrypt from 'bcryptjs';

// User authentication strategy
passport.use('user-local',
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		async (email, password, done) => {
			try {
				const user = await prisma.user.findUnique({ where: { email } });
				if (!user) return done(null, false, { message: 'Invalid credentials' });

				const validPassword = await bcrypt.compare(password, user.password);
				if (!validPassword)
					return done(null, false, { message: 'Invalid credentials' });

				return done(null, user);
			} catch (error) {
				return done(error);
			}
		},
	),
);

// Admin authentication strategy
passport.use('admin-local',
	new LocalStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		async (email, password, done) => {
			try {
				const admin = await prisma.admin.findUnique({ where: { email } });
				if (!admin) return done(null, false, { message: 'Invalid credentials' });

				const validPassword = await bcrypt.compare(password, admin.password);
				if (!validPassword)
					return done(null, false, { message: 'Invalid credentials' });

				return done(null, admin);
			} catch (error) {
				return done(error);
			}
		},
	),
);

passport.serializeUser((user: any, done) => {
	done(null, { id: user.id, type: user.email ? 'user' : 'admin' });
});

passport.deserializeUser(async (data: { id: string | number; type: string }, done) => {
	try {
		if (data.type === 'user') {
			const user = await prisma.user.findUnique({ where: { id: data.id as number } });
			done(null, user);
		} else {
			const admin = await prisma.admin.findUnique({ where: { id: data.id as string } });
			done(null, admin);
		}
	} catch (error) {
		done(error);
	}
});
