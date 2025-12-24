import { prisma } from './prisma'

/**
 * Get the start of the week (Saturday) for a given date.
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay() // 0=Sun, 1=Mon... 6=Sat
    // Map: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6 relative to Sat.
    const diff = (day + 1) % 7
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
}

/**
 * Calculate weekly rating (0-10) and stars (1-5) based on points.
 * Max points = 15 (12 attendance + 3 presentation).
 */
export function calculateWeeklyRating(totalPoints: number) {
    // Max possible is 15.
    let rating = (totalPoints / 15) * 10
    rating = Math.min(10, Math.max(0, rating))

    let stars = 0
    if (rating >= 9.5) stars = 5
    else if (rating >= 8) stars = 4
    else if (rating >= 6) stars = 3
    else if (rating >= 4) stars = 2
    else stars = 1

    return {
        rating: Number(rating.toFixed(1)) || 0,
        stars: stars || 1
    }
}

/**
 * Aggregates ratings for monthly/yearly views.
 */
export function calculateAggregatedRating(ratings: number[]) {
    if (!ratings || ratings.length === 0) return { rating: 0, stars: 0 }
    const sum = ratings.reduce((a: number, b: number) => a + b, 0)
    const avg = sum / ratings.length

    let stars = 0
    if (avg >= 9.5) stars = 5
    else if (avg >= 8) stars = 4
    else if (avg >= 6) stars = 3
    else if (avg >= 4) stars = 2
    else stars = 1

    return {
        rating: Number(avg.toFixed(1)) || 0,
        stars: stars || 1
    }
}

/**
 * Recalculate a student's stats for a specific date (and its week).
 * This centralizes logic for Attendance, Presentation, and Deduction.
 */
export async function recalculateStudentStats(studentId: string, date: Date) {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // 1. Fetch raw data for the week
    const [attendances, presentations, deductions] = await Promise.all([
        prisma.attendance.findMany({
            where: {
                studentId,
                date: { gte: weekStart, lt: weekEnd },
                status: 'PRESENT'
            }
        }),
        prisma.presentation.findMany({
            where: {
                studentId,
                date: { gte: weekStart, lt: weekEnd }
            }
        }),
        prisma.deduction.findMany({
            where: {
                studentId,
                date: { gte: weekStart, lt: weekEnd }
            }
        })
    ])

    // 2. Points Logic:
    // Attendance: 2 points per day (usually 6 days)
    // Presentation: 1 point each (Max 3 points/week)
    // Deduction: points stored as negative in DB typically
    const attPoints = attendances.length * 2
    const presPoints = Math.min(3, presentations.length)
    const dedPoints = deductions.reduce((sum: number, d: any) => sum + (d.points || 0), 0)

    const totalPoints = Math.max(0, attPoints + presPoints + dedPoints)
    const { rating, stars } = calculateWeeklyRating(totalPoints)

    // 3. Update WeeklyEvaluation
    await prisma.weeklyEvaluation.upsert({
        where: {
            studentId_weekStartDate: { studentId, weekStartDate: weekStart }
        },
        create: {
            studentId,
            weekStartDate: weekStart,
            attendancePoints: attPoints,
            presentationPoints: presPoints,
            deductionPoints: dedPoints,
            totalPoints,
            rating,
            stars
        },
        update: {
            attendancePoints: attPoints,
            presentationPoints: presPoints,
            deductionPoints: dedPoints,
            totalPoints,
            rating,
            stars
        }
    })

    // 4. Update Student cached stats (if this is for the current week)
    const currentWeekStart = getWeekStart(new Date())
    if (weekStart.getTime() === currentWeekStart.getTime()) {
        await prisma.student.update({
            where: { id: studentId },
            data: {
                currentWeeklyPoints: totalPoints,
                currentWeeklyRating: rating,
                currentStars: stars
            }
        })
    }

    // 5. Update Monthly/Yearly aggregations
    await updateMonthlyEvaluation(studentId, date)
    await updateYearlyEvaluation(studentId, date)
}

export async function updateMonthlyEvaluation(studentId: string, date: Date) {
    const month = date.getMonth() + 1 // 1-12
    const year = date.getFullYear()

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 1)

    const weeklyEvals = await prisma.weeklyEvaluation.findMany({
        where: {
            studentId,
            weekStartDate: { gte: startOfMonth, lt: endOfMonth }
        }
    })

    if (weeklyEvals.length === 0) return

    const ratings = weeklyEvals.map((w: any) => w.rating || 0)
    const totalPoints = weeklyEvals.reduce((sum: number, w: any) => sum + (w.totalPoints || 0), 0)
    const { rating, stars } = calculateAggregatedRating(ratings)

    await prisma.monthlyEvaluation.upsert({
        where: {
            studentId_month_year: { studentId, month, year }
        },
        create: { studentId, month, year, totalPoints, rating, stars },
        update: { totalPoints, rating, stars }
    })
}

export async function updateYearlyEvaluation(studentId: string, date: Date) {
    const year = date.getFullYear()

    const weeklyEvals = await prisma.weeklyEvaluation.findMany({
        where: {
            studentId,
            weekStartDate: {
                gte: new Date(year, 0, 1),
                lt: new Date(year + 1, 0, 1)
            }
        }
    })

    if (weeklyEvals.length === 0) return

    const ratings = weeklyEvals.map((w: any) => w.rating || 0)
    const totalPoints = weeklyEvals.reduce((sum: number, w: any) => sum + (w.totalPoints || 0), 0)
    const { rating, stars } = calculateAggregatedRating(ratings)

    await prisma.yearlyEvaluation.upsert({
        where: {
            studentId_year: { studentId, year }
        },
        create: { studentId, year, totalPoints, rating, stars },
        update: { totalPoints, rating, stars }
    })
}
