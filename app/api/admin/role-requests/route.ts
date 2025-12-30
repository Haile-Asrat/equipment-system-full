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

        const { searchParams } = new URL(req.url);
        const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

        // Get all pending role change requests
        const requests = await prisma.roleChangeRequest.findMany({
            where: { status: 'Pending' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: true
                    }
                }
            },
            orderBy: { requestedAt: sortOrder }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching role requests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { token, requestId, action } = await req.json(); // action: 'approve' or 'reject'
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        const admin = await verifyToken(token);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get the request
        const request = await prisma.roleChangeRequest.findUnique({
            where: { id: requestId },
            include: { user: true }
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'Pending') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        if (action === 'approve') {
            // Update user role and request status in transaction
            await prisma.$transaction(async (tx) => {
                // Update user role
                await tx.user.update({
                    where: { id: request.userId },
                    data: { role: request.requestedRole }
                });

                // Update request status
                await tx.roleChangeRequest.update({
                    where: { id: requestId },
                    data: {
                        status: 'Approved',
                        reviewedAt: new Date(),
                        reviewedById: admin.id
                    }
                });
            });

            await writeLog(admin.id, `Approved role change for user ${request.user.email} from ${request.currentRole} to ${request.requestedRole}`, ipAddress);
            await writeLog(request.userId, `Role changed from ${request.currentRole} to ${request.requestedRole} (approved by admin)`, ipAddress);

            return NextResponse.json({ message: 'Role change approved successfully' });
        } else if (action === 'reject') {
            // Update request status
            await prisma.roleChangeRequest.update({
                where: { id: requestId },
                data: {
                    status: 'Rejected',
                    reviewedAt: new Date(),
                    reviewedById: admin.id
                }
            });

            await writeLog(admin.id, `Rejected role change request for user ${request.user.email}`, ipAddress);
            await writeLog(request.userId, `Role change request rejected by admin`, ipAddress);

            return NextResponse.json({ message: 'Role change request rejected' });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error processing role request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
