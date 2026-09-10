import { PrismaClient, UserRole, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@example.com',
            password: bcrypt.hashSync('admin123', 10),
            role: UserRole.ADMIN,
        },
    });

    await prisma.user.createMany({
        data: [
            {
                name: 'Alice Johnson',
                email: 'alice@example.com',
                password: bcrypt.hashSync('alice123', 10),
                role: UserRole.USER,
            },
            {
                name: 'Bob Smith',
                email: 'bob@example.com',
                password: bcrypt.hashSync('bob123', 10),
                role: UserRole.USER,
            },
        ],
    });

    const usersList = await prisma.user.findMany();

    await prisma.room.createMany({
        data: [
            { name: 'Room Alpha', floor: 1, capacity: 6 },
            { name: 'Room Beta', floor: 2, capacity: 8 },
            { name: 'Room Gamma', floor: 3, capacity: 10 },
            { name: 'Room Delta', floor: 4, capacity: 12 },
        ],
    });

    const roomRecords = await prisma.room.findMany();

    await prisma.booking.createMany({
        data: [
            {
                roomId: roomRecords[0].id,
                userId: usersList[0].id,
                startTime: new Date(now.getTime() + 3600000),
                endTime: new Date(now.getTime() + 3 * 3600000),
                status: BookingStatus.CONFIRMED,
            },
            {
                roomId: roomRecords[1].id,
                userId: usersList[1].id,
                startTime: new Date(now.getTime() + 4 * 3600000),
                endTime: new Date(now.getTime() + 6 * 3600000),
                status: BookingStatus.PENDING,
            },
            {
                roomId: roomRecords[2].id,
                userId: admin.id,
                startTime: new Date(now.getTime() + 8 * 3600000),
                endTime: new Date(now.getTime() + 10 * 3600000),
                status: BookingStatus.CONFIRMED,
            },
            {
                roomId: roomRecords[3].id,
                userId: usersList[0].id,
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
