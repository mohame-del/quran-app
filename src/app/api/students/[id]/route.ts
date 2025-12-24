import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const UpdateStudentSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    currentHizb: z.number().optional(),
    currentQuarter: z.number().optional(),
    isFrozen: z.boolean().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            weeklyEvaluations: {
                orderBy: { weekStartDate: 'asc' },
                take: 52 // Last year
            },
            attendance: {
                where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }, // Last 30 days
                orderBy: { date: 'desc' }
            },
            presentations: {
                orderBy: { date: 'desc' },
                take: 20
            },
            deductions: {
                orderBy: { date: 'desc' },
                take: 10
            },
            notes: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!student || student.schoolId !== user.id) {
        return NextResponse.json({ error: 'Student not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, student })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const data = UpdateStudentSchema.parse(body)

        const student = await prisma.student.findUnique({ where: { id } })
        if (!student || student.schoolId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const updated = await prisma.student.update({
            where: { id },
            data
        })

        return NextResponse.json({ success: true, student: updated })

    } catch (e) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student || student.schoolId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.student.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
