
// Mock Data Generators for robust analytics

export const generateMockSchools = (count = 5) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `school-${i + 1}`,
        name: `مدرسة الريان - فرع ${i + 1}`,
        studentsCount: Math.floor(Math.random() * 200) + 50,
        teachersCount: Math.floor(Math.random() * 10) + 2,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        attendanceRate: (Math.random() * 20 + 80).toFixed(1), // 80% - 100%
        riskCount: Math.floor(Math.random() * 10),
        performance: Array.from({ length: 6 }).map((_, j) => ({
            month: `Month ${j + 1}`,
            value: Math.floor(Math.random() * 100)
        }))
    }));
};

export const generateMockTeachers = (count = 10) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `teacher-${i}`,
        name: `الأستاذ ${i + 1}`,
        students: Math.floor(Math.random() * 30) + 10,
        rating: (Math.random() * 1 + 4).toFixed(1),
        performance: Math.floor(Math.random() * 100),
        commitment: Math.floor(Math.random() * 100)
    }));
};

export const generateDailyStats = () => {
    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    return days.map(d => ({
        day: d,
        attendance: Math.floor(Math.random() * 50) + 150,
        absence: Math.floor(Math.random() * 20),
        performance: Math.floor(Math.random() * 100)
    }));
};

export const generateMockStudents = (count = 20) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `student-${i}`,
        firstName: ['أحمد', 'محمد', 'علي', 'عمر', 'إبراهيم'][Math.floor(Math.random() * 5)],
        lastName: ['المنصور', 'العلي', 'سعيد', 'حسن', 'خالد'][Math.floor(Math.random() * 5)],
        phone: `055${Math.floor(Math.random() * 10000000)}`,
        parentPhone: `066${Math.floor(Math.random() * 10000000)}`,
        currentHizb: Math.floor(Math.random() * 60),
        currentQuarter: Math.floor(Math.random() * 8),
        currentStars: Math.floor(Math.random() * 5),
        currentWeeklyRating: Math.floor(Math.random() * 10),
        weeklyPoints: Math.floor(Math.random() * 50) + 50,
        isFrozen: Math.random() < 0.1,
        parentLinkToken: `token-${Math.random().toString(36).substring(7)}`,

        // Mock Relations
        weeklyEvaluations: Array.from({ length: 12 }).map((_, w) => ({
            id: `eval-${w}`,
            weekStartDate: new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalPoints: Math.floor(Math.random() * 100),
            rating: Math.floor(Math.random() * 5) + 5
        })),

        attendance: Array.from({ length: 10 }).map((_, d) => ({
            id: `att-${d}`,
            date: new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString(),
            status: Math.random() > 0.2 ? 'PRESENT' : 'ABSENT'
        })),

        notes: [
            { id: 'n1', content: 'طالب مجتهد ومثابر، بارك الله فيه.', createdAt: new Date().toISOString() }
        ],
        deductions: [],

        weeklyRating: Math.floor(Math.random() * 5) + 5
    }));
};

// Heatmap Data Generator
export const generateHeatmapData = () => {
    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    return days.map(day => ({
        day,
        hour0: Math.floor(Math.random() * 30) + 10,
        hour1: Math.floor(Math.random() * 40) + 20,
        hour2: Math.floor(Math.random() * 50) + 30,
        hour3: Math.floor(Math.random() * 35) + 15,
        hour4: Math.floor(Math.random() * 25) + 10
    }));
};

// Scatter Plot Data Generator
export const generateScatterData = () => {
    return Array.from({ length: 20 }).map((_, i) => ({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        z: Math.floor(Math.random() * 200) + 50,
        name: `طالب ${i + 1}`
    }));
};

// Grouped Bar Data Generator
export const generateGroupedBarData = () => {
    const categories = ['الحفظ', 'التلاوة', 'التجويد', 'الحضور', 'السلوك'];
    return categories.map(cat => ({
        name: cat,
        الأسبوع_الأول: Math.floor(Math.random() * 100),
        الأسبوع_الثاني: Math.floor(Math.random() * 100),
        الأسبوع_الثالث: Math.floor(Math.random() * 100),
        الأسبوع_الرابع: Math.floor(Math.random() * 100)
    }));
};
