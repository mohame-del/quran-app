import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const schools = await prisma.school.findMany({
            include: {
                students: {
                    include: {
                        attendance: {
                            where: {
                                date: {
                                    gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
                                }
                            }
                        },
                        weeklyEvaluations: {
                            orderBy: { weekStartDate: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        const teachersData = schools.map(school => {
            const totalStudents = school.students.length;

            // Calculate Performance (based on student ratings)
            const totalRating = school.students.reduce((acc, s) => acc + (s.weeklyEvaluations[0]?.rating || 0), 0);
            const avgRatingVal = totalStudents > 0 ? (totalRating / totalStudents) : 0;
            const performance = Math.min(100, Math.round(avgRatingVal * 10)); // Scale 0-10 to 0-100%

            // Calculate Commitment (Attendance Rate)
            const totalAttendanceRecords = school.students.reduce((acc, s) => acc + s.attendance.length, 0);
            const presentRecords = school.students.reduce((acc, s) => acc + s.attendance.filter(a => a.status === 'PRESENT').length, 0);
            const commitment = totalAttendanceRecords > 0
                ? Math.round((presentRecords / totalAttendanceRecords) * 100)
                : 0;

            return {
                id: school.id,
                name: school.name || 'معلم غير محدد',
                schoolName: school.schoolName,
                students: totalStudents,
                rating: avgRatingVal.toFixed(1),
                performance: performance,
                commitment: commitment
            };
        });

        return NextResponse.json({
            success: true,
            teachers: teachersData
        });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
