import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';

interface TokenPayload {
    sub: string;
    role: UserRole;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.header('authorization');
    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : undefined;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
        if (!payload.sub || !Object.values(UserRole).includes(payload.role)) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = { id: payload.sub, role: payload.role };
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
};
