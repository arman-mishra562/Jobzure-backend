import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
	host: 'smtp.hostinger.com',
	port: 465,
	secure: true,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

export const sendVerificationEmail = async (email: string, link: string) => {
	const mailOptions = {
		from: `"Jobzure Verification" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: 'Verify Your Account',
		html: `<h2>Your verification link is Below</h2><br><p> <a href="${link}">Verify your email</a></p>`,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log('Verification email sent to:', email);
	} catch (error) {
		console.error('Error sending verification email:', error);
		throw error;
	}
};
export const sendForgetEmail = async (email: string, link: string) => {
	const mailOptions = {
		from: `"Jobzure Forgot Password" <${process.env.EMAIL_USER}>`,
		to: email,
		subject: 'Reset your Password',
		html: `<h2>Password Reset Request</h2><br><p>Click the link below to reset your password (valid for 1 hour):</p><br><a href="${link}">Reset Password</a>`,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log('Reset Password email sent to:', email);
	} catch (error) {
		console.error('Error sending Reset Password email:', error);
		throw error;
	}
};
