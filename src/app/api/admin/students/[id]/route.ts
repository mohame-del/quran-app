import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                school: {
                    select: { schoolName: true, name: true }
                },
                weeklyEvaluations: {
                    orderBy: { weekStartDate: 'asc' }, // For chart
                    take: 20
                },
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 30
                },
                deductions: {
                    orderBy: { date: 'desc' },
                    take: 10
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!student) {
            return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, student });

    } catch (error) {
        console.error('Error fetching student details:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { isFrozen } = body;

        const student = await prisma.student.update({
            where: { id },
            data: { isFrozen }
        });

        return NextResponse.json({ success: true, student });
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Cascade delete manually just in case schema doesn't have it
        await prisma.$transaction([
            prisma.attendance.deleteMany({ where: { studentId: id } }),
            prisma.weeklyEvaluation.deleteMany({ where: { studentId: id } }),
            prisma.monthlyEvaluation.deleteMany({ where: { studentId: id } }),
            prisma.yearlyEvaluation.deleteMany({ where: { studentId: id } }),
            prisma.note.deleteMany({ where: { studentId: id } }),
            prisma.deduction.deleteMany({ where: { studentId: id } }),
            prisma.presentation.deleteMany({ where: { studentId: id } }),
            prisma.student.delete({ where: { id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting student:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
