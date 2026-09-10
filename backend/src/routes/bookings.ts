import { Router } from 'express';

export const bookingsRouter = Router();

bookingsRouter.get('/', (_req, res) => {
    res.json({ message: 'GET /api/bookings placeholder' });
});

bookingsRouter.get('/:id', (_req, res) => {
    res.json({ message: 'GET /api/bookings/:id placeholder' });
});

bookingsRouter.post('/', (_req, res) => {
    res.json({ message: 'POST /api/bookings placeholder' });
});

bookingsRouter.put('/:id', (_req, res) => {
    res.json({ message: 'PUT /api/bookings/:id placeholder' });
});

bookingsRouter.delete('/:id', (_req, res) => {
    res.json({ message: 'DELETE /api/bookings/:id placeholder' });
});
