'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'

export default function AddStudent() {
    const router = useRouter()
    const { user, currentSectionId } = useAuth()
    const [loading, setLoading] = useState(false)
    const [sections, setSections] = useState<any[]>([])
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        fatherPhone: '',
        parentEmail: '',
        parentPhone: '',
        currentHizb: 0,
        currentQuarter: 0,
        birthDate: '',
        sectionId: ''
    })

    React.useEffect(() => {
        if (user) {
            const sid = user.schoolId || user.id
            fetch(`/api/sections?schoolId=${sid}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setSections(data.sections)
                        // Auto-select from context if available
                        if (currentSectionId && currentSectionId !== 'all') {
                            setFormData(prev => ({ ...prev, sectionId: currentSectionId }))
                        }
                    }
                })
        }
    }, [user, currentSectionId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    currentHizb: Number(formData.currentHizb),
                    currentQuarter: Number(formData.currentQuarter),
                    sectionId: formData.sectionId || null
                })
            })
            const data = await res.json()
            if (data.success) {
                alert('تم إضافة الطالب بنجاح')
                router.push('/')
            } else {
                alert(data.error || 'حدث خطأ')
            }
        } catch (e) {
            alert('حدث خطأ')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="pt-24 max-w-2xl mx-auto px-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">إضافة طالب جديد</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الاسم الأول</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اللقب</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحزب الحالي</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={formData.currentHizb}
                                    onChange={e => setFormData({ ...formData, currentHizb: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الربع</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="8"
                                    value={formData.currentQuarter}
                                    onChange={e => setFormData({ ...formData, currentQuarter: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">القسم</label>
                                <select
                                    value={formData.sectionId}
                                    onChange={e => setFormData({ ...formData, sectionId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">بدون قسم</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ الميلاد</label>
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم ولي الأمر</label>
                                <input
                                    type="tel"
                                    value={formData.fatherPhone}
                                    onChange={e => setFormData({ ...formData, fatherPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بريد ولي الأمر *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.parentEmail}
                                    onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="example@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">هاتف ولي الأمر *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.parentPhone}
                                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="+213XXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-reverse space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'جاري الحفظ...' : 'حفظ الطالب'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
