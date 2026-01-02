import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    try {

        if (!token) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
        }

        // Find student by parent link token
        const student = await prisma.student.findUnique({
            where: { parentLinkToken: token },
            include: {
                school: {
                    select: {
                        schoolName: true
                    }
                },
                weeklyEvaluations: {
                    orderBy: { weekStartDate: 'desc' },
                    take: 10
                },
                monthlyEvaluations: {
                    orderBy: { createdAt: 'desc' },
                    take: 12
                },
                yearlyEvaluations: {
                    orderBy: { year: 'desc' },
                    take: 5
                },
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 7
                },
                presentations: {
                    orderBy: { date: 'desc' },
                    take: 1 // Get last presentation for recitation grade and date
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, student })
    } catch (error) {
        console.error('Error fetching parent data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
