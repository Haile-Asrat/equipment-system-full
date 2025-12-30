import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { token, requestId } = await req.json();
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reqObj = await prisma.borrowRequest.findUnique({
    where: { id: Number(requestId) },
    include: { equipment: true }
  });

  if (!reqObj) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Access Control Checks
  const isOwner = reqObj.equipment.ownerId === user.id;
  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

  // DAC: Owner can approve
  // RBAC: Manager/Admin can approve
  if (!isOwner && !isManagerOrAdmin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Prevent self-approval
  if (reqObj.userId === user.id) {
    return NextResponse.json({ error: 'Cannot approve your own request' }, { status: 403 });
  }

  // RuBAC: Time restriction (skip for admins, apply to managers and owners)
  if (user.role !== 'admin') {
    const config = await prisma.systemConfig.findMany({
      where: { key: { in: ['approvalStartHour', 'approvalEndHour'] } }
    });

    const configMap = config.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const startHour = parseInt(configMap['approvalStartHour'] || '8');
    const endHour = parseInt(configMap['approvalEndHour'] || '18');

    const hour = new Date().getHours();
    if (hour < startHour || hour > endHour) {
      await writeLog(user.id, `Approval blocked (RuBAC time restriction) for request ${reqObj.id}`, ipAddress);
      return NextResponse.json({ error: `Approvals allowed ${startHour}-${endHour} only` }, { status: 403 });
    }
  }

  const updated = await prisma.borrowRequest.update({
    where: { id: reqObj.id },
    data: { status: 'Approved', approvedById: user.id, approvedAt: new Date() }
  });

  const approvalType = isOwner ? 'Owner (DAC)' : `${user.role} (RBAC)`;
  await writeLog(user.id, `Approved request ${reqObj.id} as ${approvalType}`, ipAddress);

  return NextResponse.json(updated);
}
