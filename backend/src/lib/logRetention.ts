import { prisma } from './prisma';

const DEFAULT_RETENTION_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

export const getRetentionDays = () => {
    const parsed = Number(process.env.LOG_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_RETENTION_DAYS;
};

/** Deletes log records older than the retention period. Returns the number of deleted rows. */
export const purgeOldLogs = async (retentionDays: number = getRetentionDays()) => {
    const cutoff = new Date(Date.now() - retentionDays * DAY_MS);
    const result = await prisma.log.deleteMany({ where: { createdAt: { lt: cutoff } } });
    return result.count;
};

/** Runs the purge once a day in the background. Returns the timer handle. */
export const scheduleLogRetention = (intervalMs: number = DAY_MS) => {
    const timer = setInterval(() => {
        purgeOldLogs().catch((error) => {
            console.error('Log retention purge failed:', error);
        });
    }, intervalMs);
    if (typeof timer.unref === 'function') {
        timer.unref();
    }
    return timer;
};
