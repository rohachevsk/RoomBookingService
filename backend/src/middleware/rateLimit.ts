import { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const MAX_TRACKED_IPS = 1000;

interface AttemptWindow {
    count: number;
    windowStart: number;
}

const attempts = new Map<string, AttemptWindow>();

const pruneExpired = (now: number) => {
    for (const [ip, record] of attempts) {
        if (now - record.windowStart >= WINDOW_MS) {
            attempts.delete(ip);
        }
    }
};

/**
 * Simple in-memory sliding-window rate limiter for auth endpoints.
 * Blocks brute-force login/registration floods with 429 responses.
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip ?? 'unknown';

    if (attempts.size > MAX_TRACKED_IPS) {
        pruneExpired(now);
    }

    const record = attempts.get(ip);
    if (!record || now - record.windowStart >= WINDOW_MS) {
        attempts.set(ip, { count: 1, windowStart: now });
        return next();
    }

    record.count += 1;
    if (record.count > MAX_REQUESTS) {
        const retryAfter = Math.max(Math.ceil((record.windowStart + WINDOW_MS - now) / 1000), 1);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ message: 'Too many requests, please try again later' });
    }

    return next();
};
