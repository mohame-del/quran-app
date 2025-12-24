'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function CreateSchool() {
    const { register } = useAuth()
    const router = useRouter()
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            // Using the auth context register function which handles the API call correctly
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                schoolName: form.name, // Using supervisor name as school name fallback since field is missing
                phone: form.phone
            })
            // Redirect is handled in register but we can ensure safety
            // router.push('/students') 
        } catch (e: any) {
            setError(e.message || 'فشل في إنشاء المدرسة')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-24 max-w-2xl mx-auto px-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold mb-4">إنشاء مدرسة جديدة</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">اسم الشيخ / المشرف</label>
                            <input className="w-full px-4 py-2 border rounded" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">البريد الإلكتروني أو رقم الهاتف</label>
                            <input className="w-full px-4 py-2 border rounded" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">كلمة المرور</label>
                            <input type="password" className="w-full px-4 py-2 border rounded" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">الهاتف (اختياري)</label>
                            <input className="w-full px-4 py-2 border rounded" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>

                        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded">إلغاء</button>
                            <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded">{loading ? 'جاري الإنشاء...' : 'إنشاء مدرسة'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}