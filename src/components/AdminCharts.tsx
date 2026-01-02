import React from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis
} from 'recharts';

// Theme Colors
const COLORS = {
    emerald: '#10b981',
    emeraldLight: '#34d399',
    rose: '#f43f5e',
    amber: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    slate: '#64748b',
    grid: '#334155',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    pink: '#ec4899',
    indigo: '#6366f1'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-sm">
                <p className="text-slate-300 text-sm mb-2">{label}</p>
                {payload.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm font-semibold">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span style={{ color: p.color }}>{p.name}: {p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const DashboardCharts = {
    // Line Chart for Trends
    TrendLine: ({ data, dataKey, color = COLORS.emerald, name }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#grad-${name})`} strokeWidth={3} name={name} />
            </AreaChart>
        </ResponsiveContainer>
    ),

    // Bar Chart for Comparisons
    ComparisonBar: ({ data, xKey, barKeys }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} opacity={0.3} />
                <XAxis dataKey={xKey} stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend />
                {barKeys.map((k: any, idx: number) => (
                    <Bar
                        key={k.key}
                        dataKey={k.key}
                        name={k.name}
                        fill={k.color}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    ),

    // Pie Chart for Distribution
    DistributionPie: ({ data }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    ),

    // Donut Chart (similar to Pie but with different styling)
    DonutChart: ({ data }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                >
                    {data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    ),

    // Horizontal Bar Chart
    HorizontalBar: ({ data, xKey, barKeys }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} opacity={0.3} />
                <XAxis type="number" stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <YAxis dataKey={xKey} type="category" stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend />
                {barKeys.map((k: any) => (
                    <Bar
                        key={k.key}
                        dataKey={k.key}
                        name={k.name}
                        fill={k.color}
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    ),

    // Grouped Bar Chart
    GroupedBar: ({ data, xKey, barKeys }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} opacity={0.3} />
                <XAxis dataKey={xKey} stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <YAxis stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend />
                {barKeys.map((k: any) => (
                    <Bar
                        key={k.key}
                        dataKey={k.key}
                        name={k.name}
                        fill={k.color}
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    ),

    // Scatter Plot
    ScatterPlot: ({ data, xKey, yKey, zKey, color = COLORS.emerald }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.3} />
                <XAxis
                    dataKey={xKey}
                    stroke={COLORS.slate}
                    tick={{ fill: COLORS.slate }}
                    tickLine={false}
                    axisLine={false}
                    name="المحور X"
                />
                <YAxis
                    dataKey={yKey}
                    stroke={COLORS.slate}
                    tick={{ fill: COLORS.slate }}
                    tickLine={false}
                    axisLine={false}
                    name="المحور Y"
                />
                <ZAxis dataKey={zKey} range={[50, 400]} name="الحجم" />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                    data={data}
                    fill={color}
                    fillOpacity={0.6}
                />
            </ScatterChart>
        </ResponsiveContainer>
    ),

    // Heatmap (simulated using BarChart with custom styling)
    Heatmap: ({ data }: any) => {
        // Data should be in format: [{ day: 'السبت', hour0: 10, hour1: 20, ... }]
        const hours = Object.keys(data[0] || {}).filter(k => k !== 'day');

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" barCategoryGap={1}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.2} />
                    <XAxis type="number" stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="day" type="category" stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    {hours.map((hour, idx) => {
                        const heatColors = [COLORS.blue, COLORS.cyan, COLORS.emerald, COLORS.amber, COLORS.rose];
                        return (
                            <Bar
                                key={hour}
                                dataKey={hour}
                                stackId="a"
                                fill={heatColors[idx % heatColors.length]}
                                fillOpacity={0.7}
                            />
                        );
                    })}
                </BarChart>
            </ResponsiveContainer>
        );
    },

    // Composed Chart for Multi-Dimensional Analytics (Performance vs Absence)
    ComposedAnalytics: ({ data, xKey, barKey, lineKey }: any) => (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
                <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.3} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} opacity={0.3} />
                <XAxis dataKey={xKey} stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke={COLORS.slate} tick={{ fill: COLORS.slate }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke={COLORS.rose} tick={{ fill: COLORS.rose }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey={barKey} name="الأداء" fill="url(#colorBar)" barSize={20} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey={lineKey} name="الغياب" stroke={COLORS.rose} strokeWidth={3} dot={{ r: 4, fill: COLORS.rose }} />
            </ComposedChart>
        </ResponsiveContainer>
    )
};
