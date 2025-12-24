'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { Star, BookOpen, Edit, Snowflake, Trash2, Minus, CheckCircle } from 'lucide-react'

// Recharts imports
// Dynamic import for Chart to avoid Hydration issues
import dynamic from 'next/dynamic'
const StudentProgressChart = dynamic(() => import('@/components/StudentProgressChart'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl" />
})

export default function StudentProfile() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Modals
    const [showDeductModal, setShowDeductModal] = useState(false)
    const [deductPoints, setDeductPoints] = useState(1)
    const [deductReason, setDeductReason] = useState('')

    // Fetch Logic
    useEffect(() => {
        let mounted = true

        async function loadData() {
            if (!user) return
            if (!params.id) return

            try {
                // setLoading(true) // Don't flicker if already true
                const res = await fetch(`/api/students/${params.id}`)
                if (!res.ok) throw new Error('Failed to fetch')

                const data = await res.json()
                if (mounted) {
                    if (data.success && data.student) {
                        setStudent(data.student)
                    } else {
                        setError('الطالب غير موجود')
                    }
                }
            } catch (err) {
                if (mounted) setError('حدث خطأ أثناء تحميل البيانات')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        loadData()

        return () => { mounted = false }
    }, [user, params.id])


    // Chart Data Preparation
    const chartData = React.useMemo(() => {
        if (!student?.weeklyEvaluations || student.weeklyEvaluations.length === 0) {
            return []
        }
        return student.weeklyEvaluations.map((w: any) => ({
            name: w.weekStartDate ? new Date(w.weekStartDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '-',
            points: w?.totalPoints ?? 0,
            rating: w?.rating ?? 0
        })).reverse() // Show chronological? API sorts desc? usually we want ASC for chart. API sorts by weekStartDate ASC? 
        // Logic: `orderBy: { weekStartDate: 'asc' }` in API. So it is ASC.
    }, [student])


    // Actions
    const handleDeduct = async () => {
        if (!deductReason) return alert('الرجاء كتابة السبب')
        try {
            const res = await fetch('/api/deduction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: student.id,
                    points: Number(deductPoints),
                    reason: deductReason
                })
            })
            const data = await res.json()
            if (data.success) {
                setShowDeductModal(false)
                setDeductPoints(1)
                setDeductReason('')
                // Refetch
                const updatedRes = await fetch(`/api/students/${student.id}`)
                const updatedData = await updatedRes.json()
                if (updatedData.success) setStudent(updatedData.student)
            } else {
                alert(data.error)
            }
        } catch (e) {
            alert('Error')
        }
    }

    const handleToggleFreeze = async () => {
        if (!student) return
        try {
            const res = await fetch(`/api/students/${student.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFrozen: !student.isFrozen })
            })
            if (res.ok) {
                setStudent((prev: any) => ({ ...prev, isFrozen: !prev.isFrozen }))
            } else {
                alert('فشل التحديث')
            }
        } catch (e) {
            alert('Error updating status')
        }
    }

    const handleDelete = async () => {
        if (!student) return
        if (confirm('هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع.')) {
            await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
            router.push('/students')
        }
    }

    const handleUpdate = async () => {
        if (!student) return
        const newPhone = prompt('أدخل رقم الهاتف الجديد:', student.phone || '')
        if (newPhone !== null && newPhone !== student.phone) {
            try {
                const res = await fetch(`/api/students/${student.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: newPhone })
                })
                if (res.ok) {
                    setStudent((prev: any) => ({ ...prev, phone: newPhone }))
                }
            } catch (e) {
                alert('Error updating')
            }
        }
    }


    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
    if (error || !student) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
            <h2 className="text-xl text-red-600 font-bold">{error || 'Student Not Found'}</h2>
            <button onClick={() => router.push('/students')} className="text-blue-600 underline">عودة للطلاب</button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <div className="pt-24 max-w-6xl mx-auto px-4 md:px-6 mb-10">

                {/* Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Sidebar Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-100 dark:border-gray-700">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                                {student.firstName?.[0] || '?'}
                            </div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{student.firstName} {student.lastName}</h1>
                            {student.isFrozen && (
                                <span className="inline-block mt-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm font-bold">مجمد</span>
                            )}
                            <div className="mt-4 flex justify-center space-x-reverse space-x-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={20} className={`${i < (student.currentStars || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                                ))}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                                التقييم الأسبوعي: <span className="text-green-600 dark:text-green-400 font-bold">{student.currentWeeklyRating || 0}/10</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">الحزب:</span>
                                <span className="font-bold text-gray-800 dark:text-white">{student.currentHizb || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">الربع:</span>
                                <span className="font-bold text-gray-800 dark:text-white">{student.currentQuarter || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">الهاتف:</span>
                                <span className="font-bold text-sm text-gray-800 dark:text-white" dir="ltr">{student.phone || '-'}</span>
                            </div>
                            <button onClick={handleUpdate} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex justify-center items-center transition-colors shadow">
                                <Edit size={16} className="ml-2" /> تعديل رقم الهاتف
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
                                    <BookOpen size={24} className="ml-2 text-green-600 dark:text-green-400" /> مسار التقدم
                                </h2>
                            </div>

                            <div className="h-80 w-full">
                                <StudentProgressChart data={chartData} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold mb-4 text-gray-800 dark:text-white">إدارة الطالب</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button onClick={() => setShowDeductModal(true)} className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 py-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 flex justify-center items-center transition-colors border border-red-100 dark:border-red-900/30">
                                    <Minus size={20} className="ml-2" /> خصم نقاط
                                </button>
                                <button onClick={handleToggleFreeze} className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 py-3 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/20 flex justify-center items-center transition-colors border border-yellow-100 dark:border-yellow-900/30">
                                    <Snowflake size={20} className="ml-2" /> {student.isFrozen ? 'إلغاء تجميد' : 'تجميد'}
                                </button>
                                <button onClick={handleDelete} className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-center items-center transition-colors border border-gray-200 dark:border-gray-600">
                                    <Trash2 size={20} className="ml-2" /> حذف
                                </button>
                            </div>
                        </div>

                        {/* Deductions History */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-fadeIn">
                            <h3 className="font-bold mb-4 text-red-600 dark:text-red-400 flex items-center">
                                <Minus size={20} className="ml-2" /> سجل الخصومات
                            </h3>
                            {student.deductions && student.deductions.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {student.deductions.map((d: any) => (
                                        <div key={d.id} className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border-r-4 border-red-500 dark:border-red-400 flex justify-between items-center shadow-sm">
                                            <div>
                                                <div className="font-bold text-red-700 dark:text-red-300">{Math.abs(d.points)} نقاط</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{d.reason}</div>
                                            </div>
                                            <div className="text-xs text-gray-400 dir-ltr">{new Date(d.date).toLocaleDateString('ar-EG')}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">لا يوجد خصومات مسجلة</p>
                            )}
                        </div>

                        {/* Attendance History */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-fadeIn">
                            <h3 className="font-bold mb-4 text-green-600 dark:text-green-400 flex items-center">
                                <CheckCircle size={20} className="ml-2" /> سجل الحضور (آخر 30 يوم)
                            </h3>
                            {student.attendance && student.attendance.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {student.attendance.map((a: any) => (
                                        <div key={a.id} className={`p-2 rounded-lg text-center text-sm border shadow-sm ${a.status === 'PRESENT' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800'}`}>
                                            <div className="text-xs opacity-75 mb-1">{new Date(a.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</div>
                                            <div className="font-bold">{a.status === 'PRESENT' ? 'حاضر' : 'غائب'}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">لا يوجد سجل حضور حديث</p>
                            )}
                        </div>

                    </div>
                </div>

                {/* Deduct Modal */}
                {showDeductModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md m-4 shadow-2xl border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">خصم نقاط</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عدد النقاط المخصومة</label>
                                    <input type="number" min="1" value={deductPoints} onChange={e => setDeductPoints(Number(e.target.value))} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سبب الخصم</label>
                                    <textarea value={deductReason} onChange={e => setDeductReason(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600" rows={3} placeholder="مثال: مشاغبة في الحلقة..." />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={handleDeduct} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors shadow">تأكيد الخصم</button>
                                    <button onClick={() => setShowDeductModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">إلغاء</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
