import { Router } from 'express';

export const roomsRouter = Router();

roomsRouter.get('/', (_req, res) => {
    res.json({ message: 'GET /api/rooms placeholder' });
});

roomsRouter.get('/:id', (_req, res) => {
    res.json({ message: 'GET /api/rooms/:id placeholder' });
});

roomsRouter.post('/', (_req, res) => {
    res.json({ message: 'POST /api/rooms placeholder' });
});

roomsRouter.put('/:id', (_req, res) => {
    res.json({ message: 'PUT /api/rooms/:id placeholder' });
});

roomsRouter.delete('/:id', (_req, res) => {
    res.json({ message: 'DELETE /api/rooms/:id placeholder' });
});
