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

        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // Fetch all data
        const data = {
            timestamp: new Date().toISOString(),
            users: await prisma.user.findMany(),
            equipment: await prisma.equipment.findMany(),
            borrowRequests: await prisma.borrowRequest.findMany(),
            logs: await prisma.log.findMany(),
            roleChangeRequests: await prisma.roleChangeRequest.findMany(),
            systemConfig: await prisma.systemConfig.findMany(),
            alerts: await prisma.alert.findMany(),
        };

        await writeLog(user.id, 'Downloaded system data backup', ipAddress);

        const json = JSON.stringify(data, null, 2);
        const filename = `backup_${new Date().getTime()}.json`;

        return new NextResponse(json, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Error generating backup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
