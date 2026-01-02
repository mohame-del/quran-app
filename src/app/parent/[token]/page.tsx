'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Star, BookOpen, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import dynamic from 'next/dynamic'

const StrictLineChart = dynamic(() => import('@/components/StrictLineChart'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-900/50 animate-pulse rounded-xl" />
})

export default function ParentMonitoringPage() {
    const params = useParams()
    const { user } = useAuth()
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showMonthly, setShowMonthly] = useState(false)
    const [showYearly, setShowYearly] = useState(false)

    // Chart View State
    const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')

    useEffect(() => {
        const checkTimeBasedRules = () => {
            const now = new Date()
            const currentDay = now.getDate()
            const currentMonth = now.getMonth()
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

            setShowMonthly(currentDay === lastDayOfMonth)
            setShowYearly(currentMonth === 11 && currentDay === 31)
        }

        checkTimeBasedRules()
    }, [])

    useEffect(() => {
        async function loadData() {
            if (!params?.token) return

            try {
                const res = await fetch(`/api/parent/${params.token}`)
                if (!res.ok) throw new Error('Failed to fetch')

                const data = await res.json()
                if (data.success && data.student) {
                    setStudent(data.student)
                } else {
                    setError('الطالب غير موجود')
                }
            } catch (err) {
                setError('حدث خطأ أثناء تحميل البيانات')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [params?.token])

    const chartData = React.useMemo(() => {
        if (!student?.weeklyEvaluations || student.weeklyEvaluations.length === 0) {
            return []
        }

        // Base data: Weekly evaluations
        // Assuming API returns date ISO string.
        const baseData = student.weeklyEvaluations.map((w: any) => ({
            date: new Date(w.weekStartDate),
            points: w.totalPoints || 0,
            weekId: w.id
        })).sort((a: any, b: any) => a.date.getTime() - b.date.getTime())

        if (chartView === 'weekly') {
            return baseData.map((d: any) => ({
                day: d.date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
                points: d.points
            }))
        } else if (chartView === 'monthly') {
            // Aggregate by Month
            const grouped = new Map()
            baseData.forEach((d: any) => {
                const key = d.date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' })
                grouped.set(key, (grouped.get(key) || 0) + d.points)
            })
            return Array.from(grouped.entries()).map(([k, v]) => ({
                week: k,
                points: v
            }))
        } else {
            // Yearly
            const grouped = new Map()
            baseData.forEach((d: any) => {
                const key = d.date.getFullYear().toString()
                grouped.set(key, (grouped.get(key) || 0) + d.points)
            })
            return Array.from(grouped.entries()).map(([k, v]) => ({
                month: k,
                points: v
            }))
        }
    }, [student, chartView])

    const handleDownloadPDF = async () => {
        try {
            const res = await fetch(`/api/parent/${params?.token}/pdf`)
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `تقرير_${student.firstName}_${student.lastName}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            alert('حدث خطأ أثناء تحميل التقرير')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        )
    }

    if (error || !student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center">
                    <h2 className="text-xl text-red-500 font-bold mb-4">{error || 'الطالب غير موجود'}</h2>
                    <p className="text-gray-400">الرجاء التحقق من الرابط</p>
                </div>
            </div>
        )
    }

    const last7Days = student.attendance?.slice(0, 7) || []
    const attendedDays = last7Days.filter((a: any) => a.status === 'PRESENT').length
    const absentDays = last7Days.filter((a: any) => a.status === 'ABSENT').length
    const latestWeekly = student.weeklyEvaluations?.[0]
    const lastPresentation = student.presentations?.[0]
    const recitationGrade = lastPresentation?.grade || '-'
    const currentSurah = lastPresentation?.surah || 'لم يتم التسجيل بعد'
    const lastPresentationDate = lastPresentation?.date ? new Date(lastPresentation.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'لم يتم العرض بعد'

    return (
        <div className="min-h-screen bg-black text-white font-['Cairo',sans-serif] p-4 md:p-6">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700&display=swap');
                * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
                .card { background: linear-gradient(135deg, #141414 0%, #0a0a0a 100%); border: 1px solid rgba(255,255,255,0.05); }
                .gauge-line { height: 10px; border-radius: 10px; background: linear-gradient(90deg, #1a1a1a 0%, #0f0f0f 100%); overflow: hidden; position: relative; }
                .gauge-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; background: linear-gradient(90deg, var(--start-color), var(--end-color)); box-shadow: 0 0 15px var(--glow-color); }
                .timeline-dot { transition: all 0.3s ease; }
                .timeline-dot:hover { transform: scale(1.2); }
            `}</style>

            <div className="max-w-2xl mx-auto space-y-5">

                <div className="card rounded-2xl p-5 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Amiri', serif" }}>
                                {student.firstName} {student.lastName}
                            </h1>
                            <p className="text-gray-400 text-sm mb-3">{student.school.schoolName}</p>
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full border border-green-800/50">
                                    الحزب {student.currentHizb || 0}
                                </span>
                                <span className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-full border border-purple-800/50">
                                    الربع {student.currentQuarter || 0}
                                </span>
                                <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full border border-blue-800/50">
                                    {currentSurah}
                                </span>
                            </div>
                        </div>
                        <button onClick={handleDownloadPDF} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg">
                            <Download size={18} />
                            <span className="hidden sm:inline">تحميل التقرير</span>
                        </button>
                    </div>
                    <div className="pt-3 border-t border-white/5">
                        <div className="flex justify-center space-x-reverse space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={24} className={`${i < (student.currentStars || 0) ? 'text-yellow-400 fill-current' : 'text-gray-700'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card rounded-2xl p-5 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                        <span className="text-2xl">📊</span>
                        ملخص هذا الأسبوع
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-950/30 rounded-xl p-4 border border-green-900/50">
                            <div className="text-green-400 text-3xl font-bold mb-1">{attendedDays}/7</div>
                            <div className="text-gray-400 text-sm">✅ أيام الحضور</div>
                        </div>
                        <div className="bg-red-950/30 rounded-xl p-4 border border-red-900/50">
                            <div className="text-red-400 text-3xl font-bold mb-1">{absentDays}</div>
                            <div className="text-gray-400 text-sm">❌ أيام الغياب</div>
                        </div>
                        <div className="bg-yellow-950/30 rounded-xl p-4 border border-yellow-900/50 col-span-2">
                            <div className="text-yellow-400 text-3xl font-bold mb-1">{latestWeekly?.rating?.toFixed(1) || '0.0'}/10</div>
                            <div className="text-gray-400 text-sm">⭐ التقييم الأسبوعي</div>
                        </div>
                        <div className="bg-blue-950/30 rounded-xl p-4 border border-blue-900/50">
                            <div className="text-blue-400 text-2xl font-bold mb-1">{recitationGrade}</div>
                            <div className="text-gray-400 text-sm">📖 درجة التلاوة</div>
                        </div>
                        <div className="bg-purple-950/30 rounded-xl p-4 border border-purple-900/50">
                            <div className="text-purple-400 text-sm font-semibold mb-1 leading-tight">{lastPresentationDate}</div>
                            <div className="text-gray-400 text-sm">📅 آخر عرض</div>
                        </div>
                    </div>
                </div>

                {latestWeekly && (
                    <div className="card rounded-2xl p-5 shadow-lg">
                        <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                            <span className="text-2xl">📈</span>
                            التقييم الأسبوعي التفصيلي
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-200">إجمالي النقاط</span>
                                    <span className="text-green-400 font-bold">{latestWeekly.totalPoints}/15</span>
                                </div>
                                <div className="gauge-line">
                                    <div className="gauge-fill" style={{ '--start-color': '#10b981', '--end-color': '#059669', '--glow-color': 'rgba(16, 185, 129, 0.4)', width: `${(latestWeekly.totalPoints / 15) * 100}%` } as any} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-200">التقييم</span>
                                    <span className="text-blue-400 font-bold">{latestWeekly.rating.toFixed(1)}/10</span>
                                </div>
                                <div className="gauge-line">
                                    <div className="gauge-fill" style={{ '--start-color': '#3b82f6', '--end-color': '#2563eb', '--glow-color': 'rgba(59, 130, 246, 0.4)', width: `${(latestWeekly.rating / 10) * 100}%` } as any} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-200">التلاوة</span>
                                    <span className="text-purple-400 font-bold">{recitationGrade}</span>
                                </div>
                                <div className="gauge-line">
                                    <div className="gauge-fill" style={{ '--start-color': '#a855f7', '--end-color': '#9333ea', '--glow-color': 'rgba(168, 85, 247, 0.4)', width: recitationGrade !== '-' ? '100%' : '0%' } as any} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-gray-200">النجوم</span>
                                    <span className="text-yellow-400 font-bold">{latestWeekly.stars}/5</span>
                                </div>
                                <div className="gauge-line">
                                    <div className="gauge-fill" style={{ '--start-color': '#eab308', '--end-color': '#ca8a04', '--glow-color': 'rgba(234, 179, 8, 0.4)', width: `${(latestWeekly.stars / 5) * 100}%` } as any} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showMonthly && student.monthlyEvaluations && student.monthlyEvaluations.length > 0 && (
                    <div className="card rounded-2xl p-5 shadow-lg border-2 border-blue-900/50">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                            <span className="text-2xl">📅</span>
                            التقييم الشهري
                        </h2>
                        {student.monthlyEvaluations.slice(0, 3).map((m: any) => (
                            <div key={m.id} className="bg-blue-950/30 p-4 rounded-lg border border-blue-800/50 mb-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">الشهر {m.month}/{m.year}</span>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-sm font-bold text-blue-400">النقاط: {m.totalPoints}</span>
                                        <span className="text-sm font-bold text-blue-300">التقييم: {m.rating}/10</span>
                                        <div className="flex">
                                            {[...Array(m.stars || 0)].map((_, i) => (
                                                <Star key={i} size={16} className="text-yellow-400 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showYearly && student.yearlyEvaluations && student.yearlyEvaluations.length > 0 && (
                    <div className="card rounded-2xl p-5 shadow-lg border-2 border-purple-900/50">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                            <span className="text-2xl">🎯</span>
                            التقييم السنوي
                        </h2>
                        {student.yearlyEvaluations.map((y: any) => (
                            <div key={y.id} className="bg-purple-950/30 p-4 rounded-lg border border-purple-800/50 mb-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-400">السنة {y.year}</span>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-sm font-bold text-purple-400">النقاط: {y.totalPoints}</span>
                                        <span className="text-sm font-bold text-purple-300">التقييم: {y.rating}/10</span>
                                        <div className="flex">
                                            {[...Array(y.stars || 0)].map((_, i) => (
                                                <Star key={i} size={16} className="text-yellow-400 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="card rounded-2xl p-5 shadow-lg">
                    <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                        <span className="text-2xl">📅</span>
                        الحضور والغياب (آخر 7 أيام)
                    </h2>
                    {last7Days.length > 0 ? (
                        <>
                            <div className="relative">
                                <div className="absolute top-6 right-0 left-0 h-0.5 bg-white/10" />
                                <div className="relative flex justify-between items-start gap-2">
                                    {last7Days.map((a: any) => {
                                        const date = new Date(a.date)
                                        const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' })
                                        const dateStr = date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })
                                        const isPresent = a.status === 'PRESENT'
                                        return (
                                            <div key={a.id} className="flex flex-col items-center flex-1">
                                                <div className={`timeline-dot w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold z-10 border-4 border-black shadow-lg ${isPresent ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                                                    {isPresent ? '✓' : '✗'}
                                                </div>
                                                <div className="mt-3 text-center">
                                                    <div className="text-xs font-semibold text-gray-300">{dayName}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{dateStr}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{a.period === 'MORNING' ? 'صباحي' : 'مسائي'}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5">
                                <div className="flex flex-wrap gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                                        <span className="text-gray-400">حاضر</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-600" />
                                        <span className="text-gray-400">غائب</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 text-center py-8">لا يوجد سجل حضور حديث</p>
                    )}
                </div>


                <div className="card rounded-2xl p-5 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                            <BookOpen size={24} className="text-green-500" />
                            مسار التقدم
                        </h2>
                        <div className="flex bg-gray-800 p-1 rounded-lg">
                            {(['weekly', 'monthly', 'yearly'] as const).map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setChartView(view)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${chartView === view
                                        ? 'bg-gray-600 text-green-400 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    {view === 'weekly' ? 'أسبوعي' : view === 'monthly' ? 'شهري' : 'سنوي'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <StrictLineChart studentId={student.id} type={chartView} />
                    </div>
                </div>

                <div className="card rounded-2xl p-5 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                        <span className="text-2xl">📝</span>
                        رسالة الشيخ لوليّ الأمر
                    </h2>
                    {student.notes && student.notes.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {student.notes.map((note: any) => (
                                <div key={note.id} className="bg-gradient-to-br from-amber-950/20 to-orange-950/20 rounded-xl p-4 border border-amber-900/30">
                                    <p className="text-gray-200 leading-relaxed mb-2" style={{ fontFamily: "'Amiri', serif", fontSize: '1.05rem' }}>
                                        {note.content}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(note.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-amber-950/20 to-orange-950/20 rounded-xl p-4 border border-amber-900/30">
                            <p className="text-gray-500 text-center">لا توجد ملاحظات بعد</p>
                        </div>
                    )}
                </div>

                <div className="card rounded-2xl p-5 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Amiri', serif" }}>
                        <span className="text-2xl">📖</span>
                        وضع الحفظ الحالي
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-400">الحزب الحالي</span>
                            <span className="text-2xl font-bold text-green-400">{student.currentHizb || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-400">الربع الحالي</span>
                            <span className="font-semibold text-purple-400">{student.currentQuarter || 0}</span>
                        </div>
                    </div>
                </div>

                {user && (
                    <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/40 rounded-2xl shadow-lg p-4 border border-blue-800/50">
                        <p className="text-sm text-blue-300 mb-3">أنت مسجل دخول كشيخ - يمكنك تعديل البيانات</p>
                        <button onClick={() => window.location.href = `/student/${student.id}`} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg transition-all">
                            الانتقال لصفحة التعديل
                        </button>
                    </div>
                )}

                <div className="text-center text-gray-600 text-sm py-6">
                    <p style={{ fontFamily: "'Amiri', serif" }}>مدرسة الريّان للقرآن الكريم</p>
                </div>

            </div>
        </div>
    )
}
