import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWeekStart } from '@/lib/logic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const school = await prisma.school.findUnique({
            where: { id },
            include: {
                students: {
                    include: {
                        weeklyEvaluations: {
                            orderBy: { weekStartDate: 'asc' } // For trend
                        },
                        attendance: {
                            where: {
                                date: {
                                    gte: new Date(new Date().setDate(new Date().getDate() - 30))
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!school) {
            return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
        }

        const totalStudents = school.students.length;

        // Avg Rating
        const totalRating = school.students.reduce((acc, s) => {
            const lastEval = s.weeklyEvaluations[s.weeklyEvaluations.length - 1];
            return acc + (lastEval?.rating || 0);
        }, 0);
        const rating = totalStudents > 0 ? (totalRating / totalStudents).toFixed(1) : '0.0';

        // Attendance Rate
        const totalAttendance = school.students.reduce((acc, s) => acc + s.attendance.length, 0);
        const presentCount = school.students.reduce((acc, s) => acc + s.attendance.filter(a => a.status === 'PRESENT').length, 0);
        const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

        // Performance Trend (Average rating per week for all students)
        // We'll aggregate by week
        const weekMap = new Map<string, { total: number; count: number }>();

        school.students.forEach(s => {
            s.weeklyEvaluations.forEach(we => {
                const dateKey = new Date(we.weekStartDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                const current = weekMap.get(dateKey) || { total: 0, count: 0 };
                weekMap.set(dateKey, { total: current.total + we.totalPoints, count: current.count + 1 });
            });
        });

        const performanceData = Array.from(weekMap.entries()).map(([name, val]) => ({
            name,
            value: Math.round(val.total / val.count)
        }));

        // Grade Distribution (by Hizb)
        // Group: Level 1 (0-15), Level 2 (16-30), Level 3 (31-45), Level 4 (46-60)
        const levels = { 'المستوى 1': 0, 'المستوى 2': 0, 'المستوى 3': 0, 'المستوى 4': 0 };
        school.students.forEach(s => {
            if (s.currentHizb <= 15) levels['المستوى 1']++;
            else if (s.currentHizb <= 30) levels['المستوى 2']++;
            else if (s.currentHizb <= 45) levels['المستوى 3']++;
            else levels['المستوى 4']++;
        });

        const gradeData = Object.entries(levels).map(([name, value], i) => ({
            name,
            value,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][i]
        }));


        const data = {
            id: school.id,
            name: school.schoolName,
            manager: school.name || 'غير محدد',
            address: school.address || 'غير محدد',
            stats: {
                students: totalStudents,
                teachers: 1, // Defaulting as schema allows 1 teacher per school account roughly
                rating: rating,
                attendance: attendanceRate
            },
            performanceData,
            gradeData
        };

        return NextResponse.json({ success: true, school: data });

    } catch (error) {
        console.error('Error fetching school details:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Cascade delete EVERYTHING related to the school
        await prisma.$transaction([
            // 1. Delete all related data for students of this school
            prisma.attendance.deleteMany({ where: { student: { schoolId: id } } }),
            prisma.weeklyEvaluation.deleteMany({ where: { student: { schoolId: id } } }),
            prisma.monthlyEvaluation.deleteMany({ where: { student: { schoolId: id } } }),
            prisma.yearlyEvaluation.deleteMany({ where: { student: { schoolId: id } } }),
            prisma.note.deleteMany({ where: { student: { schoolId: id } } }),
            prisma.deduction.deleteMany({ where: { student: { schoolId: id } } }),
            prisma.presentation.deleteMany({ where: { student: { schoolId: id } } }),

            // 2. Delete Students
            prisma.student.deleteMany({ where: { schoolId: id } }),

            // 3. Delete School
            prisma.school.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting school:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
