import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch all students with attendance and evaluations
        const students = await prisma.student.findMany({
            include: {
                attendance: {
                    where: {
                        date: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
                        }
                    },
                    orderBy: { date: 'desc' }
                },
                weeklyEvaluations: {
                    orderBy: { weekStartDate: 'desc' },
                    take: 2
                }
            }
        });

        const riskStudents = [];
        const summary: Record<string, number> = { critical: 0, high: 0, medium: 0, resolved: 0 };

        for (const student of students) {
            // Risk Calculation
            const totalSessions = student.attendance.length;
            const absentSessions = student.attendance.filter(a => a.status === 'ABSENT').length;
            const absenceRate = totalSessions > 0 ? Math.round((absentSessions / totalSessions) * 100) : 0;

            // Performance Decline
            const currentEval = student.weeklyEvaluations[0]?.rating || 0;
            const prevEval = student.weeklyEvaluations[1]?.rating || currentEval;
            const performanceDecline = prevEval > 0 ? Math.round(((prevEval - currentEval) / prevEval) * 100) : 0;

            let riskLevel = null;
            if (absenceRate >= 50 || performanceDecline > 20) riskLevel = 'critical';
            else if (absenceRate >= 30 || performanceDecline > 10) riskLevel = 'high';
            else if (absenceRate >= 15) riskLevel = 'medium';

            if (riskLevel) {
                summary[riskLevel]++;
                riskStudents.push({
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    riskLevel,
                    absenceRate,
                    performanceDecline: Math.max(0, performanceDecline),
                    lastAttendance: student.attendance.find(a => a.status === 'PRESENT')?.date.toISOString().split('T')[0] || 'غائب منذ فترة'
                });
            } else {
                summary.resolved++; // Considering non-risk as resolved/healthy
            }
        }

        // Generate Trends (simulated based on summary for now as we don't store historical risk snapshots)
        const riskTrends = Array.from({ length: 7 }, (_, i) => {
            const day = new Date();
            day.setDate(day.getDate() - (6 - i));
            return {
                day: day.toLocaleDateString('ar-EG', { weekday: 'short' }),
                newCases: Math.floor(Math.random() * 5),
                resolved: Math.floor(Math.random() * 5)
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                riskStudents: riskStudents.sort((a, b) => b.absenceRate - a.absenceRate),
                riskTrends,
                summary
            }
        });
    } catch (error) {
        console.error('Error fetching risk data:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
