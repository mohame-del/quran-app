import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recalculateStudentStats } from '@/lib/logic'

const PresentationSchema = z.object({
    studentId: z.string(),
    date: z.string(),
    hizb: z.number().optional(),
    quarter: z.number().optional(),
    surah: z.string().optional(),
    grade: z.string().optional(),
})

export async function POST(request: Request) {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { studentId, date, hizb, quarter, surah, grade } = PresentationSchema.parse(body)

        const student = await prisma.student.findUnique({
            where: { id: studentId }
        })

        if (!student || student.schoolId !== user.id) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Record presentation
        const presentation = await prisma.presentation.create({
            data: {
                studentId,
                date: new Date(date),
                hizb: hizb ?? student.currentHizb,
                quarter: quarter ?? student.currentQuarter,
                surah,
                grade
            }
        })

        // Update student progress
        if (hizb !== undefined || quarter !== undefined) {
            await prisma.student.update({
                where: { id: studentId },
                data: {
                    currentHizb: hizb ?? student.currentHizb,
                    currentQuarter: quarter ?? student.currentQuarter
                }
            })
        }

        // Recalculate Stats
        await recalculateStudentStats(studentId, new Date(date))

        return NextResponse.json({ success: true, presentation })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Error recording presentation' }, { status: 500 })
    }
}
