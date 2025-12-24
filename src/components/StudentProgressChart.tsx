'use client'

import React, { useEffect, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { useTheme } from '@/context/ThemeContext'

export default function StudentProgressChart({ data }: { data: any[] }) {
    const { theme } = useTheme()
    // Need client-side only rendering for theme to match hydration?
    // Actually, simple state sync is enough or just use the theme value.
    // However, if SSR renders 'default', hydration might mismatch if local storage is 'dark'.
    // We'll rely on the context which should handle hydration (though there's a flicker potentially).

    // Define colors based on theme
    const isDark = theme === 'dark'
    const axisColor = isDark ? '#9CA3AF' : '#6B7280'
    const gridColor = isDark ? '#374151' : '#E5E7EB'
    const tooltipBg = isDark ? '#1F2937' : '#FFFFFF'
    const tooltipColor = isDark ? '#F3F4F6' : '#111827'

    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                لا توجد بيانات تقييم لعرضها
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: axisColor }}
                    domain={[0, 'auto']}
                    dx={-10}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: tooltipBg,
                        color: tooltipColor,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                    cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', r: 4, strokeWidth: 2, stroke: isDark ? '#1F2937' : '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    name="النقاط"
                    animationDuration={1000}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
