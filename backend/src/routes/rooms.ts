import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

export const roomsRouter = Router();

roomsRouter.get('/', async (req, res) => {
    try {
        const capacityInput = req.query.minCapacity ?? req.query.capacity;
        const capacity = capacityInput ? Number(capacityInput) : undefined;
        const activeInput = req.query.active;
        const equipment = typeof req.query.equipment === 'string'
            ? req.query.equipment.split(',').map((item) => item.trim()).filter(Boolean)
            : [];

        if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 0)) {
            return res.status(400).json({ message: 'capacity must be a non-negative integer' });
        }
        if (activeInput !== undefined && activeInput !== 'true' && activeInput !== 'false') {
            return res.status(400).json({ message: 'active must be true or false' });
        }

        const rooms = await prisma.room.findMany({
            where: {
                ...(activeInput !== undefined ? { isActive: activeInput === 'true' } : {}),
                ...(capacity !== undefined
                    ? req.query.minCapacity ? { capacity: { gte: capacity } } : { capacity }
                    : {}),
                ...(equipment.length > 0 ? { equipment: { hasEvery: equipment } } : {}),
            },
            orderBy: { name: 'asc' },
        });

        return res.json(rooms);
    } catch (error) {
        console.error('List rooms error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

roomsRouter.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, capacity, equipment = [] } = req.body ?? {};

        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Room name is required' });
        }
        if (!Number.isInteger(capacity) || capacity <= 0) {
            return res.status(400).json({ message: 'Capacity must be a positive integer' });
        }
        if (!Array.isArray(equipment) || equipment.some((item) => typeof item !== 'string' || !item.trim())) {
            return res.status(400).json({ message: 'Equipment must be an array of strings' });
        }

        const room = await prisma.room.create({
            data: {
                name: name.trim(),
                capacity,
                equipment: equipment.map((item: string) => item.trim()),
            },
        });

        await prisma.log.create({
            data: {
                userId: req.user!.id,
                action: 'CREATE',
                entity: 'rooms',
                entityId: room.id,
                metadata: { name: room.name },
            },
        });

        return res.status(201).json(room);
    } catch (error) {
        console.error('Create room error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
