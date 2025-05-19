import { z } from 'zod';

export const userSchema = z.object({
	email: z.string().email(),
	name: z.string().min(3).max(255),
	password: z.string().min(8).max(255),
});

export type UserSchema = z.infer<typeof userSchema>;
