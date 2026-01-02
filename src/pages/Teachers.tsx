import React, { useState, useEffect } from 'react';
import { Users, Star, TrendingUp, Award, BookOpen } from 'lucide-react';
import { DashboardCharts } from '@/components/AdminCharts';

const Teachers = ({ onSelect }: { onSelect: (id: string) => void }) => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/admin/teachers');
            const data = await res.json();
            if (data.success) {
                setTeachers(data.teachers);
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Generate performance data for chart
    const performanceData = teachers.slice(0, 5).map(t => ({
        name: t.name,
        performance: t.performance,
        commitment: t.commitment
    }));

    const totalStudents = teachers.reduce((acc, t) => acc + t.students, 0);
    const avgRating = teachers.length > 0
        ? (teachers.reduce((acc, t) => acc + parseFloat(t.rating), 0) / teachers.length).toFixed(1)
        : '0.0';
    const avgPerformance = teachers.length > 0
        ? Math.round(teachers.reduce((acc, t) => acc + t.performance, 0) / teachers.length)
        : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة المعلمين</h2>
                    <p className="text-slate-400">متابعة وتقييم أداء المعلمين</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20">
                    + إضافة معلم جديد
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Users className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">إجمالي المعلمين</p>
                            <p className="text-white text-2xl font-bold">{teachers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <BookOpen className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">إجمالي الطلاب</p>
                            <p className="text-white text-2xl font-bold">{totalStudents}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Star className="text-amber-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">متوسط التقييم</p>
                            <p className="text-white text-2xl font-bold">{avgRating}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Award className="text-purple-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">متوسط الأداء</p>
                            <p className="text-white text-2xl font-bold">{avgPerformance}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                <h3 className="text-lg font-bold text-white mb-6">مقارنة أداء المعلمين</h3>
                <DashboardCharts.ComparisonBar
                    data={performanceData}
                    xKey="name"
                    barKeys={[
                        { key: 'performance', name: 'الأداء', color: '#8b5cf6' },
                        { key: 'commitment', name: 'الالتزام', color: '#10b981' }
                    ]}
                />
            </div>

            {/* Teachers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher) => (
                    <div key={teacher.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
                        {/* Teacher Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                    {teacher.name.split(' ')[1]?.[0] || teacher.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">{teacher.name}</h3>
                                    <p className="text-slate-400 text-sm">{teacher.students} طالب</p>
                                </div>
                            </div>
                        </div>

                        {/* School Name */}
                        <div className="mb-4 text-sm text-slate-400">
                            {teacher.schoolName}
                        </div>

                        {/* Stats */}
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">التقييم</span>
                                <div className="flex items-center gap-1">
                                    <Star className="text-amber-400 fill-amber-400" size={16} />
                                    <span className="text-white font-bold">{teacher.rating}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">الأداء</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${teacher.performance}%` }}></div>
                                    </div>
                                    <span className="text-purple-400 font-bold text-sm">{teacher.performance}%</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">الالتزام</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${teacher.commitment}%` }}></div>
                                    </div>
                                    <span className="text-emerald-400 font-bold text-sm">{teacher.commitment}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => onSelect(teacher.id)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                            >
                                عرض الملف
                            </button>
                            <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20">
                                تقييم
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Teachers;
