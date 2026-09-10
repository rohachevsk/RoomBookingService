import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { roomsRouter } from './routes/rooms';
import { bookingsRouter } from './routes/bookings';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);

export default app;
