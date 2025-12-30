import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

// GET - List all permissions for a specific equipment
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const equipmentId = searchParams.get('equipmentId');
        const token = searchParams.get('token');

        if (!equipmentId || !token) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const equipment = await prisma.equipment.findUnique({
            where: { id: Number(equipmentId) },
            include: {
                permissions: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });

        if (!equipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        // Only owner or admin can view permissions
        if (equipment.ownerId !== user.id && user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json(equipment.permissions);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Grant permission to a user
export async function POST(req: Request) {
    try {
        const { token, equipmentId, userId, canEdit, canDelete } = await req.json();
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const equipment = await prisma.equipment.findUnique({
            where: { id: Number(equipmentId) }
        });

        if (!equipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        // Only owner or admin can grant permissions
        if (equipment.ownerId !== user.id && user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: Number(userId) }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Don't allow granting permission to self
        if (targetUser.id === user.id) {
            return NextResponse.json({ error: 'Cannot grant permission to yourself' }, { status: 400 });
        }

        // Create or update permission
        const permission = await prisma.equipmentPermission.upsert({
            where: {
                equipmentId_userId: {
                    equipmentId: Number(equipmentId),
                    userId: Number(userId)
                }
            },
            update: {
                canEdit: canEdit ?? true,
                canDelete: canDelete ?? true
            },
            create: {
                equipmentId: Number(equipmentId),
                userId: Number(userId),
                grantedById: user.id,
                canEdit: canEdit ?? true,
                canDelete: canDelete ?? true
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        await writeLog(
            user.id,
            `Granted permission on equipment "${equipment.name}" to ${targetUser.email} (Edit: ${permission.canEdit}, Delete: ${permission.canDelete})`,
            ipAddress
        );

        return NextResponse.json(permission);
    } catch (error) {
        console.error('Error granting permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Revoke permission from a user
export async function DELETE(req: Request) {
    try {
        const { token, equipmentId, userId } = await req.json();
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const equipment = await prisma.equipment.findUnique({
            where: { id: Number(equipmentId) }
        });

        if (!equipment) {
            return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
        }

        // Only owner or admin can revoke permissions
        if (equipment.ownerId !== user.id && user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const permission = await prisma.equipmentPermission.findUnique({
            where: {
                equipmentId_userId: {
                    equipmentId: Number(equipmentId),
                    userId: Number(userId)
                }
            },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        if (!permission) {
            return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
        }

        await prisma.equipmentPermission.delete({
            where: {
                equipmentId_userId: {
                    equipmentId: Number(equipmentId),
                    userId: Number(userId)
                }
            }
        });

        await writeLog(
            user.id,
            `Revoked permission on equipment "${equipment.name}" from ${permission.user.email}`,
            ipAddress
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error revoking permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
