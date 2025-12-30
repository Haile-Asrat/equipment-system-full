import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { randomBytes } from 'crypto';
import { sendMail } from '@/src/lib/email';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }

        // Generate secure reset token
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // Send reset email
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const emailText = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;

        try {
            await sendMail(email, 'Password Reset Request', emailText);
        } catch (error) {
            console.error('Failed to send reset email:', error);
            // Continue anyway - token is saved
        }

        await writeLog(user.id, 'Password reset requested', ipAddress);

        return NextResponse.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
