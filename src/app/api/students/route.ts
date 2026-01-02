import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getWeekStart } from '@/lib/logic'

const CreateStudentSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    phone: z.string().optional(),
    fatherPhone: z.string().optional(),
    parentEmail: z.string().email('بريد إلكتروني غير صالح'),
    parentPhone: z.string().min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل'),
    birthDate: z.string().optional().transform(str => str ? new Date(str) : null), // Receive as string YYYY-MM-DD
    currentHizb: z.number().min(0).max(60).default(0),
    currentQuarter: z.number().min(0).max(8).default(0),
    sectionId: z.string().optional().nullable(),
})

export async function GET(req: any) {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId')

    const currentWeekStart = getWeekStart(new Date())
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build filter
    const where: any = { schoolId: user.id }
    if (sectionId && sectionId !== 'all') {
        where.sectionId = sectionId
    }

    const students = await prisma.student.findMany({
        where,
        include: {
            weeklyEvaluations: {
                where: { weekStartDate: currentWeekStart },
                select: {
                    totalPoints: true,
                    rating: true,
                    stars: true
                }
            },
            attendance: {
                where: {
                    date: {
                        gte: today
                    }
                },
                select: {
                    period: true,
                    status: true,
                    date: true
                }
            }
        }
    })

    // Format and Sort
    const formatted = students.map((s: any) => {
        const currentEval = s.weeklyEvaluations[0]
        return {
            ...s,
            weeklyPoints: currentEval?.totalPoints || 0,
            weeklyRating: currentEval?.rating || 0,
            stars: currentEval?.stars || 0
        }
    })

    // Sort by Points (Desc), then Stars, then Name
    formatted.sort((a: any, b: any) => {
        if (b.weeklyPoints !== a.weeklyPoints) return b.weeklyPoints - a.weeklyPoints
        if (b.stars !== a.stars) return b.stars - a.stars
        return a.firstName.localeCompare(b.firstName)
    })

    return NextResponse.json({ success: true, students: formatted })
}

export async function POST(request: Request) {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const body = await request.json()
        const data = CreateStudentSchema.parse(body)

        const student = await prisma.student.create({
            data: {
                ...data,
                schoolId: user.id
            }
        })

        return NextResponse.json({ success: true, student })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Error creating student' }, { status: 500 })
    }
}
