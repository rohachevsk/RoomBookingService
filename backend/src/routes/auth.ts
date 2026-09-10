import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body ?? {};

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required',
            });
        }

        if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({
                message: 'Invalid input types',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'User with this email already exists',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            message: 'User registered successfully',
            user,
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
});
