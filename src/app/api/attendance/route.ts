import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { recalculateStudentStats } from '@/lib/logic'

const AttendanceSchema = z.object({
    studentIds: z.array(z.string()),
    date: z.string(), // YYYY-MM-DD
    period: z.enum(['MORNING', 'EVENING']),
})

export async function POST(request: Request) {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const { studentIds, date, period } = AttendanceSchema.parse(body)

        // 1. Get all active students for this school
        const allStudents = await prisma.student.findMany({
            where: {
                schoolId: user.id,
                isFrozen: false
            },
            select: { id: true }
        })

        const attendanceDate = new Date(date)

        // 2. Prepare and execute upserts
        const updates = allStudents.map((student: { id: string }) => {
            const isPresent = studentIds.includes(student.id)
            const status = isPresent ? 'PRESENT' : 'ABSENT'

            return prisma.attendance.upsert({
                where: {
                    studentId_date_period: {
                        studentId: student.id,
                        date: attendanceDate,
                        period: period
                    }
                },
                create: {
                    studentId: student.id,
                    date: attendanceDate,
                    period: period,
                    status: status
                },
                update: {
                    status: status
                }
            })
        })

        await prisma.$transaction(updates)

        // 3. Recalculate Stats for ALL affected students
        for (const student of allStudents) {
            await recalculateStudentStats(student.id, attendanceDate)
        }

        return NextResponse.json({ success: true, count: studentIds.length })

    } catch (error: any) {
        console.error('Attendance error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
