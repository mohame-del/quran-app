
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

// Arabic Day Names mapping (Sat to Fri)
const ARABIC_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
// Arabic Month Names
const ARABIC_MONTHS = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get("type");
        const studentId = url.searchParams.get("studentId");
        const sectionId = url.searchParams.get("sectionId");
        const schoolId = url.searchParams.get("schoolId");

        if (type) {
            let chartData: { name: string; value: number }[] = [];

            // --- Weekly View: Daily Points (Sat -> Fri) ---
            if (type === 'weekly') {
                // Determine current week range
                const today = new Date();
                const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
                // Adjust to get last Saturday
                // JS Day: 0(Sun), 1(Mon), ..., 5(Fri), 6(Sat)
                // We want week starting Saturday.
                const daysToSubtract = (dayOfWeek + 1) % 7;
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - daysToSubtract);
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);

                // Initialize days map
                const daysMap = new Map<string, { points: number, count: number }>();
                ARABIC_DAYS.forEach(day => daysMap.set(day, { points: 0, count: 0 }));

                // Fetch data
                const whereConfig: any = {
                    date: { gte: startOfWeek, lt: endOfWeek }
                };
                if (studentId) whereConfig.studentId = studentId;
                if (sectionId) whereConfig.student = { sectionId };
                if (schoolId) whereConfig.student = { schoolId };

                // 1. Attendance (Assume 5 points for PRESENT)
                const attendance = await prisma.attendance.findMany({
                    where: { ...whereConfig, status: 'PRESENT' }
                });

                // 2. Presentations (Assume 10 points per presentation)
                const presentations = await prisma.presentation.findMany({
                    where: whereConfig
                });

                // 3. Deductions (Negative points)
                const deductions = await prisma.deduction.findMany({
                    where: whereConfig
                });

                // Helper to map date to Arabic Day
                const getArabicDay = (date: Date) => {
                    const dayIndex = date.getDay(); // 0 Sun, 1 Mon...
                    // ARABIC_DAYS: 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
                    // Map JS (0..6) to Array Index
                    // Sun(0)->1, Mon(1)->2, ..., Fri(5)->6, Sat(6)->0
                    const mapIndex = (dayIndex + 1) % 7;
                    return ARABIC_DAYS[mapIndex];
                };

                // Aggregate Points
                attendance.forEach(a => {
                    const key = getArabicDay(new Date(a.date));
                    if (daysMap.has(key)) {
                        const entry = daysMap.get(key)!;
                        entry.points += 1; // Attendance = 1 point
                        if (studentId) entry.count = 1; else entry.count++;
                    }
                });
                presentations.forEach(p => {
                    const key = getArabicDay(new Date(p.date));
                    if (daysMap.has(key)) {
                        const entry = daysMap.get(key)!;
                        entry.points += 4; // Presentation/Recitation ~= 4 points (to sum to ~5/day => 15/week)
                        // Don't double count 'count' if covered by attendance, but we'll simplified count logic for now
                    }
                });
                deductions.forEach(d => {
                    const key = getArabicDay(new Date(d.date));
                    if (daysMap.has(key)) {
                        const entry = daysMap.get(key)!;
                        entry.points -= d.points;
                    }
                });

                // Normalize for Section/School (Average per student)
                let divisor = 1;
                if (!studentId) {
                    // Estimate student count for normalization
                    const countWhere = sectionId ? { sectionId } : (schoolId ? { schoolId } : {});
                    divisor = await prisma.student.count({ where: countWhere }) || 1;
                }

                chartData = ARABIC_DAYS.map(day => {
                    const d = daysMap.get(day)!;
                    return {
                        name: day,
                        value: divisor > 0 ? Math.round((d.points / divisor) * 10) / 10 : 0
                    };
                });

            }
            // --- Monthly View: Weekly Points (Week 1 -> 4) ---
            else if (type === 'monthly') {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const whereConfig: any = {
                    weekStartDate: { gte: startOfMonth, lte: endOfMonth }
                };
                if (studentId) whereConfig.studentId = studentId;
                if (sectionId) whereConfig.student = { sectionId };
                if (schoolId) whereConfig.student = { schoolId };

                const evals = await prisma.weeklyEvaluation.findMany({
                    where: whereConfig
                });

                // Group by Week Number (relative to month)
                // Simply Map timestamps to Week 1, 2, 3, 4 based on day of month
                const weeksMap = new Map<string, { total: number, count: number }>();
                ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'].forEach(w => weeksMap.set(w, { total: 0, count: 0 }));

                evals.forEach(ev => {
                    const day = new Date(ev.weekStartDate).getDate();
                    let weekLabel = 'الأسبوع 1';
                    if (day > 7) weekLabel = 'الأسبوع 2';
                    if (day > 14) weekLabel = 'الأسبوع 3';
                    if (day > 21) weekLabel = 'الأسبوع 4';

                    if (weeksMap.has(weekLabel)) {
                        const entry = weeksMap.get(weekLabel)!;
                        entry.total += ev.totalPoints; // Use Total Points of the week
                        entry.count++;
                    }
                });

                chartData = Array.from(weeksMap.entries()).map(([name, d]) => ({
                    name,
                    value: d.count > 0 ? Math.round((d.total / d.count) * 10) / 10 : 0
                    // Note: If single student, d.count is 1, so value is totalPoints.
                    // If section, d.count is num students, so value is avg points.
                }));
            }
            // --- Yearly View: Monthly Points (Jan -> Dec) ---
            else if (type === 'yearly') {
                const year = new Date().getFullYear();

                // Try MonthlyEvaluation first (more accurate aggregation)
                const whereConfig: any = { year };
                if (studentId) whereConfig.studentId = studentId;
                if (sectionId) whereConfig.student = { sectionId };
                if (schoolId) whereConfig.student = { schoolId };

                const monthlyEvals = await prisma.monthlyEvaluation.findMany({
                    where: whereConfig
                });

                const monthsMap = new Map<number, { total: number, count: number }>();
                // Initialize 0-11
                for (let i = 0; i < 12; i++) monthsMap.set(i + 1, { total: 0, count: 0 });

                monthlyEvals.forEach(ev => {
                    if (monthsMap.has(ev.month)) {
                        const entry = monthsMap.get(ev.month)!;
                        entry.total += ev.totalPoints;
                        entry.count++;
                    }
                });

                // If no monthly evals found (maybe new system), fall back to aggregating Weekly?
                // For now assuming MonthlyEvaluation is populated or result is 0. 
                // To be robust, let's aggregate Weekly if Monthly is empty?
                // Risk: Double counting if mixing strategies. Stick to Monthly or Weekly-Aggregated.
                // Let's stick to MonthlyEvaluation as it's the standard for "Yearly View".

                chartData = ARABIC_MONTHS.map((monthName, index) => {
                    const d = monthsMap.get(index + 1)!;
                    return {
                        name: monthName,
                        value: d.count > 0 ? Math.round((d.total / d.count) * 10) / 10 : 0
                    };
                });
            }

            return NextResponse.json({ success: true, data: chartData });
        }

        // Default Admin Stats (Overview)
        const totalSchools = await prisma.school.count();
        const totalStudents = await prisma.student.count();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = await prisma.attendance.count({
            where: { date: { gte: today }, status: 'PRESENT' }
        });
        const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0;

        return NextResponse.json({
            success: true,
            data: {
                totalSchools,
                totalStudents,
                attendanceRate,
                studentsAtRisk: 0, // Placeholder
                trends: { students: 0, attendance: 0 }
            }
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch statistics'
        }, { status: 500 });
    }
}
