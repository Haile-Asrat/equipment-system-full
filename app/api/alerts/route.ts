import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';

export async function GET(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const user = await verifyToken(token);

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get unresolved alerts
        const alerts = await prisma.alert.findMany({
            where: { resolved: false },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { severity: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 100
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { token, alertId } = await req.json();
        const user = await verifyToken(token);

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Mark alert as resolved
        await prisma.alert.update({
            where: { id: alertId },
            data: {
                resolved: true,
                resolvedAt: new Date()
            }
        });

        return NextResponse.json({ message: 'Alert resolved' });
    } catch (error) {
        console.error('Error resolving alert:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
