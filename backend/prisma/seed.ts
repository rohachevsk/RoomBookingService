import { PrismaClient, UserRole, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const WIPE_FLAG = '--wipe';

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Refusing to seed the database in production. Aborting.');
    }

    const allowWipe = process.argv.includes(WIPE_FLAG);
    const now = new Date();

    if (allowWipe) {
        await prisma.log.deleteMany();
        await prisma.booking.deleteMany();
        await prisma.room.deleteMany();
        await prisma.user.deleteMany();
    } else {
        console.log('Preserving existing data. Pass --wipe for a clean reset.');
    }

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { fullName: 'Admin User', role: UserRole.ADMIN },
        create: {
            fullName: 'Admin User',
            email: 'admin@example.com',
            passwordHash: bcrypt.hashSync('admin123', 10),
            role: UserRole.ADMIN,
        },
    });

    const seedUsers = [
        { fullName: 'Alice Johnson', email: 'alice@example.com', password: 'alice123' },
        { fullName: 'Bob Smith', email: 'bob@example.com', password: 'bob123' },
    ];

    await Promise.all(
        seedUsers.map((seedUser) =>
            prisma.user.upsert({
                where: { email: seedUser.email },
                update: { fullName: seedUser.fullName, role: UserRole.USER },
                create: {
                    fullName: seedUser.fullName,
                    email: seedUser.email,
                    passwordHash: bcrypt.hashSync(seedUser.password, 10),
                    role: UserRole.USER,
                },
            }),
        ),
    );

    const usersList = await prisma.user.findMany();

    const seedRooms = [
        { name: 'Room Alpha', capacity: 6, equipment: ['projector', 'whiteboard'] },
        { name: 'Room Beta', capacity: 8, equipment: ['tv'] },
        { name: 'Room Gamma', capacity: 10, equipment: ['projector', 'tv'] },
        { name: 'Room Delta', capacity: 12, equipment: ['whiteboard'] },
    ];

    await Promise.all(
        seedRooms.map((seedRoom) =>
            prisma.room.upsert({
                where: { name: seedRoom.name },
                update: { capacity: seedRoom.capacity, equipment: seedRoom.equipment },
                create: seedRoom,
            }),
        ),
    );

    const roomRecords = await prisma.room.findMany();

    const bookingCount = await prisma.booking.count();
    if (bookingCount > 0) {
        console.log(`Skipping demo bookings: ${bookingCount} already exist.`);
    } else {
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
    }

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
