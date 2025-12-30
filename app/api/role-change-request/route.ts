import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

export async function POST(req: Request) {
    try {
        const { token, requestedRole, reason } = await req.json();
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate requested role
        const validRoles = ['employee', 'manager', 'admin'];
        if (!validRoles.includes(requestedRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if user already has pending request
        const existingRequest = await prisma.roleChangeRequest.findFirst({
            where: {
                userId: user.id,
                status: 'Pending'
            }
        });

        if (existingRequest) {
            return NextResponse.json({ error: 'You already have a pending role change request' }, { status: 400 });
        }

        // Create role change request
        const request = await prisma.roleChangeRequest.create({
            data: {
                userId: user.id,
                currentRole: user.role,
                requestedRole,
                reason: reason || null
            }
        });

        await writeLog(user.id, `Requested role change from ${user.role} to ${requestedRole}`, ipAddress);

        return NextResponse.json({
            message: 'Role change request submitted successfully',
            request
        });
    } catch (error) {
        console.error('Error creating role change request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '');
        const user = await verifyToken(token);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's role change requests
        const requests = await prisma.roleChangeRequest.findMany({
            where: { userId: user.id },
            orderBy: { requestedAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching role change requests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
