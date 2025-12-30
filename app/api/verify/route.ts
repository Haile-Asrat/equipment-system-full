import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { userId, email, code } = await req.json();
  let user;

  if (userId) {
    user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email: String(email) } });
  }

  if (!user) return NextResponse.json({ error: 'No user' }, { status: 404 });
  if (user.otpCode !== code) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) return NextResponse.json({ error: 'Code expired' }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, otpCode: null, otpExpiresAt: null } });
  await writeLog(user.id, 'Email verified');
  return NextResponse.json({ message: 'Verified' });
}
