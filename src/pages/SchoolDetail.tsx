import React, { useState, useEffect } from 'react';
import { ArrowRight, School, Users, Star, MapPin, Trash2 } from 'lucide-react';
import { DashboardCharts } from '@/components/AdminCharts';

const SchoolDetail = ({ schoolId, onBack }: { schoolId: string, onBack: () => void }) => {
    const [school, setSchool] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const res = await fetch(`/api/admin/schools/${schoolId}`);
                const data = await res.json();
                if (data.success) {
                    setSchool(data.school);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchool();
    }, [schoolId]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!window.confirm('تحذير هام: سيتم حذف المدرسة وجميع الطلاب والمعلمين وجميع البيانات المرتبطة بها نهائياً. هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟')) return;

        try {
            const res = await fetch(`/api/admin/schools/${schoolId}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                alert('تم حذف المدرسة وجميع بياناتها بنجاح');
                onBack();
            } else {
                alert('فشل حذف المدرسة: ' + (data.error || 'خطأ غير معروف'));
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الاتصال بالخادم');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!school) return <div className="text-white text-center py-20">لم يتم العثور على المدرسة</div>;

    const { performanceData, gradeData } = school;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-white">{school.name}</h2>
                        <div className="flex items-center gap-4 text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Users size={14} /> مدير المدرسة: {school.manager}</span>
                            <span className="flex items-center gap-1"><MapPin size={14} /> {school.address}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-2 font-bold transition-all border border-rose-500/20"
                >
                    <Trash2 size={18} />
                    حذف المدرسة بالكامل
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm mb-1">عدد الطلاب</div>
                    <div className="text-3xl font-bold text-white">{school.stats.students}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm mb-1">المعلمين</div>
                    <div className="text-3xl font-bold text-white">{school.stats.teachers}</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm mb-1">التقييم العام</div>
                    <div className="text-3xl font-bold text-amber-400 flex items-center gap-2">
                        {school.stats.rating} <Star size={20} fill="currentColor" />
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="text-slate-400 text-sm mb-1">نسبة الحضور</div>
                    <div className="text-3xl font-bold text-emerald-400">{school.stats.attendance}%</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">الأداء الأكاديمي أسبوعياً</h3>
                    <DashboardCharts.TrendLine data={performanceData} dataKey="value" name="الأداء" color="#8b5cf6" />
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-80">
                    <h3 className="text-lg font-bold text-white mb-6">توزيع الطلاب حسب المستويات</h3>
                    <DashboardCharts.HorizontalBar
                        data={gradeData}
                        xKey="name"
                        barKeys={[{ key: 'value', name: 'الطلاب', color: '#10b981' }]}
                    />
                </div>
            </div>
        </div>
    );
};

export default SchoolDetail;
