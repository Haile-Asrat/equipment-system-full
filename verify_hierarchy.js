
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

function signToken(payload) {
    return jwt.sign(payload, process.env.NEXTAUTH_SECRET || 'secret', { expiresIn: '8h' });
}

async function main() {
    console.log('Starting Hierarchy Verification...');

    const tsUserId = 9001;

    try {
        // 1. Setup Users - Use admin as owner
        const owner = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (!owner) {
            throw new Error('Admin user not found. Please run: npm run seed');
        }

        const tsUser = await prisma.user.upsert({
            where: { id: tsUserId },
            update: { clearance: 'Top Secret' },
            create: { id: tsUserId, email: 'ts_hierarchy@example.com', password: 'hash', role: 'employee', clearance: 'Top Secret' }
        });

        // 2. Create Secret Equipment
        const equipment = await prisma.equipment.create({
            data: {
                name: 'Secret Gadget for TS User',
                sensitivity: 'Secret',
                ownerId: owner.id,
                quantity: 1
            }
        });

        console.log(`Created Secret equipment ${equipment.id}`);

        const tsToken = signToken({ id: tsUser.id, role: tsUser.role, clearance: tsUser.clearance });

        // 3. Test TS User accessing Secret Equipment
        console.log('Testing TS User accessing Secret Equipment...');
        const res = await fetch('http://localhost:3000/api/borrow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tsToken, equipmentId: equipment.id })
        });

        if (res.ok) {
            console.log('RESULT: ALLOWED. Top Secret CAN borrow Secret.');
        } else {
            const d = await res.json();
            console.log(`RESULT: DENIED (${res.status}). Top Secret CANNOT borrow Secret.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Cleanup
        await prisma.borrowRequest.deleteMany({ where: { name: 'Secret Gadget for TS User' } }).catch(() => { }); // clean requests if any
        await prisma.equipment.deleteMany({ where: { name: 'Secret Gadget for TS User' } });
        await prisma.user.delete({ where: { id: tsUserId } }).catch(() => { });
        await prisma.$disconnect();
    }
}

main();
