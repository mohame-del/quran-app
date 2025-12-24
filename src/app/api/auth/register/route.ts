import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

const RegisterSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    name: z.string().min(2, 'الاسم مطلوب'),
    schoolName: z.string().min(3, 'اسم المدرسة يجب أن يكون 3 أحرف على الأقل'),
    phone: z.string().optional(),
})

export async function POST(request: Request) {
    try {
        console.log('[Register] Starting registration request')

        let body;
        try {
            body = await request.json()
        } catch (e) {
            console.error('[Register] Failed to parse JSON body', e)
            return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
        }

        console.log('[Register] Payload validated:', JSON.stringify({ ...body, password: '***' }))
        console.log("Request body:", JSON.stringify({ ...body, password: '***' }));

        const result = RegisterSchema.safeParse(body)

        if (!result.success) {
            console.warn('[Register] Validation failed:', result.error.issues[0].message)
            return NextResponse.json({
                error: result.error.issues[0].message
            }, { status: 400 })
        }

        const data = result.data

        // Check if school already exists by email
        console.log('[Register] Checking for existing user:', data.email)
        const existingSchool = await prisma.school.findUnique({
            where: { email: data.email }
        })

        if (existingSchool) {
            console.warn('[Register] Email already exists:', data.email)
            return NextResponse.json({
                error: 'هذا البريد الإلكتروني مسجل بالفعل لمدرسة أخرى'
            }, { status: 400 })
        }

        console.log('[Register] Hashing password...')
        const passwordHash = await hashPassword(data.password)

        console.log('[Register] Creating user in DB/Prisma...')
        const school = await prisma.school.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                schoolName: data.schoolName,
                phone: data.phone,
            }
        })
        console.log('[Register] User created successfully:', school.id)

        console.log('[Register] Generating JWT...')
        const token = createToken({ id: school.id })

        console.log('[Register] Setting Cookie...')
        const cookieStore = await cookies()
        console.log("Cookie value:", cookieStore.get('token')?.value);

        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })
        console.log('[Register] Cookie set successfully')

        return NextResponse.json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            user: {
                id: school.id,
                email: school.email,
                name: school.name,
                schoolName: school.schoolName
            }
        }, { status: 200 })

    } catch (error: any) {
        console.error('[Register] CRITICAL ERROR:', error)

        // Log stack trace if available
        if (error.stack) console.error(error.stack)

        const message = process.env.NODE_ENV === 'production'
            ? 'حدث خطأ غير متوقع أثناء عملية التسجيل. يرجى المحاولة لاحقاً.'
            : `System Error: ${error?.message || String(error)}`

        return NextResponse.json({ error: message }, { status: 500 })
    }
}
