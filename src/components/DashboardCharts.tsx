'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardChartsProps {
    students: any[]
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ students }) => {
    // 1. Prepare Data for Bar Chart (Top 5 Students)
    const topStudents = [...students]
        .sort((a, b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0))
        .slice(0, 5)
        .map(s => ({
            name: s.firstName + ' ' + s.lastName.split(' ')[0], // Short name
            points: s.weeklyPoints || 0
        }))

    // 2. Prepare Data for Pie Chart (Attendance Today)
    const morningCount = students.filter(s => s.attendance?.some((a: any) =>
        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'MORNING'
    )).length

    const eveningCount = students.filter(s => s.attendance?.some((a: any) =>
        new Date(a.date).toDateString() === new Date().toDateString() && a.period === 'EVENING'
    )).length

    const absentCount = students.length - (morningCount + eveningCount) // Rough estimate of fully absent? Or just sum periods?
    // Actually, let's just show Morning vs Evening vs None?
    // A student can be present in both. 
    // Let's do: "Attendance participation"
    const attendanceData = [
        { name: 'صباحي', value: morningCount },
        { name: 'مسائي', value: eveningCount },
        { name: 'غياب/غير مسجل', value: Math.max(0, students.length - Math.max(morningCount, eveningCount)) }
    ]

    const COLORS = ['#10B981', '#8B5CF6', '#E5E7EB'];
    const DARK_COLORS = ['#34D399', '#A78BFA', '#374151'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">أفضل 5 طلاب (لهذا الأسبوع)</h3>
                <div className="h-64 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topStudents}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="points" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">توزيع الحضور اليوم</h3>
                <div className="h-64 w-full flex items-center justify-center" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={attendanceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {attendanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span> صباحي</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-1"></span> مسائي</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 mr-1"></span> غير مسجل</div>
                </div>
            </div>
        </div>
    )
}
