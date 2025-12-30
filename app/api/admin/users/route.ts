import { NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { verifyToken } from '@/src/lib/token'
import { writeLog } from '@/src/lib/logger'

export async function GET(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '')
        const user = await verifyToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                clearance: true,
                emailVerified: true,
                failedLogins: true,
                lockedUntil: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '')
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        const user = await verifyToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const body = await req.json()
        const { userId, role, clearance, department } = body

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role,
                clearance,
                department,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                clearance: true,
                emailVerified: true,
                failedLogins: true,
                lockedUntil: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        await writeLog(user.id, `Updated user ${updatedUser.email} (Role: ${role}, Clearance: ${clearance})`, ipAddress)

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace('Bearer ', '')
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        const user = await verifyToken(token)

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const body = await req.json()
        const { userId } = body

        // Prevent admin from deleting themselves
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        // Delete user and handle related records
        // Use a transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // Delete logs created by this user
            await tx.log.deleteMany({
                where: { userId: userId }
            })

            // Delete borrow requests made by this user
            await tx.borrowRequest.deleteMany({
                where: { userId: userId }
            })

            // Update borrow requests approved by this user (set approvedById to null)
            await tx.borrowRequest.updateMany({
                where: { approvedById: userId },
                data: { approvedById: null }
            })

            // Update equipment owned by this user (set ownerId to null)
            await tx.equipment.updateMany({
                where: { ownerId: userId },
                data: { ownerId: null }
            })

            // Finally, delete the user
            await tx.user.delete({
                where: { id: userId }
            })
        })

        await writeLog(user.id, `Deleted user ID ${userId}`, ipAddress)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
