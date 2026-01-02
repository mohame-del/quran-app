import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, User, Calendar, AlertCircle } from 'lucide-react';
import { DashboardCharts } from '@/components/AdminCharts';

const RiskAnalysis = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRiskData();
    }, []);

    const fetchRiskData = async () => {
        try {
            const res = await fetch('/api/admin/risk');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching risk data:', error);
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

    const riskStudents = data?.riskStudents || [];
    const riskTrends = data?.riskTrends || [];
    const summary = data?.summary || { critical: 0, high: 0, medium: 0, resolved: 0 };

    // Risk distribution for chart
    const riskDistribution = [
        { name: 'مخاطر حرجة', value: summary.critical, color: '#dc2626' },
        { name: 'مخاطر مرتفعة', value: summary.high, color: '#f59e0b' },
        { name: 'مخاطر متوسطة', value: summary.medium, color: '#eab308' },
    ];

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' };
            case 'high': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
            case 'medium': return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' };
            default: return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' };
        }
    };

    const getRiskLevelArabic = (level: string) => {
        switch (level) {
            case 'critical': return 'حرج';
            case 'high': return 'مرتفع';
            case 'medium': return 'متوسط';
            default: return 'منخفض';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <AlertTriangle className="text-rose-500" size={32} />
                    تحليل المخاطر
                </h2>
                <p className="text-slate-400 mt-2">الطلاب المعرضون لخطر التسرب أو انخفاض المستوى</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertCircle className="text-red-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">حالات حرجة</p>
                            <p className="text-white text-2xl font-bold">{summary.critical}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-orange-900/10 border border-orange-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <AlertTriangle className="text-orange-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">مخاطر مرتفعة</p>
                            <p className="text-white text-2xl font-bold">{summary.high}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <TrendingDown className="text-yellow-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">مخاطر متوسطة</p>
                            <p className="text-white text-2xl font-bold">{summary.medium}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <User className="text-emerald-400" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs">تم حلها</p>
                            <p className="text-white text-2xl font-bold">{summary.resolved}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">اتجاه المخاطر الأسبوعي</h3>
                    <DashboardCharts.ComparisonBar
                        data={riskTrends}
                        xKey="day"
                        barKeys={[
                            { key: 'newCases', name: 'حالات جديدة', color: '#f43f5e' },
                            { key: 'resolved', name: 'تم حلها', color: '#10b981' }
                        ]}
                    />
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">توزيع مستويات المخاطر</h3>
                    <DashboardCharts.DonutChart data={riskDistribution} />
                </div>
            </div>

            {/* Risk Students Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {riskStudents.map((student: any) => {
                    const colors = getRiskColor(student.riskLevel);
                    const riskLevelArabic = getRiskLevelArabic(student.riskLevel);
                    return (
                        <div key={student.id} className={`bg-slate-900/50 border ${colors.border} rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300`}>
                            <div className={`absolute top-0 right-0 w-1 h-full ${student.riskLevel === 'critical' ? 'bg-red-500' : student.riskLevel === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center ${colors.text} font-bold text-lg`}>
                                        {student.name.split(' ')[0][0]}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{student.name}</h3>
                                        <p className={`text-sm font-semibold ${colors.text}`}>مستوى خطورة {riskLevelArabic}</p>
                                    </div>
                                </div>
                                <div className={`${colors.bg} p-2 rounded-lg ${colors.text}`}>
                                    <TrendingDown size={20} />
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">معدل الغياب</span>
                                    <span className="text-white font-bold">{student.absenceRate}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div className={`${student.riskLevel === 'critical' ? 'bg-red-500' : student.riskLevel === 'high' ? 'bg-orange-500' : 'bg-yellow-500'} h-1.5 rounded-full`} style={{ width: `${student.absenceRate}%` }}></div>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">تراجع الحفظ</span>
                                    <span className="text-white font-bold">-{student.performanceDecline}%</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar size={14} />
                                    <span>آخر حضور: {student.lastAttendance}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800/50 flex gap-2">
                                <button className={`flex-1 py-2 ${student.riskLevel === 'critical' ? 'bg-red-500 hover:bg-red-600' : student.riskLevel === 'high' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded-lg text-sm font-semibold transition-colors`}>
                                    اتخاذ إجراء
                                </button>
                                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                                    ملف الطالب
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RiskAnalysis;
