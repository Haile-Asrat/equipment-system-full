import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){
  const data = {};
  data.users = await prisma.user.findMany();
  data.equipment = await prisma.equipment.findMany();
  data.requests = await prisma.borrowRequest.findMany();
  const out = path.join(process.cwd(),'backup_'+Date.now()+'.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log('Backup written to', out);
  await prisma.$disconnect();
}
main().catch(e=>{ console.error(e); process.exit(1); });
