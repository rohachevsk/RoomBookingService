import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body ?? {};

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: 'Full name, email and password are required',
            });
        }

        if (typeof fullName !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
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
                fullName,
                email: email.toLowerCase(),
                passwordHash: hashedPassword,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        await prisma.log.create({
            data: {
                userId: user.id,
                action: 'REGISTER',
                entity: 'users',
                entityId: user.id,
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

authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { role: user.role },
            env.jwtSecret,
            { subject: user.id, expiresIn: '1h' },
        );

        await prisma.log.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                entity: 'users',
                entityId: user.id,
            },
        });

        return res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
