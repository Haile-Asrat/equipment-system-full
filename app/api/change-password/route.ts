import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import bcrypt from 'bcrypt';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
    try {
        const { token, currentPassword, newPassword } = await req.json();
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // Verify user authentication
        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, dbUser.password);
        if (!validPassword) {
            await writeLog(user.id, 'Failed password change attempt - incorrect current password', ipAddress);
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        await writeLog(user.id, 'Password changed successfully', ipAddress);

        return NextResponse.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
