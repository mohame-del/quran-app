import { 
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';

// أنواع البيانات
interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  hizb?: number;
  quarter?: number;
  fatherPhone?: string;
  totalPoints?: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
  yearlyPoints?: number;
  attendanceHistory?: any[];
  presentationHistory?: any[];
  weeklyRating?: number;
  monthlyRating?: number;
  yearlyRating?: number;
  stars?: number;
  notes?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface Evaluation {
  studentId: string;
  rating: number;
  notes: string;
  createdAt?: Date;
}

// إضافة طالب جديد
export const addStudent = async (studentData: Student) => {
  try {
    console.log('إضافة طالب جديد:', studentData)
    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      // نظام النقاط
      totalPoints: 0,
      weeklyPoints: 0,
      monthlyPoints: 0,
      yearlyPoints: 0,
      // سجل الحضور والعرض
      attendanceHistory: [],
      presentationHistory: [],
      // التقييمات
      weeklyRating: 0,
      monthlyRating: 0,
      yearlyRating: 0,
      stars: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('تم إضافة الطالب بنجاح، ID:', docRef.id)
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('خطأ في إضافة الطالب:', error)
    return { success: false, error: error.message };
  }
};

// جلب جميع الطلاب
export const getStudents = async () => {
  try {
    console.log('بدء جلب الطلاب من Firebase...')
    const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const students: Student[] = [];
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() } as Student);
    });
    console.log('تم جلب الطلاب بنجاح:', students.length, 'طالب')
    return { success: true, students };
  } catch (error: any) {
    console.error('خطأ في جلب الطلاب:', error)
    return { success: false, error: error.message };
  }
};

// جلب طالب واحد
export const getStudent = async (id: string) => {
  try {
    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, student: { id: docSnap.id, ...docSnap.data() } as Student };
    } else {
      return { success: false, error: 'الطالب غير موجود' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// تحديث بيانات الطالب
export const updateStudent = async (id: string, studentData: Partial<Student>) => {
  try {
    const docRef = doc(db, 'students', id);
    await updateDoc(docRef, {
      ...studentData,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// حذف طالب
export const deleteStudent = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'students', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// إضافة تقييم جديد
export const addEvaluation = async (evaluationData: Evaluation) => {
  try {
    const docRef = await addDoc(collection(db, 'evaluations'), {
      ...evaluationData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// تسجيل الحضور
export const recordAttendance = async (studentId: string, period: 'morning' | 'evening', date: Date = new Date()) => {
  try {
    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const student = docSnap.data();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // التحقق من عدم تسجيل الحضور مرتين في نفس اليوم
    const existingAttendance = student.attendanceHistory?.find(
      (record: any) => record.date === dateStr && record.period === period
    );

    if (existingAttendance) {
      return { success: false, error: 'تم تسجيل الحضور مسبقاً' };
    }

    // إضافة سجل الحضور
    const newAttendance = {
      date: dateStr,
      period: period, // 'morning' or 'evening'
      points: 1,
      timestamp: new Date()
    };

    const updatedAttendanceHistory = [...(student.attendanceHistory || []), newAttendance];
    
    // حساب النقاط الأسبوعية
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // بداية الأسبوع (الأحد)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // نهاية الأسبوع (السبت)

    const weeklyAttendance = updatedAttendanceHistory.filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    const weeklyPoints = weeklyAttendance.reduce((sum: number, record: any) => sum + record.points, 0);

    // تحديث بيانات الطالب
    await updateDoc(docRef, {
      attendanceHistory: updatedAttendanceHistory,
      weeklyPoints: weeklyPoints,
      updatedAt: new Date()
    });

    return { success: true, weeklyPoints, message: `تم تسجيل الحضور ${period === 'morning' ? 'الصباح' : 'المساء'} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// تسجيل العرض
export const recordPresentation = async (studentId: string, date: Date = new Date()) => {
  try {
    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const student = docSnap.data();
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = new Date(date).getDay(); // 0 = الأحد, 1 = الاثنين, 2 = الثلاثاء, 3 = الأربعاء, 4 = الخميس, 5 = الجمعة, 6 = السبت
    
    // التحقق من أن اليوم هو الأحد أو الثلاثاء أو الخميس
    if (dayOfWeek !== 0 && dayOfWeek !== 2 && dayOfWeek !== 4) {
      return { success: false, error: 'العرض متاح فقط في الأحد والثلاثاء والخميس' };
    }
    
    // التحقق من عدم تسجيل العرض مرتين في نفس اليوم
    const existingPresentation = student.presentationHistory?.find(
      (record: any) => record.date === dateStr
    );

    if (existingPresentation) {
      return { success: false, error: 'تم تسجيل العرض مسبقاً' };
    }

    // إضافة سجل العرض
    const newPresentation = {
      date: dateStr,
      points: 1, // نقطة واحدة لكل يوم عرض
      timestamp: new Date()
    };

    const updatedPresentationHistory = [...(student.presentationHistory || []), newPresentation];
    
    // حساب النقاط الأسبوعية
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeklyPresentations = updatedPresentationHistory.filter((record: any) => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    const weeklyPresentationPoints = weeklyPresentations.reduce((sum: number, record: any) => sum + record.points, 0);
    const weeklyAttendancePoints = (student.weeklyPoints || 0);
    const totalWeeklyPoints = weeklyAttendancePoints + weeklyPresentationPoints;

    // حساب التقييم الأسبوعي (15 نقطة = 10 تقييم)
    const weeklyRating = Math.min(10, (totalWeeklyPoints / 15) * 10);

    // تحديث بيانات الطالب
    await updateDoc(docRef, {
      presentationHistory: updatedPresentationHistory,
      weeklyPoints: totalWeeklyPoints,
      weeklyRating: weeklyRating,
      stars: Math.floor(weeklyRating / 2), // 5 نجوم = 10 تقييم
      updatedAt: new Date()
    });

    return { success: true, weeklyPoints: totalWeeklyPoints, weeklyRating };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// حساب التقييم الشهري
export const calculateMonthlyRating = async (studentId: string) => {
  try {
    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const student = docSnap.data();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // حساب أسابيع الشهر
    const weeksInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    // جمع التقييمات الأسبوعية للشهر (افتراضياً)
    const monthlyRating = student.weeklyRating || 0;

    await updateDoc(docRef, {
      monthlyRating: monthlyRating,
      updatedAt: new Date()
    });

    return { success: true, monthlyRating };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// إضافة ملاحظة للطالب
export const addStudentNote = async (studentId: string, noteText: string) => {
  try {
    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const student = docSnap.data();
    const newNote = {
      text: noteText,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date()
    };

    const updatedNotes = [...(student.notes || []), newNote];

    await updateDoc(docRef, {
      notes: updatedNotes,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// جلب تقييمات طالب معين
export const getStudentEvaluations = async (studentId: string) => {
  try {
    const q = query(
      collection(db, 'evaluations'), 
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const evaluations: Evaluation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as unknown as Evaluation;
      evaluations.push({ id: doc.id, ...data } as Evaluation);
    });
    return { success: true, evaluations };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}; 