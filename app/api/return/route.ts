import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { token, requestId } = await req.json();
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const reqObj = await prisma.borrowRequest.findUnique({ where: { id: Number(requestId) } });
  if (!reqObj) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  // Only allow returning own requests (or admin can return any)
  if (reqObj.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  if (reqObj.status !== 'Approved') {
    return NextResponse.json({ error: 'Can only return approved requests' }, { status: 400 });
  }
  const r = await prisma.borrowRequest.update({ where: { id: Number(requestId) }, data: { status: 'Returned', returnedAt: new Date() } });
  await writeLog(user.id, `Returned request ${requestId}`);
  return NextResponse.json(r);
}
