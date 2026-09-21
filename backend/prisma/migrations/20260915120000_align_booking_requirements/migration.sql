CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_roomId_fkey";
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_userId_fkey";
DROP INDEX IF EXISTS "Booking_roomId_startTime_idx";
DROP INDEX IF EXISTS "Booking_startTime_endTime_idx";
DROP INDEX IF EXISTS "User_email_key";

ALTER TABLE "User" RENAME TO users;
ALTER TABLE "Room" RENAME TO rooms;
ALTER TABLE "Booking" RENAME TO bookings;

ALTER TABLE users RENAME COLUMN "name" TO full_name;
ALTER TABLE users RENAME COLUMN "password" TO password_hash;
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE rooms RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE rooms RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE rooms DROP COLUMN IF EXISTS floor;
ALTER TABLE rooms DROP COLUMN IF EXISTS updated_at;
ALTER TABLE rooms ADD COLUMN equipment TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE bookings RENAME COLUMN "roomId" TO room_id;
ALTER TABLE bookings RENAME COLUMN "userId" TO user_id;
ALTER TABLE bookings RENAME COLUMN "startTime" TO start_time;
ALTER TABLE bookings RENAME COLUMN "endTime" TO end_time;
ALTER TABLE bookings RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE bookings ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled meeting';
ALTER TABLE bookings ALTER COLUMN title DROP DEFAULT;

ALTER TABLE users ADD COLUMN id_uuid UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE rooms ADD COLUMN id_uuid UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE bookings ADD COLUMN id_uuid UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE bookings ADD COLUMN room_id_uuid UUID;
ALTER TABLE bookings ADD COLUMN user_id_uuid UUID;

UPDATE bookings b
SET room_id_uuid = r.id_uuid
FROM rooms r
WHERE r.id = b.room_id;

UPDATE bookings b
SET user_id_uuid = u.id_uuid
FROM users u
WHERE u.id = b.user_id;

ALTER TABLE bookings ALTER COLUMN room_id_uuid SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN user_id_uuid SET NOT NULL;

ALTER TABLE users DROP CONSTRAINT "User_pkey";
ALTER TABLE rooms DROP CONSTRAINT "Room_pkey";
ALTER TABLE bookings DROP CONSTRAINT "Booking_pkey";

ALTER TABLE users DROP COLUMN id;
ALTER TABLE rooms DROP COLUMN id;
ALTER TABLE bookings DROP COLUMN id;
ALTER TABLE bookings DROP COLUMN room_id;
ALTER TABLE bookings DROP COLUMN user_id;

ALTER TABLE users RENAME COLUMN id_uuid TO id;
ALTER TABLE rooms RENAME COLUMN id_uuid TO id;
ALTER TABLE bookings RENAME COLUMN id_uuid TO id;
ALTER TABLE bookings RENAME COLUMN room_id_uuid TO room_id;
ALTER TABLE bookings RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE rooms ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);
ALTER TABLE bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);

ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE rooms ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE bookings ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE INDEX bookings_room_id_start_time_idx ON bookings(room_id, start_time);
CREATE INDEX bookings_start_time_end_time_idx ON bookings(start_time, end_time);

CREATE TYPE "BookingStatus_new" AS ENUM ('CONFIRMED', 'CANCELLED');
ALTER TABLE bookings ALTER COLUMN status DROP DEFAULT;
UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'PENDING';
ALTER TABLE bookings ALTER COLUMN status TYPE "BookingStatus_new" USING status::text::"BookingStatus_new";
DROP TYPE "BookingStatus";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

ALTER TABLE bookings ADD CONSTRAINT bookings_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT logs_pkey PRIMARY KEY (id),
    CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX logs_entity_entity_id_idx ON logs(entity, entity_id);
CREATE INDEX logs_user_id_created_at_idx ON logs(user_id, created_at);
