import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recalculateStudentStats } from '@/lib/logic'

const DeductionSchema = z.object({
    studentId: z.string(),
    points: z.number().positive(),
    reason: z.string().min(1)
})

export async function POST(request: Request) {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { studentId, points, reason } = DeductionSchema.parse(body)

        const student = await prisma.student.findUnique({
            where: { id: studentId }
        })

        if (!student || student.schoolId !== user.id) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Record Deduction (Negative points)
        const savedPoints = -Math.abs(points)

        const deduction = await prisma.deduction.create({
            data: {
                studentId,
                reason,
                points: savedPoints,
                date: new Date()
            }
        })

        // Recalculate Stats
        await recalculateStudentStats(studentId, new Date())

        return NextResponse.json({ success: true, deduction })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}
