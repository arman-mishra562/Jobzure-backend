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
	if (!user || !user.id) {
		return done(new Error('Invalid user object'));
	}
	done(null, { id: user.id, type: user.email ? 'user' : 'admin' });
});

passport.deserializeUser(async (data: any, done) => {
	try {
		if (!data || !data.id || !data.type) {
			return done(null, false); // Invalid session data
		}

		if (data.type === 'user') {
			const userId = typeof data.id === 'string' ? parseInt(data.id) : data.id;
			if (isNaN(userId)) {
				return done(null, false); // Invalid user ID
			}
			const user = await prisma.user.findUnique({
				where: { id: userId }
			});
			if (!user) {
				return done(null, false); // User not found
			}
			done(null, user);
		} else {
			const admin = await prisma.admin.findUnique({
				where: { id: data.id as string }
			});
			if (!admin) {
				return done(null, false); // Admin not found
			}
			done(null, admin);
		}
	} catch (error) {
		done(error);
	}
});
