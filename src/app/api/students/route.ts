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
    birthDate: z.string().optional().transform(str => str ? new Date(str) : null), // Receive as string YYYY-MM-DD
    currentHizb: z.number().min(0).max(60).default(0),
    currentQuarter: z.number().min(0).max(8).default(0),
})

export async function GET() {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentWeekStart = getWeekStart(new Date())

    // Fetch students with their evaluation for THIS week specifically
    // relying on the relation we added. 
    // We want to sort by:
    // 1. Current Week Points (Realtime)
    // 2. Stars (Cumulative? Or Weekly? User said "Current Stars" in model is cached. Let's use cached stars or weekly stars.)
    // Let's use Weekly Stats for the leaderboard to be "Weekly Leaderboard" as implied by "Weekly Evaluation".

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const students = await prisma.student.findMany({
        where: { schoolId: user.id },
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
            // Priority: Realtime Evaluation > 0
            weeklyPoints: currentEval?.totalPoints || 0,
            weeklyRating: currentEval?.rating || 0,
            stars: currentEval?.stars || 0
            // We overwrite the 'currentStars' from the student model with the weekly stars for the leaderboard context
            // OR we can keep cumulative stars from student model if that's what 'currentStars' means.
            // Given the logic in attendance.ts: 'currentStars: stars', it updates with WEEKLY stars. 
            // So 'currentStars' IS Weekly Stars. 
            // But using the relation is safer for "New Week Reset".
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
