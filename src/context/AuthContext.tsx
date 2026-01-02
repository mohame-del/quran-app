'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    email: string
    name?: string
    schoolName: string
    schoolId?: string
}

type Section = {
    id: string
    name: string
    sheikhName?: string
    email?: string
}

type AuthContextType = {
    user: User | null
    loading: boolean
    currentSectionId: string | null
    sections: Section[]
    activeSection: Section | null
    setSection: (id: string | null) => void
    refreshSections: () => Promise<void>
    login: (data: any) => Promise<void>
    register: (data: any) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
    const [sections, setSections] = useState<Section[]>([])
    const [activeSection, setActiveSection] = useState<Section | null>(null)
    const router = useRouter()

    useEffect(() => {
        const savedSid = typeof window !== 'undefined' ? localStorage.getItem('currentSectionId') : null
        setCurrentSectionId(savedSid || 'all')
        checkAuth()
    }, [])

    useEffect(() => {
        if (user) {
            refreshSections()
        }
    }, [user])

    useEffect(() => {
        if (sections.length > 0 && currentSectionId) {
            const active = sections.find(s => s.id === currentSectionId)
            setActiveSection(active || null)
        } else {
            setActiveSection(null)
        }
    }, [sections, currentSectionId])

    async function refreshSections() {
        if (!user) return
        try {
            const sid = user.schoolId || user.id
            const res = await fetch(`/api/sections?schoolId=${sid}`)
            const data = await res.json()
            if (data.success) {
                setSections(data.sections)
            }
        } catch (e) {
            console.error('Failed to fetch sections:', e)
        }
    }

    const setSection = (id: string | null) => {
        const targetId = id || 'all'
        setCurrentSectionId(targetId)
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentSectionId', targetId)
        }
    }

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'same-origin' })

            // If unauthorized, clear user and return early
            if (res.status === 401) {
                setUser(null)
                return
            }

            // Try to parse JSON safely
            let data: any = null
            try {
                data = await res.json()
            } catch (parseErr) {
                console.error('Failed to parse /api/auth/me JSON:', parseErr)
                setUser(null)
                return
            }

            if (res.ok && data?.user) {
                setUser(data.user)
            } else {
                setUser(null)
            }
        } catch (e) {
            console.error('checkAuth network error:', e)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    async function login(credentials: any) {
        try {
            setLoading(true) // Ensure loading state
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                credentials: 'same-origin'
            })

            let data: any = null
            try {
                data = await res.json()
            } catch (err) {
                console.error('Non-JSON login response:', res.status)
                throw new Error('استجابة غير صالحة من الخادم')
            }

            if (!res.ok) {
                const message = data?.error || `فشل تسجيل الدخول (${res.status})`
                console.warn('Login failed:', message)
                throw new Error(message)
            }

            if (!data.user) {
                console.error('Login: Missing user data in response')
                throw new Error('بيانات المستخدم مفقودة')
            }

            console.log('Login success, user:', data.user.email)
            setUser(data.user)

            // Only redirect if successful
            router.replace('/')

        } catch (e: any) {
            console.error('Login error:', e)
            // Rethrow to let the UI show the error
            throw e
        } finally {
            setLoading(false)
        }
    }

    async function register(info: any) {
        try {
            setLoading(true)
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(info),
                credentials: 'same-origin'
            })

            let data: any = null
            try {
                data = await res.json()
            } catch (err) {
                console.error('Non-JSON register response:', res.status)
                throw new Error('استجابة غير صالحة من الخادم')
            }

            if (!res.ok) {
                const message = data?.error || `فشل التسجيل (${res.status})`
                console.warn('Register failed:', message)
                throw new Error(message)
            }

            if (!data.user) {
                console.error('Register: Missing user data in response')
                throw new Error('بيانات المستخدم مفقودة')
            }

            console.log('Register success, user:', data.user.email)
            setUser(data.user)

            // Only redirect if successful
            router.replace('/')

        } catch (e: any) {
            console.error('Registration error:', e)
            throw e
        } finally {
            setLoading(false)
        }
    }

    async function logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            setUser(null)
            router.push('/login')
        } catch (e) {
            console.error('Logout error:', e)
            setUser(null)
            router.push('/login')
        }
    }

    return (
        <AuthContext.Provider value={{
            user, loading, currentSectionId, sections, activeSection,
            setSection, refreshSections, login, register, logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
