import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePassword, createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

const LoginSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export async function POST(request: Request) {
    try {
        console.log('[Login] Starting login request')

        let body;
        try {
            body = await request.json()
        } catch (e) {
            console.error('[Login] Failed to parse JSON body', e)
            return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
        }

        console.log('[Login] Payload received for:', body.email)
        console.log("Request body:", JSON.stringify({ ...body, password: '***' }));

        const result = LoginSchema.safeParse(body)

        if (!result.success) {
            console.warn('[Login] Validation failed')
            return NextResponse.json({
                error: result.error.issues[0].message
            }, { status: 400 })
        }

        const data = result.data

        console.log('[Login] Searching user in DB...')
        const school = await prisma.school.findUnique({
            where: { email: data.email }
        })

        if (!school) {
            console.warn('[Login] User not found:', data.email)
            return NextResponse.json({
                error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            }, { status: 401 })
        }

        console.log('[Login] Verifying password...')
        const valid = await comparePassword(data.password, school.passwordHash)
        if (!valid) {
            console.warn('[Login] Invalid password for:', data.email)
            return NextResponse.json({
                error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            }, { status: 401 })
        }

        console.log('[Login] Generating Token...')
        const token = createToken({ id: school.id })

        console.log('[Login] Setting Cookie...')
        const cookieStore = await cookies()
        console.log("Cookie value:", cookieStore.get('token')?.value);

        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        })
        console.log('[Login] Cookie set successfully')

        return NextResponse.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: school.id,
                email: school.email,
                name: school.name,
                schoolName: school.schoolName
            }
        }, { status: 200 })

    } catch (error: any) {
        console.error('[Login] CRITICAL ERROR:', error)
        if (error.stack) console.error(error.stack)

        const devMessage = error?.message || String(error)
        const message = process.env.NODE_ENV === 'production'
            ? 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقاً.'
            : `System Error: ${devMessage}`

        return NextResponse.json({ error: message }, { status: 500 })
    }
}
