import { Router } from 'express';
import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

export const bookingsRouter = Router();

const parseDate = (value: unknown) => {
    if (typeof value !== 'string') {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isQuarterHour = (date: Date) => (
    date.getUTCSeconds() === 0
    && date.getUTCMilliseconds() === 0
    && date.getUTCMinutes() % 15 === 0
);

const isValidDateQuery = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

bookingsRouter.get('/', async (req, res) => {
    try {
        if (!isValidDateQuery(req.query.date)) {
            return res.status(400).json({ message: 'date must use YYYY-MM-DD format' });
        }

        const startOfDay = new Date(`${req.query.date}T00:00:00.000Z`);
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const bookings = await prisma.booking.findMany({
            where: {
                status: BookingStatus.CONFIRMED,
                startTime: { lt: endOfDay },
                endTime: { gt: startOfDay },
            },
            include: { room: true, user: { select: { id: true, fullName: true } } },
            orderBy: { startTime: 'asc' },
        });

        return res.json(bookings);
    } catch (error) {
        console.error('List bookings error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

bookingsRouter.get('/my', authenticate, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user!.id },
            include: { room: true },
            orderBy: { startTime: 'desc' },
        });

        return res.json(bookings);
    } catch (error) {
        console.error('List user bookings error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

bookingsRouter.post('/', authenticate, async (req, res) => {
    try {
        const { roomId, title, startTime: startTimeInput, endTime: endTimeInput } = req.body ?? {};
        const startTime = parseDate(startTimeInput);
        const endTime = parseDate(endTimeInput);

        if (typeof roomId !== 'string' || typeof title !== 'string' || !title.trim() || !startTime || !endTime) {
            return res.status(400).json({ message: 'roomId, title, startTime and endTime are required' });
        }

        const duration = endTime.getTime() - startTime.getTime();
        const minimumDuration = 15 * 60 * 1000;
        const maximumDuration = 4 * 60 * 60 * 1000;

        if (endTime <= startTime || duration < minimumDuration || duration > maximumDuration) {
            return res.status(400).json({ message: 'Booking duration must be between 15 minutes and 4 hours' });
        }
        if (startTime.getTime() < Date.now()) {
            return res.status(400).json({ message: 'Booking cannot start in the past' });
        }
        if (!isQuarterHour(startTime) || !isQuarterHour(endTime)) {
            return res.status(400).json({ message: 'Booking times must use 15-minute increments' });
        }

        const booking = await prisma.$transaction(async (transaction) => {
            const room = await transaction.room.findUnique({ where: { id: roomId } });
            if (!room || !room.isActive) {
                throw new Error('ROOM_NOT_AVAILABLE');
            }

            const overlap = await transaction.booking.findFirst({
                where: {
                    roomId,
                    status: BookingStatus.CONFIRMED,
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                },
            });
            if (overlap) {
                throw new Error('BOOKING_OVERLAP');
            }

            const createdBooking = await transaction.booking.create({
                data: {
                    roomId,
                    userId: req.user!.id,
                    title: title.trim(),
                    startTime,
                    endTime,
                    status: BookingStatus.CONFIRMED,
                },
                include: { room: true },
            });

            await transaction.log.create({
                data: {
                    userId: req.user!.id,
                    action: 'CREATE',
                    entity: 'bookings',
                    entityId: createdBooking.id,
                    metadata: { roomId, startTime, endTime },
                },
            });

            return createdBooking;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        return res.status(201).json(booking);
    } catch (error) {
        if (error instanceof Error && error.message === 'ROOM_NOT_AVAILABLE') {
            return res.status(404).json({ message: 'Room not found or inactive' });
        }
        if (error instanceof Error && error.message === 'BOOKING_OVERLAP') {
            return res.status(409).json({ message: 'Room is already booked for this time interval' });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
            return res.status(409).json({ message: 'Booking conflict, please try again' });
        }

        console.error('Create booking error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

bookingsRouter.delete('/:id', authenticate, async (req, res) => {
    try {
        const bookingId = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!bookingId) {
            return res.status(400).json({ message: 'Invalid booking id' });
        }

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only the creator or an admin can cancel this booking' });
        }

        const cancelledBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.CANCELLED },
        });

        await prisma.log.create({
            data: {
                userId: req.user!.id,
                action: 'CANCEL',
                entity: 'bookings',
                entityId: booking.id,
            },
        });

        return res.json(cancelledBooking);
    } catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
