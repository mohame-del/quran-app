'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { Check, X, BookOpen, UserCheck, Search } from 'lucide-react'

export default function Evaluation() {
    const { user } = useAuth()
    const [students, setStudents] = useState<any[]>([])
    const [search, setSearch] = useState('')

    const filteredStudents = useMemo(() => {
        if (search.trim() === '') return students
        return students.filter(s => (s.firstName + ' ' + s.lastName).includes(search))
    }, [search, students])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'RECITATION'>('ATTENDANCE')

    // Attendance State
    const [selectedPeriod, setSelectedPeriod] = useState<'MORNING' | 'EVENING'>('EVENING')
    const [attendance, setAttendance] = useState<Record<string, boolean>>({})

    // Recitation State
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [recitationData, setRecitationData] = useState({
        surah: '',
        hizb: '',
        quarter: '',
        grade: '10' // Default grade
    })

    const fetchStudents = async () => {
        const res = await fetch('/api/students')
        const data = await res.json()
        if (data.success) {
            setStudents(data.students)
        }
        setLoading(false)
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (user) fetchStudents()
    }, [user])



    // Attendance Logic
    const toggleAttendance = (id: string) => {
        setAttendance(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const selectAll = () => {
        const newAtt = { ...attendance }
        filteredStudents.forEach(s => newAtt[s.id] = true)
        setAttendance(newAtt)
    }

    const deselectAll = () => {
        setAttendance({})
    }

    const saveAttendance = async () => {
        const presentIds = Object.keys(attendance).filter(id => attendance[id])
        if (presentIds.length === 0 && !confirm('هل أنت متأكد من تسجيل الجميع غياب؟')) return

        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds: presentIds,
                    date: new Date().toISOString().split('T')[0],
                    period: selectedPeriod
                })
            })
            const data = await res.json()
            if (data.success) {
                alert('تم تسجيل الحضور بنجاح')
                setAttendance({})
            } else {
                alert('خطأ: ' + data.error)
            }
        } catch (e) {
            alert('حدث خطأ في الاتصال')
        }
    }

    // Recitation Logic
    const openRecitationModal = (student: any) => {
        setSelectedStudent(student)
        setRecitationData({
            surah: '',
            hizb: student.currentHizb?.toString() || '0',
            quarter: student.currentQuarter?.toString() || '0',
            grade: '10'
        })
    }

    const saveRecitation = async () => {
        if (!selectedStudent) return

        try {
            const res = await fetch('/api/presentation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    date: new Date().toISOString(),
                    hizb: Number(recitationData.hizb),
                    quarter: Number(recitationData.quarter),
                    surah: recitationData.surah,
                    grade: recitationData.grade
                })
            })
            const data = await res.json()
            if (data.success) {
                alert('تم تسجيل العرض بنجاح')
                setSelectedStudent(null)
                // Optionally refresh listing to update progress?
                fetchStudents()
            } else {
                alert('خطأ: ' + data.error)
            }
        } catch (e) {
            alert('حدث خطأ')
        }
    }

    if (loading) return <div className="p-10 flex justify-center">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar />
            <div className="pt-24 max-w-6xl mx-auto px-4 md:px-6">

                {/* Tabs */}
                <div className="flex mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-2 border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('ATTENDANCE')}
                        className={`flex-1 flex items-center justify-center py-3 rounded-lg transition-all font-bold ${activeTab === 'ATTENDANCE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <UserCheck className="ml-2" /> تسجيل الحضور (جمعي)
                    </button>
                    <button
                        onClick={() => setActiveTab('RECITATION')}
                        className={`flex-1 flex items-center justify-center py-3 rounded-lg transition-all font-bold ${activeTab === 'RECITATION' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <BookOpen className="ml-2" /> تقييم العرض والتسميع
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="بحث عن طالب..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full p-4 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-green-500 outline-none text-gray-800 dark:text-white"
                    />
                    <Search className="absolute right-4 top-4 text-gray-400" />
                </div>

                {activeTab === 'ATTENDANCE' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 animate-fadeIn border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">قائمة الحضور</h2>

                            <div className="flex gap-2">
                                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                                    <button
                                        onClick={() => setSelectedPeriod('MORNING')}
                                        className={`px-4 py-2 rounded-md font-bold text-sm ${selectedPeriod === 'MORNING' ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        صباحي
                                    </button>
                                    <button
                                        onClick={() => setSelectedPeriod('EVENING')}
                                        className={`px-4 py-2 rounded-md font-bold text-sm ${selectedPeriod === 'EVENING' ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}
                                    >
                                        مسائي
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between items-center">
                            <span>يتم احتساب +2 نقطة للحضور. الغياب يخصم من التقييم الأسبوعي (صفر نقاط لليوم).</span>
                            <div className="space-x-reverse space-x-2">
                                <button onClick={selectAll} className="text-blue-600 dark:text-blue-400 underline text-xs font-bold px-2">تحديد الكل</button>
                                <button onClick={deselectAll} className="text-blue-600 dark:text-blue-400 underline text-xs font-bold px-2">إلغاء التحديد</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredStudents.map(student => (
                                <div
                                    key={student.id}
                                    onClick={() => toggleAttendance(student.id)}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex justify-between items-center ${attendance[student.id]
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-800 dark:text-gray-200">{student.firstName} {student.lastName}</div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${attendance[student.id] ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-300'
                                        }`}>
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={saveAttendance}
                                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-bold shadow-lg w-full md:w-auto"
                            >
                                حفظ الحضور ({Object.values(attendance).filter(Boolean).length})
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'RECITATION' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                        {filteredStudents.map(student => (
                            <div key={student.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{student.firstName} {student.lastName}</h3>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">الحزب الحالي: {student.currentHizb}</div>
                                    </div>
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                        <BookOpen size={20} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => openRecitationModal(student)}
                                    className="w-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 py-2 rounded-lg hover:bg-green-600 hover:text-white dark:hover:bg-green-600 dark:hover:text-white transition-colors"
                                >
                                    تسجيل عرض
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recitation Modal */}
                {selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="bg-green-600 px-6 py-4 flex justify-between items-center text-white">
                                <h3 className="font-bold text-lg">تقييم: {selectedStudent.firstName}</h3>
                                <button onClick={() => setSelectedStudent(null)} className="hover:bg-green-700 p-1 rounded"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السورة</label>
                                    <input
                                        type="text"
                                        value={recitationData.surah}
                                        onChange={e => setRecitationData({ ...recitationData, surah: e.target.value })}
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                                        placeholder="اسم السورة"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحزب</label>
                                        <input
                                            type="number"
                                            value={recitationData.hizb}
                                            onChange={e => setRecitationData({ ...recitationData, hizb: e.target.value })}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الربع</label>
                                        <input
                                            type="number"
                                            value={recitationData.quarter}
                                            onChange={e => setRecitationData({ ...recitationData, quarter: e.target.value })}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التقييم (الدرجة)</label>
                                    <select
                                        value={recitationData.grade}
                                        onChange={e => setRecitationData({ ...recitationData, grade: e.target.value })}
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                                    >
                                        <option value="10">ممتاز (10)</option>
                                        <option value="8">جيد جداً (8)</option>
                                        <option value="6">جيد (6)</option>
                                        <option value="4">مقبول (4)</option>
                                        <option value="2">ضعيف (2)</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button onClick={saveRecitation} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold">حفظ التقييم</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
