
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const schoolId = url.searchParams.get("schoolId");

        if (!schoolId) {
            return NextResponse.json(
                { success: false, message: "School ID is required" },
                { status: 400 }
            );
        }

        const sectionId = url.searchParams.get("sectionId");
        const isGlobal = !sectionId || sectionId === 'all';

        // 1. Overview Stats
        const whereStudent = isGlobal ? { schoolId } : { sectionId, schoolId };
        const whereSection = isGlobal ? { schoolId } : { id: sectionId, schoolId };

        const totalStudents = await (prisma.student as any).count({ where: whereStudent });
        const totalSections = isGlobal ? await (prisma as any).section.count({ where: { schoolId } }) : 1;

        // Count unique sheikhs as teachers
        const distinctSheikhs = await (prisma as any).section.findMany({
            where: whereSection,
            select: { sheikhName: true },
            distinct: ['sheikhName']
        });
        const totalTeachers = (distinctSheikhs as any[]).filter((s: any) => s.sheikhName).length;

        // Avg Rating
        const avgRatingAgg = await prisma.weeklyEvaluation.aggregate({
            _avg: { rating: true },
            where: { student: whereStudent as any }
        });
        const averageRating = avgRatingAgg._avg.rating || 0;

        // 2. Sections Detailed Stats
        // Fetch sections with their students and evaluations
        const sectionsData = await (prisma as any).section.findMany({
            where: { schoolId },
            include: {
                students: {
                    select: {
                        id: true,
                        weeklyEvaluations: {
                            take: 4, // Last 4 weeks for recent performance
                            orderBy: { weekStartDate: 'desc' },
                            select: { rating: true, totalPoints: true }
                        },
                        attendance: {
                            take: 30, // Last 30 days
                            select: { status: true }
                        },
                        presentations: {
                            take: 1
                        }
                    }
                }
            }
        });

        // Process sections stats in JS
        const sections = (sectionsData as any[]).map((section: any) => {
            const studentCount = section.students.length;

            // Calc avg rating for section (based on recent student evals)
            let totalRating = 0;
            let ratingCount = 0;
            let totalAttendance = 0;
            let attendanceCount = 0;

            section.students.forEach((student: any) => {
                // Rating
                if (student.weeklyEvaluations.length > 0) {
                    const studentAvg = student.weeklyEvaluations.reduce((acc: number, curr: any) => acc + curr.rating, 0) / student.weeklyEvaluations.length;
                    totalRating += studentAvg;
                    ratingCount++;
                }

                // Attendance
                if (student.attendance.length > 0) {
                    const present = student.attendance.filter((a: any) => a.status === 'PRESENT').length;
                    totalAttendance += (present / student.attendance.length) * 100;
                    attendanceCount++;
                }
            });

            const finalRating = ratingCount > 0 ? (totalRating / ratingCount) : 0;
            const finalAttendance = attendanceCount > 0 ? (totalAttendance / attendanceCount) : 0;

            // Determine status
            let status = 'needs_attention';
            if (finalRating >= 4.5) status = 'excellent';
            else if (finalRating >= 4.0) status = 'good';

            return {
                id: section.id,
                name: section.name,
                students: studentCount,
                rating: Number(finalRating.toFixed(1)),
                attendance: Math.round(finalAttendance),
                presentations: 0, // Will populate below
                status
            };
        });

        // Populate presentations counts (parallel)
        await Promise.all(sections.map(async (s: any) => {
            const count = await prisma.presentation.count({ where: { student: { sectionId: s.id } as any } });
            s.presentations = count;
        }));

        // 3. Monthly Progress
        // Fetch evaluations based on filter
        const allEvals = await prisma.weeklyEvaluation.findMany({
            where: { student: whereStudent },
            select: { weekStartDate: true, rating: true },
            orderBy: { weekStartDate: 'asc' }
        });

        // Group by month
        const monthlyStats = new Map(); // "Month Year" -> { totalRating, count, ... }

        allEvals.forEach((ev: any) => {
            const date = new Date(ev.weekStartDate);
            // Arabic month names for consistency with frontend
            const monthName = date.toLocaleDateString('ar-EG', { month: 'long' });
            const key = monthName;

            if (!monthlyStats.has(key)) {
                monthlyStats.set(key, { totalRating: 0, count: 0 });
            }
            const stat: any = monthlyStats.get(key);
            stat.totalRating += ev.rating;
            stat.count++;
        });

        const monthlyProgress = Array.from(monthlyStats.entries()).map(([month, data]) => ({
            month,
            rating: Number((data.totalRating / data.count).toFixed(1)),
            attendance: 90, // Placeholder or calculate similarly if needed
            students: totalStudents // Approx
        }));
        // If empty, provide some defaults or empty array
        if (monthlyProgress.length === 0) {
            // Optional: Return current month with 0
        }

        // Mock trends for now (hard to calc without history table)
        let sectionName = null;
        if (!isGlobal) {
            const section = await (prisma as any).section.findUnique({ where: { id: sectionId } });
            sectionName = section?.name;
        }

        const overview = {
            totalStudents,
            studentsTrend: 5,
            totalTeachers,
            teachersTrend: 0,
            totalSections,
            sectionsTrend: 0,
            averageRating: Number(averageRating.toFixed(1)),
            ratingTrend: 0,
            sectionName
        };

        return NextResponse.json({
            success: true,
            data: {
                overview,
                sections,
                monthlyProgress
            }
        });

    } catch (error) {
        console.error("Error getting school stats:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
