"use client";
import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ChartData {
    name: string; // اليوم أو الأسبوع أو الشهر
    value: number; // النقاط
}

interface StrictLineChartProps {
    studentId?: string; // اختياري، لو للطالب
    sectionId?: string; // اختياري، لو للقسم
    schoolId?: string; // اختياري، لو للمدرسة
    type: "weekly" | "monthly" | "yearly";
}

const StrictLineChart: React.FC<StrictLineChartProps> = ({
    studentId,
    sectionId,
    schoolId,
    type,
}) => {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                if (studentId) queryParams.append("studentId", studentId);
                if (sectionId) queryParams.append("sectionId", sectionId);
                if (schoolId) queryParams.append("schoolId", schoolId);
                queryParams.append("type", type);

                const res = await fetch(`/api/admin/stats?${queryParams.toString()}`);
                const json = await res.json();

                // نتأكد من شكل البيانات: [{ name: string, value: number }]
                setData(json.data || []);
            } catch (err) {
                console.error("Error fetching chart data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [studentId, sectionId, schoolId, type]);

    if (loading) return <div className="text-white">جاري التحميل...</div>;
    if (!data.length) return <div className="text-white">لا توجد بيانات</div>;

    return (
        <div className="w-full h-64 bg-gray-900 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#2c2c2c" strokeDasharray="5 5" />
                    <XAxis
                        dataKey="name"
                        stroke="#ffffff"
                        tick={{ fill: "#ffffff" }}
                    />
                    <YAxis
                        stroke="#ffffff"
                        tick={{ fill: "#ffffff" }}
                        domain={[0, type === 'weekly' ? 5 : (type === 'monthly' ? 15 : 60)]}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "none" }}
                        itemStyle={{ color: "#ffffff" }}
                    />
                    <Line
                        type="monotone" // خط ناعم
                        dataKey="value"
                        stroke="#14b8a6" // لون التيل
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StrictLineChart;
