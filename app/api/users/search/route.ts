import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/src/lib/prisma';
import { verifyToken } from '@/src/lib/token';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!query) {
            return NextResponse.json([]);
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ],
                NOT: {
                    id: user.id // Exclude self
                }
            },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
