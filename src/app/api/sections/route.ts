
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma client is exported from here
import { cookies } from "next/headers";
// Note: In a real app we would decode the user from token, 
// for now we will rely on passed schoolId or session simulation if available, 
// but consistent with this project's style likely relying on client sending context or pure valid requests.
// Looking at previous patterns (e.g. students/route.ts), let's check auth or assume admin context.

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

        const sections = await prisma.section.findMany({
            where: { schoolId },
            include: {
                _count: {
                    select: { students: true },
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, sections });
    } catch (error) {
        console.error("Error fetching sections:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, sheikhName, email, schoolId } = body;

        if (!name || !schoolId) {
            return NextResponse.json(
                { success: false, message: "Name and School ID are required" },
                { status: 400 }
            );
        }

        const section = await prisma.section.create({
            data: {
                name,
                sheikhName,
                email,
                schoolId
            },
        });

        return NextResponse.json({ success: true, section });
    } catch (error) {
        console.error("Error creating section:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
