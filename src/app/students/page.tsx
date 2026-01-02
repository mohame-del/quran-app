'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Search, User } from 'lucide-react'

export default function StudentsList() {
    const { user, loading: authLoading, currentSectionId } = useAuth()
    const router = useRouter()
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isHoliday, setIsHoliday] = useState(false)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }
        if (user) {
            fetchStudents(currentSectionId)
        }
    }, [user, authLoading, router, currentSectionId])

    const fetchStudents = async (sectionId?: string | null) => {
        try {
            const url = sectionId && sectionId !== 'all'
                ? `/api/students?sectionId=${sectionId}`
                : '/api/students'
            const res = await fetch(url)
            const data = await res.json()
            if (data.success) {
                setStudents(data.students)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Sort by weekly rating (desc) and then filter by search
    const sorted = [...students].sort((a, b) => (b.currentWeeklyRating || b.weeklyRating || 0) - (a.currentWeeklyRating || a.weeklyRating || 0))

    const filtered = sorted.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

    // Calculate Stats (Client-Side for now, using attendance from API if available)
    // Note: Since we reverted, we assume 'attendance' array might be added to API to make this real.
    // If not, it defaults to 0.
    const morningAttendance = students.filter(s => s.attendance?.some((a: any) =>
        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'MORNING'
    )).length || 0

    const eveningAttendance = students.filter(s => s.attendance?.some((a: any) =>
        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'EVENING'
    )).length || 0

    if (authLoading || loading) return <div className="p-10 text-center dark:text-gray-300">جاري التحميل...</div>

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <div className="pt-24 max-w-7xl mx-auto px-6 pb-20">
                {/* Stats & Holiday Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">عدد الطلبة</p>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{students.length}</h3>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded text-green-600"><Plus size={20} /></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">حضور صباحي</p>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{morningAttendance}</h3>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-blue-600">☀️</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">حضور مسائي</p>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{eveningAttendance}</h3>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded text-purple-600">🌙</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-red-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition" onClick={() => setIsHoliday(!isHoliday)}>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">وضع العطلة</p>
                            <h3 className={`text-sm font-bold ${isHoliday ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                                {isHoliday ? 'نشط (الغياب معطل)' : 'غير نشط'}
                            </h3>
                        </div>
                        <div className={`p-2 rounded transition ${isHoliday ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-300'}`}>🛑</div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">قائمة الطلبة</h1>
                    <Link
                        href="/add-student"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-reverse space-x-2 shadow-md transition-all hover:shadow-lg"
                    >
                        <Plus size={20} className="ml-2" />
                        <span>إضافة طالب</span>
                    </Link>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="بحث عن طالب بالاسم..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-500 text-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                {/* List - Grid Layout (Restored) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((student, idx) => {
                        const total = filtered.length
                        // Rank Logic
                        let borderClass = 'border-transparent'
                        let badge = null
                        if (idx === 0) { borderClass = 'border-yellow-400 dark:border-yellow-600'; badge = '🥇' }
                        else if (idx === 1 || idx === 2) { borderClass = 'border-gray-400 dark:border-gray-500'; badge = '🥈' }
                        else if (idx === 3 || idx === 4) { borderClass = 'border-orange-400 dark:border-orange-600'; badge = '🥉' }
                        else if (idx >= Math.max(0, total - 5)) { borderClass = 'border-red-400 dark:border-red-600' }

                        return (
                            <Link key={student.id} href={`/student/${student.id}`} className="block group">
                                <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 ${borderClass} flex items-center space-x-reverse space-x-4 dark:border-opacity-50`}>
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                                        {idx + 1}
                                        {badge && (
                                            <div className="absolute -mt-8 mr-6 text-2xl drop-shadow-md">{badge}</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{student.firstName} {student.lastName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">الحزب: <span className="font-medium text-gray-900 dark:text-gray-200">{student.currentHizb}</span> | الربع: <span className="font-medium text-gray-900 dark:text-gray-200">{student.currentQuarter}</span></p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="flex mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`text-xs ${i < (student.currentStars || student.stars || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>★</span>
                                            ))}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-gray-400">التقييم</div>
                                            <div className="font-bold text-green-600 dark:text-green-400">{student.currentWeeklyRating || student.weeklyRating || 0}/10</div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}

                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">لا يوجد نتائج</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
