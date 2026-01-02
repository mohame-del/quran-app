import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWeekStart } from '@/lib/logic';

export async function GET() {
    try {
        const currentWeekStart = getWeekStart(new Date());

        const students = await prisma.student.findMany({
            include: {
                school: {
                    select: { schoolName: true }
                },
                weeklyEvaluations: {
                    where: { weekStartDate: currentWeekStart },
                    take: 1
                },
                attendance: {
                    where: {
                        date: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 30))
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = students.map(s => {
            const currentEval = s.weeklyEvaluations[0];

            const totalAttendance = s.attendance.length;
            const presentCount = s.attendance.filter(a => a.status === 'PRESENT').length;
            const attendanceRate = totalAttendance > 0
                ? Math.round((presentCount / totalAttendance) * 100)
                : 0;

            return {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                schoolName: s.school.schoolName,
                currentHizb: s.currentHizb,
                currentQuarter: s.currentQuarter,
                parentPhone: s.parentPhone,
                weeklyPoints: currentEval?.totalPoints || 0,
                rating: currentEval?.rating || 0,
                attendanceRate,
                isFrozen: s.isFrozen
            };
        });

        return NextResponse.json({ success: true, students: formatted });
    } catch (error) {
        console.error('Error fetching admin students:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

