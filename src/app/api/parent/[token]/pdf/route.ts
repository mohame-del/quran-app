import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
        lastAutoTable: { finalY: number }
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    try {

        if (!token) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
        }

        // Find student by parent link token
        const student = await prisma.student.findUnique({
            where: { parentLinkToken: token },
            include: {
                school: {
                    select: {
                        schoolName: true
                    }
                },
                weeklyEvaluations: {
                    orderBy: { weekStartDate: 'desc' },
                    take: 4
                },
                monthlyEvaluations: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                yearlyEvaluations: {
                    orderBy: { year: 'desc' },
                    take: 1
                },
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 7
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // Check time-based rules
        const now = new Date()
        const currentDay = now.getDate()
        const currentMonth = now.getMonth()
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const showMonthly = currentDay === lastDayOfMonth
        const showYearly = currentMonth === 11 && currentDay === 31

        // Create PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        // Set font (Note: Arabic requires special handling, using default for now)
        let yPos = 20

        // Header - School Name
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        const schoolName = student.school.schoolName || 'مدرسة الريّان للقرآن الكريم'
        doc.text(schoolName, 105, yPos, { align: 'center' })
        yPos += 10

        // Student Name
        doc.setFontSize(16)
        const studentName = `${student.firstName} ${student.lastName}`
        doc.text(studentName, 105, yPos, { align: 'center' })
        yPos += 10

        // Report Date
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const reportDate = `Report Date: ${now.toLocaleDateString('ar-EG')}`
        doc.text(reportDate, 105, yPos, { align: 'center' })
        yPos += 15

        // Student Info
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Student Information', 20, yPos)
        yPos += 7
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(`Current Hizb: ${student.currentHizb || 0}`, 20, yPos)
        yPos += 5
        doc.text(`Current Quarter: ${student.currentQuarter || 0}`, 20, yPos)
        yPos += 5
        doc.text(`Stars: ${student.currentStars || 0}`, 20, yPos)
        yPos += 10

        // Attendance - Last 7 Days
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Attendance (Last 7 Days)', 20, yPos)
        yPos += 5

        if (student.attendance && student.attendance.length > 0) {
            const attendanceData = student.attendance.map((a: any) => [
                new Date(a.date).toLocaleDateString('ar-EG'),
                a.period === 'MORNING' ? 'Morning' : 'Evening',
                a.status === 'PRESENT' ? 'Present' : 'Absent'
            ])

            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Period', 'Status']],
                body: attendanceData,
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94] },
                margin: { left: 20, right: 20 }
            })
            yPos = doc.lastAutoTable.finalY + 10
        } else {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text('No attendance records', 20, yPos)
            yPos += 10
        }

        // Weekly Evaluation - Always Show
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Weekly Evaluation', 20, yPos)
        yPos += 5

        if (student.weeklyEvaluations && student.weeklyEvaluations.length > 0) {
            const weeklyData = student.weeklyEvaluations.map((w: any) => [
                new Date(w.weekStartDate).toLocaleDateString('ar-EG'),
                w.totalPoints.toString(),
                w.rating.toFixed(1),
                w.stars.toString()
            ])

            doc.autoTable({
                startY: yPos,
                head: [['Week Start', 'Points', 'Rating', 'Stars']],
                body: weeklyData,
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94] },
                margin: { left: 20, right: 20 }
            })
            yPos = doc.lastAutoTable.finalY + 10
        } else {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text('No weekly evaluation yet', 20, yPos)
            yPos += 10
        }

        // Monthly Evaluation - Only on Last Day of Month
        if (showMonthly && student.monthlyEvaluations && student.monthlyEvaluations.length > 0) {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Monthly Evaluation', 20, yPos)
            yPos += 5

            const monthlyData = student.monthlyEvaluations.map((m: any) => [
                `${m.month}/${m.year}`,
                m.totalPoints.toString(),
                m.rating.toFixed(1),
                m.stars.toString()
            ])

            doc.autoTable({
                startY: yPos,
                head: [['Month/Year', 'Points', 'Rating', 'Stars']],
                body: monthlyData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 20, right: 20 }
            })
            yPos = doc.lastAutoTable.finalY + 10
        }

        // Yearly Evaluation - Only on Last Day of Year
        if (showYearly && student.yearlyEvaluations && student.yearlyEvaluations.length > 0) {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Yearly Evaluation', 20, yPos)
            yPos += 5

            const yearlyData = student.yearlyEvaluations.map((y: any) => [
                y.year.toString(),
                y.totalPoints.toString(),
                y.rating.toFixed(1),
                y.stars.toString()
            ])

            doc.autoTable({
                startY: yPos,
                head: [['Year', 'Points', 'Rating', 'Stars']],
                body: yearlyData,
                theme: 'grid',
                headStyles: { fillColor: [168, 85, 247] },
                margin: { left: 20, right: 20 }
            })
            yPos = doc.lastAutoTable.finalY + 10
        }

        // Teacher Notes
        if (student.notes && student.notes.length > 0) {
            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage()
                yPos = 20
            }

            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Teacher Notes', 20, yPos)
            yPos += 5

            const notesData = student.notes.slice(0, 10).map((note: any) => [
                new Date(note.createdAt).toLocaleDateString('ar-EG'),
                note.content
            ])

            doc.autoTable({
                startY: yPos,
                head: [['Date', 'Note']],
                body: notesData,
                theme: 'grid',
                headStyles: { fillColor: [234, 179, 8] },
                margin: { left: 20, right: 20 },
                columnStyles: {
                    1: { cellWidth: 120 }
                }
            })
        }

        // Generate PDF as buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

        // Return PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="report_${student.firstName}_${student.lastName}.pdf"`
            }
        })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
