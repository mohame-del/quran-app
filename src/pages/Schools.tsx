import React, { useState, useEffect } from 'react';
import { School, MapPin, Users, Star, TrendingUp, AlertCircle } from 'lucide-react';

const Schools = ({ onSelect }: { onSelect?: (id: string) => void }) => {
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            const res = await fetch('/api/admin/schools');
            const data = await res.json();
            if (data.success) {
                setSchools(data.schools);
            }
        } catch (error) {
            console.error('Error fetching schools:', error);
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

    const totalStudents = schools.reduce((acc, s) => acc + s.studentsCount, 0);
    const avgRating = schools.length > 0
        ? (schools.reduce((acc, s) => acc + parseFloat(s.rating), 0) / schools.length).toFixed(1)
        : '0.0';
    const totalRisk = schools.reduce((acc, s) => acc + s.riskCount, 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">المدارس القرآنية</h2>
                    <p className="text-slate-400">إدارة ومتابعة جميع فروع مدارس الريّان</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20">
                        + إضافة مدرسة جديدة
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <School className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">إجمالي المدارس</p>
                            <p className="text-white text-2xl font-bold">{schools.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="text-blue-400" size={20} />
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
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <AlertCircle className="text-rose-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">حالات الخطر</p>
                            <p className="text-white text-2xl font-bold">{totalRisk}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map((school) => (
                    <div key={school.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 group hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
                        {/* School Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                    <School className="text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{school.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                                        <MapPin size={14} />
                                        <span>{school.teacherName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-950/50 rounded-lg p-3">
                                <p className="text-slate-500 text-xs mb-1">الطلاب</p>
                                <p className="text-white font-bold text-lg">{school.studentsCount}</p>
                            </div>
                            <div className="bg-slate-950/50 rounded-lg p-3">
                                <p className="text-slate-500 text-xs mb-1">التقييم</p>
                                <p className="text-white font-bold text-lg">{school.rating}</p>
                            </div>
                        </div>

                        {/* Rating & Attendance */}
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm">نسبة الحضور</span>
                                <span className="text-emerald-400 font-bold">{school.attendanceRate}%</span>
                            </div>
                            {school.riskCount > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">حالات الخطر</span>
                                    <span className="text-rose-400 font-bold">{school.riskCount}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-1 text-emerald-400 text-sm">
                                <TrendingUp size={14} />
                                <span>أداء جيد</span>
                            </div>
                            <button
                                onClick={() => onSelect?.(school.id)}
                                className="px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-white text-sm rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 font-semibold"
                            >
                                عرض التفاصيل
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schools;
