import React, { useState, useEffect } from 'react';
import { Users, School, ArrowUp, ArrowDown, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardCharts } from '@/components/AdminCharts';

const StatCard = ({ title, value, change, isPositive, icon: Icon, colorClass }: any) => (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-all duration-300 group hover:shadow-xl hover:shadow-emerald-500/5">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-').replace('/10', '')} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} bg-slate-950/50 px-2 py-1 rounded-lg`}>
                {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {change}%
            </div>
        </div>
        <h3 className="text-slate-400 text-sm mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform origin-right">{value}</p>
    </div>
);

const Index = () => {
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch stats
            const statsRes = await fetch('/api/admin/stats');
            const statsData = await statsRes.json();
            if (statsData.success) {
                setStats(statsData.data);
            }

            // Fetch analytics for charts
            const analyticsRes = await fetch('/api/admin/analytics');
            const analyticsData = await analyticsRes.json();
            if (analyticsData.success) {
                setAnalytics(analyticsData.data);
            }

            // Fetch schools for activity feed
            const schoolsRes = await fetch('/api/admin/schools');
            const schoolsData = await schoolsRes.json();
            if (schoolsData.success) {
                setSchools(schoolsData.schools.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const statsCards = [
        {
            title: 'إجمالي الطلاب',
            value: stats?.totalStudents || '0',
            change: stats?.trends?.students || 0,
            isPositive: true,
            icon: Users,
            colorClass: 'bg-emerald-500'
        },
        {
            title: 'المدارس النشطة',
            value: stats?.totalSchools || '0',
            change: 4.2,
            isPositive: true,
            icon: School,
            colorClass: 'bg-blue-500'
        },
        {
            title: 'نسبة الحضور',
            value: `${stats?.attendanceRate || 0}%`,
            change: stats?.trends?.attendance || 0,
            isPositive: (stats?.trends?.attendance || 0) >= 0,
            icon: TrendingUp,
            colorClass: 'bg-amber-500'
        },
        {
            title: 'الطلاب في خطر',
            value: stats?.studentsAtRisk || '0',
            change: 8.5,
            isPositive: false,
            icon: AlertCircle,
            colorClass: 'bg-rose-500'
        },
    ];

    const chartData = analytics?.dailyAttendance?.map((d: any) => ({
        name: d.day,
        value: d.attendance
    })) || [];

    const performanceData = analytics?.dailyAttendance?.map((d: any) => ({
        name: d.day,
        الحضور: d.attendance,
        الأداء: d.performance
    })) || [];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">لوحة القيادة</h2>
                <p className="text-slate-400">ملخص سريع لما يحدث في مدارس الريّان</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Main Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-96 relative overflow-hidden hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 z-10">
                    <h3 className="text-lg font-bold text-white mb-1">نمو الطلاب والمدارس</h3>
                    <p className="text-slate-500 text-sm">مقارنة الأداء خلال الأسبوع الحالي</p>
                </div>
                <DashboardCharts.TrendLine data={chartData} dataKey="value" name="النمو" color="#3b82f6" />
            </div>

            {/* Performance Comparison */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-96">
                <h3 className="text-lg font-bold text-white mb-6">مقارنة الحضور والأداء</h3>
                <DashboardCharts.ComparisonBar
                    data={performanceData}
                    xKey="name"
                    barKeys={[
                        { key: 'الحضور', name: 'الحضور', color: '#10b981' },
                        { key: 'الأداء', name: 'الأداء', color: '#8b5cf6' }
                    ]}
                />
            </div>

            {/* Recent Activity or Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        أحدث النشاطات
                    </h3>
                    <div className="space-y-4">
                        {schools.map((school, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-medium">{school.studentsCount} طالب في {school.name}</h4>
                                    <p className="text-slate-500 text-sm">نسبة الحضور: {school.attendanceRate}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 border-l-4 border-l-rose-500 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        تنبيهات المخاطر
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                            <AlertCircle className="text-rose-400" size={24} />
                            <div>
                                <p className="text-white font-semibold">{stats?.studentsAtRisk || 0} طالب في خطر</p>
                                <p className="text-slate-400 text-sm">يحتاجون لتدخل عاجل بسبب انخفاض الحضور</p>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-4 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all hover:shadow-lg hover:shadow-rose-500/20 font-semibold">
                        عرض تحليل المخاطر الكامل
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Index;
