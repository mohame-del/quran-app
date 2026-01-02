'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import {
  Users, GraduationCap, BookOpen, Star, TrendingUp,
  TrendingDown, Award, AlertCircle, CheckCircle, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

// Default Data Structure matching the API/User Mock
const DEFAULT_DATA = {
  overview: {
    totalStudents: 0,
    studentsTrend: 0,
    totalTeachers: 0,
    teachersTrend: 0,
    totalSections: 0,
    sectionsTrend: 0,
    averageRating: 0,
    ratingTrend: 0
  },
  sections: [],
  monthlyProgress: []
};

// مكون البطاقة الإحصائية - محسّن
const StatCard = ({ icon: Icon, title, value, trend, suffix = '' }: any) => {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="stat-card group relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="icon-wrapper bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg">
          <Icon className="w-6 h-6" />
        </div>
        {trend !== 0 && (
          <div className={`trend-badge px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend)}%</span>
            <span className="opacity-70 font-normal hidden sm:inline">مقارنة بالشهر الماضي</span>
          </div>
        )}
      </div>
      <div className="stat-value relative z-10">
        <span className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          {value?.toLocaleString('ar-DZ') || 0}
        </span>
        {suffix && <span className="text-lg text-gray-500 mr-1">{suffix}</span>}
      </div>
      <div className="stat-title text-gray-400 text-sm font-medium relative z-10 mt-1">{title}</div>
    </div>
  );
};

// مكون شارة الحالة
const StatusBadge = ({ status }: any) => {
  const statusConfig: any = {
    excellent: { label: 'ممتاز', icon: Award, color: 'emerald' },
    good: { label: 'جيد', icon: CheckCircle, color: 'blue' },
    needs_attention: { label: 'يحتاج متابعة', icon: AlertCircle, color: 'amber' }
  };

  const config = statusConfig[status] || statusConfig['good'];
  const Icon = config.icon;

  return (
    <span className={`status-badge flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-${config.color}-500/10 text-${config.color}-500 border border-${config.color}-500/20`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

// المكون الرئيسي
export default function MySchoolDashboard() {
  const { user, loading: authLoading, currentSectionId, setSection } = useAuth();
  const [data, setData] = useState<any>(DEFAULT_DATA);
  const [fetching, setFetching] = useState(true);

  const [selectedSection, setSelectedSection] = useState('all');
  const [timeRange, setTimeRange] = useState('year');
  const [chartView, setChartView] = useState('overall'); // overall or sections

  // Sync local selectedSection with global context
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    if (currentSectionId) {
      setSelectedSection(currentSectionId);
    }
  }, [currentSectionId]);

  const handleSectionChange = (val: string) => {
    setSelectedSection(val);
    setSection(val);
  };

  // Real Data Fetching Effect
  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      const schoolId = user?.schoolId || user?.id;
      if (!user || !schoolId) {
        setFetching(false);
        return;
      }
      setFetching(true);
      try {
        const sectionParam = selectedSection !== 'all' ? `&sectionId=${selectedSection}` : '';
        const res = await fetch(`/api/my-school/stats?schoolId=${schoolId}${sectionParam}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user, authLoading, selectedSection]);

  // حساب الإحصائيات using Real Data - Unconditional Hook
  const stats = useMemo(() => {
    try {
      const sections = Array.isArray(data?.sections) ? data.sections : [];
      if (sections.length === 0) {
        return {
          filteredSections: [],
          bestSection: { name: '-', rating: 0, attendance: 0 },
          worstSection: { name: '-', rating: 0, attendance: 0 },
          mostImproved: { name: '-', improvement: 0 }
        };
      }
      const filteredSections = selectedSection === 'all'
        ? sections
        : sections.filter((s: any) => s.id === parseInt(selectedSection) || s.id === selectedSection);

      const sortedByRating = [...sections].sort((a: any, b: any) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      const bestSection = sortedByRating[0] || { name: '-', rating: 0, attendance: 0 };
      const worstSection = sortedByRating[sortedByRating.length - 1] || { name: '-', rating: 0, attendance: 0 };
      const improvements = sections.map((section: any) => ({
        ...section,
        improvement: section.rating ? ((Number(section.rating) - 4.0) / 4.0) * 100 : 0
      }));
      const mostImproved = [...improvements].sort((a: any, b: any) => (Number(b.improvement) || 0) - (Number(a.improvement) || 0))[0] || { name: '-', improvement: 0 };
      return { filteredSections, bestSection, worstSection, mostImproved };
    } catch (e) {
      return { filteredSections: [], bestSection: { name: '-', rating: 0, attendance: 0 }, worstSection: { name: '-', rating: 0, attendance: 0 }, mostImproved: { name: '-', improvement: 0 } };
    }
  }, [selectedSection, data]);

  // توزيع الأقسام حسب التقييم - Unconditional Hook
  const ratingDistribution = useMemo(() => {
    try {
      const sections = Array.isArray(data?.sections) ? data.sections : [];
      const excellent = sections.filter((s: any) => s.status === 'excellent').length;
      const good = sections.filter((s: any) => s.status === 'good').length;
      const needsAttention = sections.filter((s: any) => s.status === 'needs_attention').length;
      return [
        { name: 'ممتاز', value: excellent, color: '#10b981' },
        { name: 'جيد', value: good, color: '#3b82f6' },
        { name: 'يحتاج متابعة', value: needsAttention, color: '#f59e0b' }
      ];
    } catch (e) {
      return [{ name: 'ممتاز', value: 0, color: '#10b981' }, { name: 'جيد', value: 0, color: '#3b82f6' }, { name: 'يحتاج متابعة', value: 0, color: '#f59e0b' }];
    }
  }, [data]);

  // بيانات المخطط الراداري للمقارنة - Unconditional Hook
  const comparisonData = useMemo(() => {
    try {
      const sections = Array.isArray(data?.sections) ? data.sections : [];
      return sections.slice(0, 6).map((section: any) => ({
        section: String(section.name || 'Unknown').split(' - ')[0],
        rating: Number(section.rating || 0),
        attendance: Number(section.attendance || 0),
        presentations: Number(section.presentations || 0) > 20 ? (Number(section.presentations) / 10) : Number(section.presentations || 0)
      }));
    } catch (e) { return []; }
  }, [data]);

  // Safe Accessors for JSX
  const overview = data?.overview || DEFAULT_DATA.overview;
  const monthlyProgress = Array.isArray(data?.monthlyProgress) ? data.monthlyProgress : [];

  // 2. Early return for loading - MUST come after all hooks
  if (!isMounted || authLoading || fetching) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // 3. Final Content Return
  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          background: #0f172a; 
          color: #e2e8f0;
          min-height: 100vh;
        }
        
        .dashboard-container {
          padding: 2rem;
          max-width: 1600px;
          margin: 0 auto;
          animation: fadeIn 0.6s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Header */
        .dashboard-header {
          margin-bottom: 2.5rem;
          animation: slideDown 0.5s ease-out;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .header-title h1 {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        
        .header-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
          animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4); }
        }
        
        .header-subtitle {
          color: #94a3b8;
          font-size: 1rem;
          font-weight: 400;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .stat-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.75rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: scaleIn 0.5s ease-out backwards;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; border-top: 4px solid #10b981; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; border-top: 4px solid #3b82f6; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; border-top: 4px solid #f59e0b; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; border-top: 4px solid #8b5cf6; }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover .icon-wrapper {
          transform: rotate(10deg) scale(1.1);
        }
        
        /* Filters */
        .filters-section {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2.5rem;
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          align-items: center;
        }
        
        .filter-group {
          flex: 1;
          min-width: 200px;
        }
        
        .filter-label {
          display: block;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .filter-select {
          width: 100%;
          background: #1e293b;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #f1f5f9;
          font-family: 'Cairo', sans-serif;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: left 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-left: 2.5rem;
        }
        
        .filter-select:hover {
          border-color: #3b82f6;
          background-color: #334155;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        
        /* KPI Cards */
        .kpi-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .kpi-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        
        .kpi-card:hover { 
          transform: translateY(-3px);
          background: rgba(30, 41, 59, 0.6);
        }
        
        .chart-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 2rem;
          transition: all 0.3s ease;
        }
        
        .chart-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        
        .chart-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
        }
        
        .chart-toggle {
          display: flex;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
          padding: 0.25rem;
        }
        
        .toggle-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-family: 'Cairo', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .toggle-btn.active {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }
        
        .toggle-btn:hover:not(.active) {
          color: #e2e8f0;
          background: rgba(20, 184, 166, 0.1);
        }
        
        /* Progress Chart Full Width */
        .progress-chart {
          grid-column: 1 / -1;
        }
        
        /* Table */
        .table-container {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2.5rem;
        }
        
        .table-header {
          padding: 1.75rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .table-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table thead {
          background: rgba(15, 23, 42, 0.6);
        }
        
        .data-table th {
          padding: 1rem 1.5rem;
          text-align: right;
          font-size: 0.875rem;
          font-weight: 700;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .data-table tbody tr {
          border-bottom: 1px solid rgba(148, 163, 184, 0.05);
          transition: all 0.2s ease;
        }
        
        .data-table tbody tr:hover {
          background: rgba(20, 184, 166, 0.05);
        }
        
        .data-table td {
          padding: 1.25rem 1.5rem;
          color: #e2e8f0;
          font-size: 0.9rem;
        }
        
        .section-name {
          font-weight: 600;
          color: #f8fafc;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .status-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .status-blue {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .status-amber {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .metric-value {
          font-weight: 600;
          color: #f8fafc;
        }
        
        /* Insights */
        .insights-section {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-right: 4px solid #3b82f6;
          border-radius: 16px;
          padding: 1.75rem;
          margin-bottom: 2rem;
        }
        
        .insights-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.125rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 1rem;
        }
        
        .insights-content {
          color: #cbd5e1;
          font-size: 0.95rem;
          line-height: 1.7;
        }
        
        .insight-highlight {
          color: #3b82f6;
          font-weight: 700;
        }
        
        /* Recharts Custom Styling */
        .recharts-surface {
          border-radius: 8px;
        }
        
        .recharts-tooltip-wrapper {
          outline: none;
        }
        
        .custom-tooltip {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .tooltip-label {
          color: #f8fafc;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .tooltip-item {
          color: #cbd5e1;
          font-size: 0.85rem;
          margin: 0.25rem 0;
        }
        
        .tooltip-value {
          color: #14b8a6;
          font-weight: 700;
          margin-right: 0.5rem;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 1.5rem;
          }
          
          .header-title h1 {
            font-size: 2rem;
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .header-title h1 {
            font-size: 1.75rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .filters-section {
            flex-direction: column;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .kpi-section {
            grid-template-columns: 1fr;
          }
          
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .data-table {
            font-size: 0.85rem;
          }
          
          .data-table th,
          .data-table td {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>

        {/* Header */}
        <div className="dashboard-header">
          <div className="header-title">
            <div className="header-icon">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1>{selectedSection === 'all' ? 'لوحة تحكم مدرستي' : `لوحة تحكم: ${data?.overview?.sectionName || 'القسم'}`}</h1>
          </div>
          <div className="flex justify-between items-center w-full">
            <p className="header-subtitle">
              <Calendar className="inline w-4 h-4 ml-1" />
              {selectedSection === 'all'
                ? 'نظرة شاملة على أداء المدرسة القرآنية - العام الدراسي 1446هـ'
                : `نظرة تفصيلية على أداء قسم ${data?.overview?.sectionName || ''}`}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard
            icon={Users}
            title="إجمالي الطلبة"
            value={overview.totalStudents}
            trend={overview.studentsTrend}
          />
          <StatCard
            icon={GraduationCap}
            title="إجمالي المدرسين"
            value={overview.totalTeachers}
            trend={overview.teachersTrend}
          />
          <StatCard
            icon={BookOpen}
            title="عدد الأقسام"
            value={overview.totalSections}
            trend={overview.sectionsTrend}
          />
          <StatCard
            icon={Star}
            title="متوسط التقييم"
            value={overview.averageRating}
            trend={overview.ratingTrend}
            suffix="/5"
          />
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label className="filter-label">اختر القسم</label>
            <select
              className="filter-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="all">جميع الأقسام</option>
              {data.sections.map((section: any) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">الفترة الزمنية</label>
            <select
              className="filter-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="month">الشهر الحالي</option>
              <option value="quarter">الربع الأخير</option>
              <option value="semester">نصف العام</option>
              <option value="year">السنة الكاملة</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-section">
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon">
                <Award className="w-5 h-5" />
              </div>
              <span className="kpi-title">أفضل قسم</span>
            </div>
            <div className="kpi-value">{stats.bestSection.name}</div>
            <div className="kpi-description">
              تقييم {stats.bestSection.rating}/5 • حضور {stats.bestSection.attendance}%
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="kpi-title">الأكثر تحسنًا</span>
            </div>
            <div className="kpi-value">{stats.mostImproved.name}</div>
            <div className="kpi-description">
              تحسن بنسبة {stats.mostImproved.improvement?.toFixed(1) || 0}% خلال الأشهر الأخيرة
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="kpi-title">يحتاج انتباه</span>
            </div>
            <div className="kpi-value">{stats.worstSection.name}</div>
            <div className="kpi-description">
              تقييم {stats.worstSection.rating}/5 • حضور {stats.worstSection.attendance}%
            </div>
          </div>
        </div>

        {/* Progress Chart - Full Width - Enhanced Curved Area Chart */}
        <div className="charts-grid">
          <div className="chart-card progress-chart relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div className="chart-header flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">تحليل الأداء الزمني</h3>
                <p className="text-sm text-gray-400">تتبع تطور التقييم والحضور عبر الشهور</p>
              </div>
              <div className="chart-toggle bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 backdrop-blur-sm">
                <button
                  className={`toggle-btn px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${chartView === 'overall' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setChartView('overall')}
                >
                  التقييم العام
                </button>
                <button
                  className={`toggle-btn px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${chartView === 'attendance' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  onClick={() => setChartView('attendance')}
                >
                  معدل الحضور
                </button>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyProgress} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={chartView === 'overall' ? [0, 5] : [0, 100]}
                    dx={-10}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 p-4 rounded-xl shadow-2xl">
                            <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${chartView === 'overall' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                              <div>
                                <p className="text-white font-bold text-lg leading-none">
                                  {payload[0].value}
                                  <span className="text-xs text-gray-500 font-normal mr-1">
                                    {chartView === 'overall' ? '/ 5' : '%'}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {chartView === 'overall' ? 'متوسط التقييم' : 'نسبة الحضور'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartView === 'overall' ? 'rating' : 'attendance'}
                    stroke={chartView === 'overall' ? '#10b981' : '#3b82f6'}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill={chartView === 'overall' ? 'url(#colorRating)' : 'url(#colorAttendance)'}
                    animationDuration={1500}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Comparison Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Radar Chart - Comparison */}
          <div className="chart-card relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="chart-header mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">تحليل المقارنة الراداري</h3>
                <p className="text-xs text-gray-400 mt-1">مقارنة شاملة بين أفضل الأقسام أداءً</p>
              </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="section" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="rgba(255,255,255,0.1)" tick={false} />
                  <Radar
                    name="التقييم"
                    dataKey="rating"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="الحضور"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '13px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart - Distribution */}
          <div className="chart-card relative overflow-hidden group hover:border-amber-500/30 transition-all duration-500">
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
            <div className="chart-header mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">توزيع كفاءة الأقسام</h3>
                <p className="text-xs text-gray-400 mt-1">تصنيف الأقسام حسب مستويات الأداء</p>
              </div>
            </div>
            <div className="h-[350px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    cornerRadius={6}
                    stroke="none"
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-gray-700 shadow-xl">
                            <p className="text-white font-bold mb-1">{payload[0].name}</p>
                            <p className="text-gray-400 text-sm">{payload[0].value} قسم</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-400 text-sm mx-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-white">{data?.sections?.length || 0}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">إجمالي الأقسام</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sections Table - Modern Glass Table */}
        <div className="table-container bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">تفاصيل أداء الأقسام</h3>
              <p className="text-sm text-gray-400 mt-1">بيانات تفصيلية لجميع الأقسام المسجلة</p>
            </div>
            <button className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
              تصدير التقرير
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 text-right">
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">اسم القسم</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">عدد الطلبة</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">التقييم العام</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">نسبة الحضور</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">العروض</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.filteredSections.map((section: any) => (
                  <tr key={section.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs group-hover:bg-emerald-500 group-hover:text-white transition-all">
                          {section.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-200 group-hover:text-white transition-colors">{section.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-mono">{section.students}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{section.rating}</span>
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${(Number(section.rating) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${Number(section.attendance) >= 90 ? 'text-emerald-400 bg-emerald-400/10' : Number(section.attendance) >= 75 ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {section.attendance}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-mono">{section.presentations}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={section.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="insights-section">
          <div className="insights-title">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            تحليل ذكي
          </div>
          <div className="insights-content">
            القسم <span className="insight-highlight">{stats.mostImproved.name}</span> حقق أعلى تحسن بنسبة{' '}
            <span className="insight-highlight">{stats.mostImproved.improvement?.toFixed(1) || 0}%</span> خلال الأشهر الثلاثة الأخيرة.
            يوصى بمتابعة القسم <span className="insight-highlight">{stats.worstSection.name}</span> وتقديم الدعم اللازم لتحسين الأداء.
            معدل الحضور الإجمالي للمدرسة ممتاز بنسبة{' '}
            <span className="insight-highlight">
              {stats.filteredSections.length > 0
                ? (stats.filteredSections.reduce((acc: any, s: any) => acc + s.attendance, 0) / stats.filteredSections.length).toFixed(1)
                : 0}%
            </span>.
          </div>
        </div>
      </div>
    </>
  );
}
