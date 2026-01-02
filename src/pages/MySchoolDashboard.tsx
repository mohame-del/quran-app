import dynamic from 'next/dynamic';
import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Users, GraduationCap, BookOpen, Star, TrendingUp,
  TrendingDown, Award, AlertCircle, CheckCircle, Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Default initial state matching the structure
const INITIAL_DATA = {
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

// مكون البطاقة الإحصائية
const StatCard = ({ icon: Icon, title, value, trend, suffix = '' }: any) => {
  const isPositive = trend > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="icon-wrapper">
          <Icon className="w-6 h-6" />
        </div>
        {trend !== 0 && (
          <div className={`trend-badge ${isPositive ? 'trend-up' : 'trend-down'}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="stat-value">
        {value.toLocaleString('ar-DZ')}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </div>
      <div className="stat-title">{title}</div>
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
    <span className={`status-badge status-${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

// المكون الرئيسي
function MySchoolDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);

  const [selectedSection, setSelectedSection] = useState('all');
  const [timeRange, setTimeRange] = useState('year');
  const [chartView, setChartView] = useState('overall'); // overall or sections

  // Fetch Real Data
  useEffect(() => {
    async function fetchData() {
      if (!(user as any)?.schoolId) return;

      try {
        const res = await fetch(`/api/my-school/stats?schoolId=${(user as any).schoolId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const sections = data.sections || [];
    const filteredSections = selectedSection === 'all'
      ? sections
      : sections.filter((s: any) => s.id === selectedSection);

    // Safety checks for empty data
    const sortedByRating = [...sections].sort((a: any, b: any) => b.rating - a.rating);
    const bestSection = sortedByRating[0] || { name: '-', rating: 0, attendance: 0 };
    const worstSection = sortedByRating[sortedByRating.length - 1] || { name: '-', rating: 0, attendance: 0 };

    // حساب التحسن (مقارنة أول 3 أشهر بآخر 3 أشهر)
    const improvements = sections.map((section: any) => ({
      ...section,
      improvement: section.rating ? ((section.rating - 4.0) / 4.0) * 100 : 0 // Mock calc if no history in section obj yet
    }));
    const mostImproved = [...improvements].sort((a: any, b: any) => b.improvement - a.improvement)[0] || { name: '-', improvement: 0 };

    return { filteredSections, bestSection, worstSection, mostImproved };
  }, [selectedSection, data]);

  // توزيع الأقسام حسب التقييم
  const ratingDistribution = useMemo(() => {
    const sections = data.sections || [];
    const excellent = sections.filter((s: any) => s.status === 'excellent').length;
    const good = sections.filter((s: any) => s.status === 'good').length;
    const needsAttention = sections.filter((s: any) => s.status === 'needs_attention').length;

    return [
      { name: 'ممتاز', value: excellent, color: '#10b981' },
      { name: 'جيد', value: good, color: '#3b82f6' },
      { name: 'يحتاج متابعة', value: needsAttention, color: '#f59e0b' }
    ];
  }, [data]);

  // بيانات المخطط الراداري للمقارنة
  const comparisonData = useMemo(() => {
    return (data.sections || []).slice(0, 6).map((section: any) => ({
      section: section.name.includes('-') ? section.name.split(' - ')[0] : section.name,
      rating: section.rating,
      attendance: section.attendance,
      presentations: (section.presentations || 0) > 10 ? (section.presentations / 10) : section.presentations // Scaling
    }));
  }, [data]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">جاري التحميل...</div>
  }

  return (
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
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
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
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        
        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(20, 184, 166, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .header-subtitle {
          color: #94a3b8;
          font-size: 1rem;
          font-weight: 400;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 1.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          animation: scaleIn 0.5s ease-out backwards;
        }
        
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #14b8a6, #0d9488);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(20, 184, 166, 0.3);
          box-shadow: 0 20px 40px rgba(20, 184, 166, 0.15);
        }
        
        .stat-card:hover::before {
          transform: scaleX(1);
        }
        
        .icon-wrapper {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #14b8a6;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover .icon-wrapper {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(13, 148, 136, 0.2) 100%);
          transform: rotate(5deg) scale(1.1);
        }
        
        .stat-value {
          font-size: 2.25rem;
          font-weight: 900;
          color: #f8fafc;
          margin: 0.75rem 0 0.5rem;
          line-height: 1;
        }
        
        .stat-suffix {
          font-size: 1.25rem;
          color: #94a3b8;
          margin-right: 0.25rem;
        }
        
        .stat-title {
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .trend-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .trend-up {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .trend-down {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        /* Filters */
        .filters-section {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
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
          color: #cbd5e1;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .filter-select {
          width: 100%;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #e2e8f0;
          font-family: 'Cairo', sans-serif;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .filter-select:hover {
          border-color: rgba(20, 184, 166, 0.4);
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }
        
        /* KPI Cards */
        .kpi-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .kpi-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(13, 148, 136, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(30%, -30%);
        }
        
        .kpi-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .kpi-icon {
          width: 40px;
          height: 40px;
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
        }
        
        .kpi-title {
          color: #cbd5e1;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .kpi-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 0.5rem;
        }
        
        .kpi-description {
          color: #94a3b8;
          font-size: 0.875rem;
        }
        
        /* Charts Section */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 2rem;
          margin-bottom: 2.5rem;
        }
        
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .chart-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 1.75rem;
          transition: all 0.3s ease;
        }
        
        .chart-card:hover {
          border-color: rgba(20, 184, 166, 0.2);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
          <h1>لوحة تحكم مدرستي</h1>
        </div>
        <p className="header-subtitle">
          <Calendar className="inline w-4 h-4 ml-1" />
          نظرة شاملة على أداء المدرسة القرآنية - العام الدراسي 1446هـ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          title="إجمالي الطلبة"
          value={data.overview.totalStudents}
          trend={data.overview.studentsTrend}
        />
        <StatCard
          icon={GraduationCap}
          title="إجمالي المدرسين"
          value={data.overview.totalTeachers}
          trend={data.overview.teachersTrend}
        />
        <StatCard
          icon={BookOpen}
          title="عدد الأقسام"
          value={data.overview.totalSections}
          trend={data.overview.sectionsTrend}
        />
        <StatCard
          icon={Star}
          title="متوسط التقييم"
          value={data.overview.averageRating}
          trend={data.overview.ratingTrend}
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
            {(data.sections || []).map((section: any) => (
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
            تحسن بنسبة {stats.mostImproved.improvement.toFixed(1)}% خلال الأشهر الأخيرة
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

      {/* Progress Chart - Full Width - MODIFIED FOR USER REQUEST */}
      <div className="charts-grid">
        <div className="chart-card progress-chart">
          <div className="chart-header">
            <h3 className="chart-title">منحنى تطور المدرسة عبر العام</h3>
            <div className="chart-toggle">
              <button
                className={`toggle-btn ${chartView === 'overall' ? 'active' : ''}`}
                onClick={() => setChartView('overall')}
              >
                التقييم العام
              </button>
              <button
                className={`toggle-btn ${chartView === 'attendance' ? 'active' : ''}`}
                onClick={() => setChartView('attendance')}
              >
                معدل الحضور
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={true} horizontal={true} />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                style={{ fontSize: '12px', fontFamily: 'Cairo' }}
                tickMargin={10}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={chartView === 'overall' ? [0, 10] : [0, 100]} // Strict design uses full range
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 border-none rounded-lg p-3 text-white shadow-xl">
                        <div className="font-bold mb-1">{payload[0].payload.month}</div>
                        {chartView === 'overall' && (
                          <div className="text-blue-400">
                            التقييم: <span className="font-bold">{payload[0].value}</span>
                          </div>
                        )}
                        {chartView === 'attendance' && (
                          <div className="text-green-400">
                            الحضور: <span className="font-bold">{payload[0].value}%</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey={chartView === 'overall' ? 'rating' : 'attendance'}
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#1e293b", stroke: "#3b82f6" }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#60a5fa" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Bar Chart - Students per Section */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">عدد الطلبة في كل قسم</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.filteredSections}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                style={{ fontSize: '0.75rem', fontFamily: 'Cairo' }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#94a3b8" style={{ fontSize: '0.85rem' }} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-label">{payload[0].payload.name}</div>
                        <div className="tooltip-item">
                          <span className="tooltip-value">{payload[0].value}</span>
                          طالب
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="students" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Rating Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">توزيع الأقسام حسب التقييم</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-label">{payload[0].name}</div>
                        <div className="tooltip-item">
                          <span className="tooltip-value">{payload[0].value}</span>
                          قسم
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart - Section Comparison */}
      <div className="charts-grid">
        <div className="chart-card progress-chart">
          <div className="chart-header">
            <h3 className="chart-title">مقارنة شاملة للأقسام (أول 6 أقسام)</h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
              <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
              <PolarAngleAxis
                dataKey="section"
                stroke="#cbd5e1"
                style={{ fontSize: '0.85rem', fontFamily: 'Cairo' }}
              />
              <PolarRadiusAxis stroke="#94a3b8" />
              <Radar
                name="التقييم"
                dataKey="rating"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.3}
              />
              <Radar
                name="الحضور"
                dataKey="attendance"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{value}</span>}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-label">{payload[0].payload.section}</div>
                        {payload.map((item, idx) => (
                          <div key={idx} className="tooltip-item">
                            <span className="tooltip-value" style={{ color: item.color }}>
                              {item.value}
                            </span>
                            {item.name}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sections Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">تفاصيل الأقسام</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>اسم القسم</th>
              <th>عدد الطلبة</th>
              <th>التقييم</th>
              <th>الحضور</th>
              <th>العروض</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {(stats.filteredSections || []).map((section: any) => (
              <tr key={section.id}>
                <td className="section-name">{section.name}</td>
                <td className="metric-value">{section.students}</td>
                <td className="metric-value">{section.rating}/5</td>
                <td className="metric-value">{section.attendance}%</td>
                <td className="metric-value">{section.presentations}</td>
                <td>
                  <StatusBadge status={section.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <div className="insights-title">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          تحليل ذكي
        </div>
        <div className="insights-content">
          القسم <span className="insight-highlight">{stats.mostImproved.name}</span> حقق أعلى تحسن بنسبة{' '}
          <span className="insight-highlight">{stats.mostImproved.improvement.toFixed(1)}%</span> خلال الأشهر الثلاثة الأخيرة.
          {(stats.worstSection.rating > 0) ? (
            <>يوصى بمتابعة القسم <span className="insight-highlight">{stats.worstSection.name}</span> وتقديم الدعم اللازم لتحسين الأداء.</>
          ) : (
            <>لا توجد أقسام متعثرة حاليًا.</>
          )}
          معدل الحضور الإجمالي للمدرسة ممتاز.
        </div>
      </div>
    </div >
  );
}

export default dynamic(() => Promise.resolve(MySchoolDashboard), {
  ssr: false
});
