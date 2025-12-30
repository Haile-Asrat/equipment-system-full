import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { randomInt } from 'crypto';
import { sendMail } from '@/src/lib/email';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Don't reveal user existence
            return NextResponse.json({ message: 'If account exists, code sent.' });
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: 'Account already verified' }, { status: 400 });
        }

        const otp = String(randomInt(100000, 999999));
        const otpExp = new Date(Date.now() + 1000 * 60 * 30); // 30 min

        await prisma.user.update({
            where: { id: user.id },
            data: { otpCode: otp, otpExpiresAt: otpExp }
        });

        try {
            console.log('OTP Code for', email, ':', otp); // Always log for user convenience
            await sendMail(email, 'Verify your account', `Your verification code: ${otp}`);
        } catch (e) {
            console.error('Failed to send email:', e);
        }

        await writeLog(user.id, 'Verification code resent');

        return NextResponse.json({ message: 'If account exists, code sent.' });
    } catch (error) {
        console.error('Resend code error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
