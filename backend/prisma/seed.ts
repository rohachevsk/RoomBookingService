import { PrismaClient, UserRole, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const now = new Date();

    await prisma.log.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
        data: {
            fullName: 'Admin User',
            email: 'admin@example.com',
            passwordHash: bcrypt.hashSync('admin123', 10),
            role: UserRole.ADMIN,
        },
    });

    await prisma.user.createMany({
        data: [
            {
                fullName: 'Alice Johnson',
                email: 'alice@example.com',
                passwordHash: bcrypt.hashSync('alice123', 10),
                role: UserRole.USER,
            },
            {
                fullName: 'Bob Smith',
                email: 'bob@example.com',
                passwordHash: bcrypt.hashSync('bob123', 10),
                role: UserRole.USER,
            },
        ],
    });

    const usersList = await prisma.user.findMany();

    await prisma.room.createMany({
        data: [
            { name: 'Room Alpha', capacity: 6, equipment: ['projector', 'whiteboard'] },
            { name: 'Room Beta', capacity: 8, equipment: ['tv'] },
            { name: 'Room Gamma', capacity: 10, equipment: ['projector', 'tv'] },
            { name: 'Room Delta', capacity: 12, equipment: ['whiteboard'] },
        ],
    });

    const roomRecords = await prisma.room.findMany();

    await prisma.booking.createMany({
        data: [
            {
                roomId: roomRecords[0].id,
                userId: usersList[0].id,
                title: 'Product planning',
                startTime: new Date(now.getTime() + 3600000),
                endTime: new Date(now.getTime() + 3 * 3600000),
                status: BookingStatus.CONFIRMED,
            },
            {
                roomId: roomRecords[1].id,
                userId: usersList[1].id,
                title: 'Design review',
                startTime: new Date(now.getTime() + 4 * 3600000),
                endTime: new Date(now.getTime() + 6 * 3600000),
                status: BookingStatus.CONFIRMED,
            },
            {
                roomId: roomRecords[2].id,
                userId: admin.id,
                title: 'Executive meeting',
                startTime: new Date(now.getTime() + 8 * 3600000),
                endTime: new Date(now.getTime() + 10 * 3600000),
                status: BookingStatus.CONFIRMED,
            },
            {
                roomId: roomRecords[3].id,
                userId: usersList[0].id,
                title: 'Retrospective',
                startTime: new Date(now.getTime() + 12 * 3600000),
                endTime: new Date(now.getTime() + 14 * 3600000),
                status: BookingStatus.CANCELLED,
            },
        ],
    });

    console.log('Seed data created successfully');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
