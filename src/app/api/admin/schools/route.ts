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
                                    gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
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

        const schoolsData = schools.map(school => {
            const totalStudents = school.students.length;

            // Calculate Attendance Rate (Last 7 Days)
            let totalPresent = 0;
            let totalSlots = totalStudents * 14; // 7 days * 2 sessions (rough estimate for capacity)
            // Or better:
            const totalAttendanceRecords = school.students.reduce((acc, s) => acc + s.attendance.length, 0);
            const presentRecords = school.students.reduce((acc, s) => acc + s.attendance.filter(a => a.status === 'PRESENT').length, 0);

            const attendanceRate = totalAttendanceRecords > 0
                ? Math.round((presentRecords / totalAttendanceRecords) * 100)
                : 0;

            // Calculate Rating
            const totalRating = school.students.reduce((acc, s) => acc + (s.weeklyEvaluations[0]?.rating || 0), 0);
            const avgRating = totalStudents > 0
                ? (totalRating / totalStudents).toFixed(1)
                : '0.0';

            // Calculate Risk Count (Attendance < 50%)
            const riskCount = school.students.filter(s => {
                const sPresent = s.attendance.filter(a => a.status === 'PRESENT').length;
                const sTotal = s.attendance.length; // Or fixed window
                return sTotal > 0 && (sPresent / sTotal) < 0.5;
            }).length;

            return {
                id: school.id,
                name: school.schoolName,
                teacherName: school.name || 'غير محدد',
                studentsCount: totalStudents,
                rating: avgRating,
                attendanceRate: attendanceRate,
                riskCount: riskCount
            };
        });

        return NextResponse.json({
            success: true,
            schools: schoolsData
        });
    } catch (error) {
        console.error('Error fetching schools:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
