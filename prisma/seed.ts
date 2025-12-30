import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const hashed = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { clearance: 'Top Secret', role: 'admin' },
    create: { name: 'Admin', email: 'admin@example.com', password: hashed, role: 'admin', clearance: 'Top Secret', emailVerified: true }
  });
  console.log('Admin id', admin.id);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
