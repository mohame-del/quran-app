import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET is missing in environment variables')
        }
        console.warn('WARNING: Using fallback JWT secret. Do not use this in production!')
        return 'fallback-secret'
    }
    return secret
}

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
}

export function createToken(payload: any) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, getJwtSecret())
    } catch (e) {
        return null
    }
}

export async function getSession() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) return null

    const decoded = verifyToken(token) as any
    if (!decoded || !decoded.id) return null

    try {
        const user = await prisma.school.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                schoolName: true,
                createdAt: true
            }
        })
        return user
    } catch (e) {
        return null
    }
}
