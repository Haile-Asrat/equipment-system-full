import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
    new URL(req.url).searchParams.get('token');
  const user = await verifyToken(token || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.borrowRequest.findMany({
    where: user.role === 'admin' || user.role === 'manager'
      ? {}
      : { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { user: true, equipment: true }
  });

  return NextResponse.json(requests);
}

import { createUnauthorizedAccessAlert } from '@/src/lib/alerting';

export async function POST(req: Request) {
  const { token, equipmentId } = await req.json();
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const equipment = await prisma.equipment.findUnique({ where: { id: Number(equipmentId) } });
  if (!equipment) return NextResponse.json({ error: 'No equipment' }, { status: 404 });

  // MAC check
  if (equipment.sensitivity !== 'Public' && user.clearance !== equipment.sensitivity && user.role !== 'admin') {
    await writeLog(user.id, `Unauthorized access attempt on ${equipment.name} (Clearance mismatch)`, ipAddress);
    await createUnauthorizedAccessAlert(user.id, equipment.name, ipAddress);
    return NextResponse.json({ error: 'Not enough clearance' }, { status: 403 });
  }

  const r = await prisma.borrowRequest.create({ data: { userId: user.id, equipmentId: equipment.id } });
  await writeLog(user.id, `Requested equipment ${equipment.name}`, ipAddress);
  return NextResponse.json(r);
}
