import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

export async function GET(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const user = await verifyToken(token);

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const configs = await prisma.systemConfig.findMany();
        const configMap = configs.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json({
            approvalStartHour: parseInt(configMap['approvalStartHour'] || '8'),
            approvalEndHour: parseInt(configMap['approvalEndHour'] || '18')
        });
    } catch (error) {
        console.error('Error fetching config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { token, approvalStartHour, approvalEndHour } = await req.json();
        const admin = await verifyToken(token);

        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (approvalStartHour < 0 || approvalStartHour > 23 || approvalEndHour < 0 || approvalEndHour > 23) {
            return NextResponse.json({ error: 'Invalid hours (0-23)' }, { status: 400 });
        }

        await prisma.$transaction([
            prisma.systemConfig.upsert({
                where: { key: 'approvalStartHour' },
                update: { value: String(approvalStartHour) },
                create: { key: 'approvalStartHour', value: String(approvalStartHour) }
            }),
            prisma.systemConfig.upsert({
                where: { key: 'approvalEndHour' },
                update: { value: String(approvalEndHour) },
                create: { key: 'approvalEndHour', value: String(approvalEndHour) }
            })
        ]);

        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        await writeLog(admin.id, `Updated system approved hours to ${approvalStartHour}-${approvalEndHour}`, ipAddress);

        return NextResponse.json({ message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
