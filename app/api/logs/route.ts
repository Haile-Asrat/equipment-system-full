import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { decrypt } from '@/src/lib/crypto';

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ','');
  const user = await verifyToken(token);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const logs = await prisma.log.findMany({ orderBy: { timestamp: 'desc' }, take: 200 });
  const out = logs.map(l => ({ id: l.id, action: decrypt(l.action), timestamp: l.timestamp, userId: l.userId }));
  return NextResponse.json(out);
}
