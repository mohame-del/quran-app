'use client'

import React from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { Building, Mail, User, Users } from 'lucide-react'

export default function MySchool() {
    const { user } = useAuth()
    const [students, setStudents] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (user) {
            fetch('/api/students')
                .then(res => res.json())
                .then(data => {
                    if (data.success) setStudents(data.students)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [user])

    if (!user) return null

    const studentCount = students.length
    const averageRating = studentCount > 0
        ? (students.reduce((acc, s) => acc + (s.currentWeeklyRating || s.weeklyRating || 0), 0) / studentCount).toFixed(1)
        : '0.0'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <div className="pt-24 max-w-5xl mx-auto px-4 md:px-6 pb-20">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-700 h-40 w-full relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="relative -top-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex items-end gap-6">
                                <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 flex items-center justify-center border-4 border-white dark:border-gray-700">
                                    <Building size={64} className="text-green-600" />
                                </div>
                                <div className="mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.schoolName}</h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                        <User size={16} />
                                        المشرف: {user.name || 'الشيخ'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="flex items-center space-x-reverse space-x-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-blue-500">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wide">البريد الإلكتروني</label>
                                    <span className="text-gray-700 dark:text-gray-200 font-medium">{user.email}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-reverse space-x-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-purple-500">
                                    <User size={24} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wide">معرف المدرسة</label>
                                    <span className="text-gray-700 dark:text-gray-200 font-medium font-mono text-sm">{user.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">إحصائيات المدرسة</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Students Count Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">عدد الطلبة</p>
                                <h3 className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{loading ? '-' : studentCount}</h3>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600">
                                <Users size={24} />
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Average Rating Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">متوسط التقييم</p>
                                <h3 className="text-4xl font-bold text-gray-800 dark:text-white mt-2 flex items-baseline gap-2">
                                    {loading ? '-' : averageRating}
                                    <span className="text-sm font-normal text-gray-400">/ 10</span>
                                </h3>
                            </div>
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-600">
                                <span className="text-xl">⭐</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(parseFloat(averageRating) / 10) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* School Rank/Status Placeholder */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">حالة المدرسة</p>
                                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">نشطة</h3>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                                <Building size={24} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                            تعمل المدرسة بشكل جيد.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
