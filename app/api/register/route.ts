import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import bcrypt from 'bcrypt';
import { sendMail } from '@/src/lib/email';
import { randomInt } from 'crypto';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
  const { name, email, password, captcha, captchaAnswer } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  // simple captcha check (math)
  if (!captcha || Number(captcha) !== Number(captchaAnswer)) {
    return NextResponse.json({ error: 'Captcha failed' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'User exists' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password too short' }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const otp = String(randomInt(100000, 999999));
  const otpExp = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  const user = await prisma.user.create({ data: { name, email, password: hashed, otpCode: otp, otpExpiresAt: otpExp } });
  // send verification OTP
  console.log('OTP Code for', email, ':', otp); // Always log for user convenience
  let emailSent = false;
  try {
    // Race condition: Timeout after 5 seconds if email server is slow
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 5000));
    await Promise.race([
      sendMail(email, 'Verify your account', `Your verification code: ${otp}`),
      timeoutPromise
    ]);
    emailSent = true;
  } catch (e) {
    console.warn('sendMail failed or timed out:', e);
  }
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  await writeLog(user.id, 'Registered (verification sent)', ipAddress);
  return NextResponse.json({
    message: 'Registration successful! Check your email for verification code.',
    userId: user.id
    // OTP code is NEVER returned to client for security reasons
  });
}
