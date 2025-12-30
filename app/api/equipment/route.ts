import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';
import { writeLog } from '@/src/lib/logger';

export async function GET() {
  const items = await prisma.equipment.findMany({
    include: {
      owner: true,
      permissions: true
    }
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { name, description, quantity, sensitivity, token } = await req.json();
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const user = await verifyToken(token);
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const item = await prisma.equipment.create({ data: { name, description, quantity: Number(quantity), sensitivity, ownerId: user.id } });
  await writeLog(user.id, `Created equipment ${name} (Owner: ${user.email})`, ipAddress);
  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  try {
    const { id, name, description, quantity, sensitivity, token } = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user = await verifyToken(token);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const equipment = await prisma.equipment.findUnique({ where: { id: Number(id) } });
    if (!equipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check Permissions
    const permission = await prisma.equipmentPermission.findUnique({
      where: {
        equipmentId_userId: {
          equipmentId: equipment.id,
          userId: user.id
        }
      }
    });

    const isOwner = equipment.ownerId === user.id;
    const isAdmin = user.role === 'admin';
    const canEdit = isOwner || isAdmin || (permission && permission.canEdit);

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updated = await prisma.equipment.update({
      where: { id: equipment.id },
      data: {
        name,
        description,
        quantity: Number(quantity),
        sensitivity
      }
    });

    await writeLog(user.id, `Updated equipment ${updated.name}`, ipAddress);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { equipmentId, token } = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const user = await verifyToken(token);

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const equipment = await prisma.equipment.findUnique({ where: { id: Number(equipmentId) } });
    if (!equipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check Permissions
    const permission = await prisma.equipmentPermission.findUnique({
      where: {
        equipmentId_userId: {
          equipmentId: equipment.id,
          userId: user.id
        }
      }
    });

    const isOwner = equipment.ownerId === user.id;
    const isAdmin = user.role === 'admin';
    const canDelete = isOwner || isAdmin || (permission && permission.canDelete);

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete equipment and handle related records using transaction
    await prisma.$transaction(async (tx) => {
      // Delete all borrow requests for this equipment
      await tx.borrowRequest.deleteMany({
        where: { equipmentId: equipment.id }
      });

      // Delete the equipment
      await tx.equipment.delete({
        where: { id: equipment.id }
      });
    });

    await writeLog(user.id, `Deleted equipment ID ${equipment.id}`, ipAddress);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
