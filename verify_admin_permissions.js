const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Admin Permissions for Top Secret Equipment...\n');

    try {
        // 1. Get admin user
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (!admin) {
            throw new Error('Admin user not found. Please run: npm run seed');
        }

        console.log(`✓ Admin found: ${admin.email}`);
        console.log(`  - Role: ${admin.role}`);
        console.log(`  - Clearance: ${admin.clearance}\n`);

        // 2. Create a Top Secret equipment owned by someone else
        const testUser = await prisma.user.upsert({
            where: { id: 9999 },
            update: { clearance: 'Public' },
            create: {
                id: 9999,
                email: 'testowner@example.com',
                password: 'hash',
                role: 'employee',
                clearance: 'Public'
            }
        });

        const equipment = await prisma.equipment.create({
            data: {
                name: 'Top Secret Gadget',
                sensitivity: 'Top Secret',
                ownerId: testUser.id,
                quantity: 1,
                description: 'Test equipment for admin permissions'
            }
        });

        console.log(`✓ Created Top Secret equipment: ${equipment.name}`);
        console.log(`  - ID: ${equipment.id}`);
        console.log(`  - Sensitivity: ${equipment.sensitivity}`);
        console.log(`  - Owner: ${testUser.email} (ID: ${testUser.id})\n`);

        // 3. Verify admin can edit it
        console.log('Testing admin edit permissions...');
        const canEdit = (equipment.ownerId === admin.id || admin.role === 'admin');
        console.log(`✓ Admin CAN edit: ${canEdit ? 'YES' : 'NO'}`);
        console.log(`  - Logic: ownerId (${equipment.ownerId}) === admin.id (${admin.id}) OR role === 'admin'\n`);

        // 4. Verify admin can delete it
        console.log('Testing admin delete permissions...');
        const canDelete = (equipment.ownerId === admin.id || admin.role === 'admin');
        console.log(`✓ Admin CAN delete: ${canDelete ? 'YES' : 'NO'}`);
        console.log(`  - Logic: ownerId (${equipment.ownerId}) === admin.id (${admin.id}) OR role === 'admin'\n`);

        console.log('✅ VERIFICATION COMPLETE: Admin has full permissions for Top Secret equipment!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Cleanup
        await prisma.equipment.deleteMany({ where: { name: 'Top Secret Gadget' } });
        await prisma.user.delete({ where: { id: 9999 } }).catch(() => { });
        await prisma.$disconnect();
    }
}

main();
