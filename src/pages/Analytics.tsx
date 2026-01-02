import React, { useState, useEffect } from 'react';
import { DashboardCharts } from '@/components/AdminCharts';

const Analytics = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
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

    const dailyData = data?.dailyAttendance || [];
    const regionData = data?.studentDistribution || [];
    const heatmapData = data?.heatmapData || [];
    const scatterData = data?.scatterData || [];
    const groupedBarData = data?.groupedBarData || [];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">التحليلات المتقدمة</h2>
                    <p className="text-slate-400">رؤى تفصيلية حول أداء المدارس والطلاب</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700">أسبوعي</button>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">شهري</button>
                    <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700">سنوي</button>
                </div>
            </div>

            {/* Top Row: Big Chart + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-96">
                    <h3 className="text-lg font-bold text-white mb-6">مؤشر الحضور اليومي</h3>
                    <DashboardCharts.TrendLine data={dailyData} dataKey="attendance" name="الحضور" color="#10b981" />
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-96">
                    <h3 className="text-lg font-bold text-white mb-6">توزيع الطلاب حسب المدرسة</h3>
                    <DashboardCharts.DistributionPie data={regionData} />
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">مقارنة الأداء مقابل الغياب</h3>
                    <DashboardCharts.ComparisonBar
                        data={dailyData}
                        xKey="day"
                        barKeys={[
                            { key: 'performance', name: 'الأداء (%)', color: '#8b5cf6' },
                            { key: 'absence', name: 'الغياب', color: '#f43f5e' }
                        ]}
                    />
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">تحليل الأداء المركب</h3>
                    <DashboardCharts.ComposedAnalytics
                        data={dailyData}
                        xKey="day"
                        barKey="performance"
                        lineKey="absence"
                    />
                </div>
            </div>

            {/* New Charts Row: Donut + Grouped Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">التوزيع الدائري للمدارس</h3>
                    <DashboardCharts.DonutChart data={regionData} />
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">مقارنة الأداء الأسبوعي</h3>
                    <DashboardCharts.GroupedBar
                        data={groupedBarData}
                        xKey="name"
                        barKeys={[
                            { key: 'week1', name: 'الأسبوع 1', color: '#10b981' },
                            { key: 'week2', name: 'الأسبوع 2', color: '#3b82f6' },
                            { key: 'week3', name: 'الأسبوع 3', color: '#f59e0b' },
                            { key: 'week4', name: 'الأسبوع 4', color: '#8b5cf6' }
                        ]}
                    />
                </div>
            </div>

            {/* Advanced Analytics Row: Heatmap + Scatter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">خريطة الحرارة - الحضور حسب اليوم</h3>
                    <DashboardCharts.Heatmap data={heatmapData} />
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">تحليل الانتشار - الأداء مقابل الحضور</h3>
                    <DashboardCharts.ScatterPlot
                        data={scatterData}
                        xKey="x"
                        yKey="y"
                        zKey="z"
                        color="#10b981"
                    />
                </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-96">
                <h3 className="text-lg font-bold text-white mb-6">مقارنة المدارس - أفقي</h3>
                <DashboardCharts.HorizontalBar
                    data={dailyData.slice(0, 5)}
                    xKey="day"
                    barKeys={[
                        { key: 'attendance', name: 'الحضور', color: '#10b981' },
                        { key: 'absence', name: 'الغياب', color: '#f43f5e' }
                    ]}
                />
            </div>
        </div>
    );
};

export default Analytics;
