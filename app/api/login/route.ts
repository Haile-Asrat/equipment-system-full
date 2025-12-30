import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { writeLog } from '@/src/lib/logger';
import { createFailedLoginAlert, createLockoutAlert } from '@/src/lib/alerting';

const LOCK_THRESHOLD = 5;
const LOCK_TIME_MS = 1000 * 60 * 2; // 2min

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 401 });

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return NextResponse.json({ error: 'Account locked' }, { status: 403 });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } });
    const u2 = await prisma.user.findUnique({ where: { id: user.id } });

    if (u2 && u2.failedLogins >= LOCK_THRESHOLD) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lockedUntil: new Date(Date.now() + LOCK_TIME_MS), failedLogins: 0 }
      });
      await writeLog(user.id, 'Account locked due to failed logins', ipAddress);
      await createLockoutAlert(user.id, ipAddress);
    } else {
      await writeLog(user.id, `Failed login attempt #${u2?.failedLogins || 1}`, ipAddress);
      if (u2) {
        await createFailedLoginAlert(user.id, ipAddress, u2.failedLogins);
      }
    }
    return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  }

  if (!user.emailVerified) return NextResponse.json({ error: 'Email not verified', userId: user.id }, { status: 403 });

  // success
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0 } });
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, clearance: user.clearance },
    process.env.NEXTAUTH_SECRET || 'secret',
    { expiresIn: '8h' }
  );
  await writeLog(user.id, 'Logged in', ipAddress);
  return NextResponse.json({ token });
}
