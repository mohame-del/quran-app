'use client'

import React from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-green-600 dark:text-green-500">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">الصفحة غير موجودة</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center space-x-reverse space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium shadow-lg hover:shadow-xl mt-6"
                >
                    <Home size={20} />
                    <span>عودة للرئيسية</span>
                </Link>
            </div>
        </div>
    )
}
