'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { DashboardCharts } from '@/components/DashboardCharts'
import { Users, School, Sun, Moon, Search, Check, X, Star } from 'lucide-react'
import Image from 'next/image'

export default function Dashboard() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Attendance State (Local for Quick Actions)
    const [attendanceChanges, setAttendanceChanges] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                fetchStudents()
            } else {
                setLoading(false)
            }
        }
    }, [user, authLoading])

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students')
            const data = await res.json()
            if (data.success) setStudents(data.students)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // --- Stats Calculation ---
    const totalStudents = students.length
    const morningPresence = students.filter(s => s.attendance?.some((a: any) =>
        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'MORNING'
    )).length
    const eveningPresence = students.filter(s => s.attendance?.some((a: any) =>
        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'EVENING'
    )).length
    const avgRating = students.length > 0
        ? (students.reduce((acc, s) => acc + (s.weeklyRating || 0), 0) / students.length).toFixed(1)
        : '0.0'

    // --- Actions ---
    const handleQuickAttendance = async (studentId: string, period: 'MORNING' | 'EVENING') => {
        try {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: [studentId],
                    date: new Date().toISOString().split('T')[0],
                    period
                })
            })
            // Refetch to update UI
            fetchStudents()
        } catch (e) {
            alert('Error updating attendance')
        }
    }

    // Filter for Table
    const filteredStudents = students.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    /* Landing for unauth handled in useEffect redirect, but just in case */
    if (!user) {
        // Landing / Splash page for unauthenticated visitors
        return (
            <>
                <style jsx global>{`
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.8s ease-out forwards;
                        opacity: 0;
                    }
                    .animate-fade-in-up {
                        animation: fade-in-up 0.8s ease-out forwards;
                        opacity: 0;
                    }
                    .delay-100 { animation-delay: 0.1s; }
                    .delay-200 { animation-delay: 0.2s; }
                    .delay-300 { animation-delay: 0.3s; }
                    .delay-400 { animation-delay: 0.4s; }
                    .delay-500 { animation-delay: 0.5s; }
                    .delay-600 { animation-delay: 0.6s; }
                    .delay-700 { animation-delay: 0.7s; }
                    .islamic-pattern {
                        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                        opacity: 0.02;
                    }
                `}</style>
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white font-sans" dir="rtl">
                    {/* Background Decorations */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute inset-0 islamic-pattern"></div>
                    </div>

                    <div className="relative min-h-screen">
                        {/* Hero Section */}
                        <section className="container mx-auto px-4 py-12 md:py-20 text-center">

                            {/* App Icon */}
                            <div className="flex justify-center mb-6 animate-fade-in">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl"></div>
                                    <div className="relative rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden">
                                        <Image
                                            src="/logo.jpg"
                                            alt="شعار التطبيق"
                                            width={120}
                                            height={120}
                                            className="object-cover"
                                            priority
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* App Name */}
                            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up delay-100" style={{ letterSpacing: '-0.02em' }}>
                                <span className="bg-gradient-to-l from-emerald-200 via-white to-amber-200 bg-clip-text text-transparent">
                                    الريّان
                                </span>
                                <br />
                                <span className="text-2xl md:text-3xl text-slate-300 font-normal">
                                    للقرآن الكريم
                                </span>
                            </h1>

                            {/* Tagline */}
                            <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto animate-fade-in-up delay-200">
                                نظام متكامل لإدارة التعليم القرآني
                            </p>

                            {/* Dua Card */}
                            <div className="max-w-3xl mx-auto mb-16 animate-fade-in-up delay-300">
                                <div className="relative group">
                                    {/* Glow Effect */}
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>

                                    {/* Card Content */}
                                    <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 md:p-12">
                                        <div className="absolute top-4 right-4 text-emerald-500/20 text-6xl leading-none" style={{ fontFamily: 'serif' }}>
                                            &quot;
                                        </div>
                                        <p className="text-xl md:text-2xl text-slate-200 leading-relaxed mb-4" style={{ lineHeight: 1.8 }}>
                                            اللهم اجعل القرآن ربيع قلوبنا
                                            <br />
                                            ونور صدورنا وجلاء أحزاننا
                                        </p>
                                        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-fade-in-up delay-400">
                                <button
                                    onClick={() => router.push('/login')}
                                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                                >
                                    <span className="relative z-10">تسجيل الدخول</span>
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
                                </button>

                                <button
                                    onClick={() => router.push('/register')}
                                    className="group relative w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                                >
                                    <span className="relative z-10 text-slate-200 group-hover:text-emerald-300 transition-colors">
                                        إنشاء مدرسة قرآنية
                                    </span>
                                </button>
                            </div>
                        </section>

                        {/* Features Section */}
                        <section className="container mx-auto px-4 py-12 mb-20">
                            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

                                {/* Feature 1 */}
                                <div className="group relative animate-fade-in-up delay-500">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/20 group-hover:to-emerald-500/5 rounded-2xl blur-lg transition-all duration-500"></div>

                                    <div className="relative h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 group-hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1">
                                        <div className="inline-flex p-3 bg-emerald-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">إدارة الطلبة</h3>
                                        <p className="text-slate-400 leading-relaxed">نظام شامل لمتابعة الطلاب وحضورهم</p>
                                    </div>
                                </div>

                                {/* Feature 2 */}
                                <div className="group relative animate-fade-in-up delay-600">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/20 group-hover:to-amber-500/5 rounded-2xl blur-lg transition-all duration-500"></div>

                                    <div className="relative h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 group-hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1">
                                        <div className="inline-flex p-3 bg-amber-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">نظام تقييم ذكي</h3>
                                        <p className="text-slate-400 leading-relaxed">تقييم دقيق لمستوى الحفظ والتلاوة</p>
                                    </div>
                                </div>

                                {/* Feature 3 */}
                                <div className="group relative animate-fade-in-up delay-700">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-teal-500/0 to-teal-500/0 group-hover:from-teal-500/20 group-hover:to-teal-500/5 rounded-2xl blur-lg transition-all duration-500"></div>

                                    <div className="relative h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 group-hover:border-slate-700 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1">
                                        <div className="inline-flex p-3 bg-teal-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">بيئة قرآنية منظمة</h3>
                                        <p className="text-slate-400 leading-relaxed">إدارة احترافية للمدارس القرآنية</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="container mx-auto px-4 py-12 text-center border-t border-slate-800/50">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-8">
                                    <p className="text-slate-300 text-lg font-semibold mb-3">
                                        تطبيق الريّان للقرآن الكريم
                                    </p>

                                    {/* Dedication Card */}
                                    <div className="relative group max-w-2xl mx-auto">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 rounded-xl blur-md group-hover:blur-lg transition-all duration-500"></div>
                                        <div className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
                                            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-3">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm font-semibold">صدقة جارية</span>
                                            </div>
                                            <p className="text-slate-300 leading-relaxed mb-2">
                                                اللهم اجعل هذا العمل في ميزان حسنات أخي
                                            </p>
                                            <p className="text-slate-400 text-sm leading-relaxed">
                                                رحمه الله وغفر له وأسكنه فسيح جناته
                                                <br />
                                                وجعل القرآن شفيعًا له يوم القيامة
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8"></div>

                                {/* Developer Info */}
                                <div className="mb-6">
                                    <p className="text-slate-500 text-sm mb-2">طُوّر بعناية بواسطة</p>
                                    <h3 className="text-slate-200 font-bold text-lg mb-2">
                                        وزير محمد الغزالي
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        اللهم علّمني ما ينفعني وانفعني بما علمتني
                                        <br />
                                        وزدني علمًا وعملًا صالحًا
                                    </p>
                                </div>

                                {/* Copyright */}
                                <div className="text-slate-600 text-xs">
                                    &copy; {new Date().getFullYear()} جميع الحقوق محفوظة
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
            <Navbar />

            <div className="pt-24 pb-12 max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">لوحة التحكم</h1>
                        <p className="text-gray-500 dark:text-gray-400">أهلاً بك يا <span className="text-green-600 font-bold">{user.name || 'مستخدم'}</span> في لوحة إدارتك</p>
                    </div>
                    <div className="w-full md:w-auto bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-700 dark:text-green-300 shadow-inner">
                            <School size={24} />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">أنت تدير حالياً:</div>
                            <div className="font-bold text-gray-800 dark:text-white text-lg">{user.schoolName}</div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Card 1: Total Students */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-b-4 border-green-500 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">إجمالي الطلاب</p>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{totalStudents}</h2>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full text-green-600 dark:text-green-400">
                            <Users size={24} />
                        </div>
                    </div>

                    {/* Card 2: Morning Presence */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-b-4 border-yellow-500 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">حضور صباحي</p>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{morningPresence}</h2>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-full text-yellow-600 dark:text-yellow-400">
                            <Sun size={24} />
                        </div>
                    </div>

                    {/* Card 3: Evening Presence */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-b-4 border-purple-500 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">حضور مسائي</p>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{eveningPresence}</h2>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full text-purple-600 dark:text-purple-400">
                            <Moon size={24} />
                        </div>
                    </div>

                    {/* Card 4: Avg Rating */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-b-4 border-blue-500 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">متوسط التقييم</p>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{avgRating}<span className="text-sm text-gray-400">/10</span></h2>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400">
                            <Star size={24} />
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <DashboardCharts students={students} />

                {/* Quick Attendance & Student List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">سجل الطلاب السريع</h3>

                        {/* Search in Table */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute right-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="بحث عن طالب..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">اسم الطالب</th>
                                    <th className="px-6 py-4 font-medium">المدرسة</th>
                                    <th className="px-6 py-4 font-medium">النقاط (أسبوعي)</th>
                                    <th className="px-6 py-4 font-medium text-center">صباحي</th>
                                    <th className="px-6 py-4 font-medium text-center">مسائي</th>
                                    <th className="px-6 py-4 font-medium">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredStudents.slice(0, 10).map((student) => {
                                    const isMorningPresent = student.attendance?.some((a: any) =>
                                        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'MORNING'
                                    )
                                    const isEveningPresent = student.attendance?.some((a: any) =>
                                        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'EVENING'
                                    )

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs ml-3">
                                                        {student.firstName[0]}
                                                    </div>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{student.firstName} {student.lastName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">مدرسة الريّان</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-green-600 dark:text-green-400 font-bold">
                                                    {student.weeklyPoints} <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">نقطة</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleQuickAttendance(student.id, 'MORNING')}
                                                    className={`p-2 rounded-lg transition-all ${isMorningPresent
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    <Sun size={18} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleQuickAttendance(student.id, 'EVENING')}
                                                    className={`p-2 rounded-lg transition-all ${isEveningPresent
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    <Moon size={18} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => router.push(`/student/${student.id}`)}
                                                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                                >
                                                    التفاصيل
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filteredStudents.length > 10 && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 text-center border-t border-gray-100 dark:border-gray-700">
                                <button onClick={() => router.push('/students')} className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline">
                                    عرض كل الطلاب ({filteredStudents.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
