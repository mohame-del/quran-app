import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { studentId, content } = body

        if (!studentId || !content) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const note = await prisma.note.create({
            data: {
                studentId,
                content,
                createdAt: new Date()
            }
        })

        return NextResponse.json({ success: true, note }, { status: 201 })
    } catch (error) {
        console.error('Error creating note:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create note' },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const studentId = searchParams.get('studentId')

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: 'Student ID required' },
                { status: 400 }
            )
        }

        const notes = await prisma.note.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, notes })
    } catch (error) {
        console.error('Error fetching notes:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch notes' },
            { status: 500 }
        )
    }
}
