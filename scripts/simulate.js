// scripts/simulate.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day + 1) % 7
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function calculateWeeklyRating(totalPoints) {
    let rating = (totalPoints / 15) * 10
    rating = Math.min(10, Math.max(0, rating))
    let stars = 0
    if (rating >= 9.5) stars = 5
    else if (rating >= 8) stars = 4
    else if (rating >= 6) stars = 3
    else if (rating >= 4) stars = 2
    else stars = 1
    return { rating: Number(rating.toFixed(1)), stars }
}

async function main() {
    console.log('--- STARTING SCHOOL SIMULATION ---')

    const school = await prisma.school.findFirst()
    if (!school) {
        console.error('Run seed.js first!')
        return
    }

    const students = await prisma.student.findMany({ where: { schoolId: school.id } })
    console.log(`Found ${students.length} students.`)

    // Simulate 6 Days
    const today = new Date()

    // We will simulate the "Current Week" so it shows up in dashboard immediately
    // Find generic start of this week
    const weekStart = getWeekStart(today)

    // We simulate days from WeekStart to Today (max 6)

    for (let i = 0; i < 6; i++) {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + i)
        if (date > today) break // Don't go to future

        const dateStr = date.toISOString().split('T')[0]
        console.log(`\nSimulating Day: ${dateStr}`)

        // 1. Attendance
        const absentee = students[i % students.length]
        const presentIds = students.filter(s => s.id !== absentee.id).map(s => s.id)

        for (const s of students) {
            const status = presentIds.includes(s.id) ? 'PRESENT' : 'ABSENT'
            await prisma.attendance.upsert({
                where: { studentId_date_period: { studentId: s.id, date: date, period: 'EVENING' } },
                create: { studentId: s.id, date: date, period: 'EVENING', status },
                update: { status }
            })
        }

        // 2. Presentations
        const presenter = students[(i + 1) % students.length]
        await prisma.presentation.create({
            data: {
                studentId: presenter.id,
                date: date,
                hizb: presenter.currentHizb,
                quarter: presenter.currentQuarter,
                grade: '10'
            }
        })

        // 3. Deduction
        if (i === 2) {
            const naughty = students[0]
            await prisma.deduction.create({
                data: {
                    studentId: naughty.id,
                    date: date,
                    points: -5,
                    reason: 'Simulation Penalty'
                }
            })
        }
    }

    console.log('\n--- CALCULATING STATS ---')
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    for (const student of students) {
        const attendances = await prisma.attendance.findMany({
            where: { studentId: student.id, date: { gte: weekStart, lt: weekEnd }, status: 'PRESENT' }
        })
        const presentations = await prisma.presentation.findMany({
            where: { studentId: student.id, date: { gte: weekStart, lt: weekEnd } }
        })
        const deductions = await prisma.deduction.findMany({
            where: { studentId: student.id, date: { gte: weekStart, lt: weekEnd } }
        })

        const attPoints = attendances.length * 2
        const presPoints = Math.min(3, presentations.length * 1)
        const dedPoints = deductions.reduce((acc, curr) => acc + curr.points, 0)

        const rawTotal = attPoints + presPoints + dedPoints
        const totalPoints = Math.max(0, rawTotal)
        const { rating, stars } = calculateWeeklyRating(totalPoints)

        await prisma.weeklyEvaluation.upsert({
            where: {
                studentId_weekStartDate: {
                    studentId: student.id,
                    weekStartDate: weekStart
                }
            },
            create: {
                studentId: student.id,
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

        // Update Cached Student Stats
        await prisma.student.update({
            where: { id: student.id },
            data: {
                currentWeeklyPoints: totalPoints,
                currentWeeklyRating: rating,
                currentStars: stars
            }
        })

        console.log(`Updated ${student.firstName}: ${totalPoints} pts`)
    }

    console.log('Done.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
