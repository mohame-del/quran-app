import { 
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './config.js';
import { auth } from './config.js';

// إضافة طالب جديد
export const addStudent = async (studentData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      userId: currentUser.uid, // إضافة معرف المستخدم
      createdAt: new Date(),
      updatedAt: new Date(),
      weeklyPoints: 0,
      weeklyRating: 0,
      stars: 0,
      attendanceHistory: [],
      presentationHistory: [],
      notes: [],
      isActive: true,
      isFrozen: false,
      dailyPoints: 0, // النقاط اليومية
      weeklyData: [], // بيانات الأسبوع
      monthlyData: [], // بيانات الشهر
      yearlyData: [] // بيانات السنة
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('خطأ في إضافة الطالب:', error);
    return { success: false, error: error.message };
  }
};

// جلب جميع الطلاب للمستخدم الحالي
export const getStudents = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const q = query(
      collection(db, 'students'), 
      where('userId', '==', currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, students };
  } catch (error) {
    console.error('خطأ في جلب الطلاب:', error);
    return { success: false, error: error.message };
  }
};

// جلب طالب واحد
export const getStudent = async (id) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const studentData = docSnap.data();
      // التحقق من أن الطالب ينتمي للمستخدم الحالي
      if (studentData.userId !== currentUser.uid) {
        return { success: false, error: 'غير مصرح لك بالوصول لهذا الطالب' };
      }
      return { success: true, student: { id: docSnap.id, ...studentData } };
    } else {
      return { success: false, error: 'الطالب غير موجود' };
    }
  } catch (error) {
    console.error('خطأ في جلب الطالب:', error);
    return { success: false, error: error.message };
  }
};

// تحديث طالب
export const updateStudent = async (id, updateData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const studentData = docSnap.data();
      if (studentData.userId !== currentUser.uid) {
        return { success: false, error: 'غير مصرح لك بتحديث هذا الطالب' };
      }
    }

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث الطالب:', error);
    return { success: false, error: error.message };
  }
};

// حذف طالب
export const deleteStudent = async (id) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const studentData = docSnap.data();
      // التحقق من أن الطالب ينتمي للمستخدم الحالي
      if (studentData.userId !== currentUser.uid) {
        return { success: false, error: 'غير مصرح لك بحذف هذا الطالب' };
      }
    }

    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف الطالب:', error);
    return { success: false, error: error.message };
  }
};

// تجميد/إلغاء تجميد طالب
export const toggleStudentStatus = async (id, isFrozen) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const studentData = docSnap.data();
      // التحقق من أن الطالب ينتمي للمستخدم الحالي
      if (studentData.userId !== currentUser.uid) {
        return { success: false, error: 'غير مصرح لك بتغيير حالة هذا الطالب' };
      }
    }

    await updateDoc(docRef, {
      isFrozen: isFrozen,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تغيير حالة الطالب:', error);
    return { success: false, error: error.message };
  }
};

// تسجيل الحضور
export const recordAttendance = async (studentId, period) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const studentData = docSnap.data();
    
    // التحقق من أن الطالب ينتمي للمستخدم الحالي
    if (studentData.userId !== currentUser.uid) {
      return { success: false, error: 'غير مصرح لك بتسجيل الحضور لهذا الطالب' };
    }

    // التحقق من أن الطالب غير مجمد
    if (studentData.isFrozen) {
      return { success: false, error: 'لا يمكن تسجيل الحضور للطالب المجمد' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // التحقق من عدم تسجيل الحضور لنفس اليوم والفترة
    const existingAttendance = studentData.attendanceHistory?.find(
      record => record.date === today && record.period === period
    );

    if (existingAttendance) {
      return { success: false, error: 'تم تسجيل الحضور مسبقاً لهذا اليوم' };
    }

    const newAttendance = {
      date: today,
      period: period,
      timestamp: new Date(),
      points: 1 // نقطة واحدة للحضور
    };
    
    const updatedAttendanceHistory = [...(studentData.attendanceHistory || []), newAttendance];
    const weeklyPoints = (studentData.weeklyPoints || 0) + 1;
    const dailyPoints = (studentData.dailyPoints || 0) + 1;
    
    // تحديث بيانات الأسبوع
    const currentWeek = getWeekNumber(new Date());
    const updatedWeeklyData = updateWeeklyData(studentData.weeklyData || [], currentWeek, dailyPoints);
    
    await updateDoc(docRef, {
      attendanceHistory: updatedAttendanceHistory,
      weeklyPoints: weeklyPoints,
      dailyPoints: dailyPoints,
      weeklyData: updatedWeeklyData,
      updatedAt: new Date()
    });

    return { 
      success: true, 
      weeklyPoints: weeklyPoints,
      dailyPoints: dailyPoints,
      attendanceHistory: updatedAttendanceHistory
    };
  } catch (error) {
    console.error('خطأ في تسجيل الحضور:', error);
    return { success: false, error: error.message };
  }
};

// تسجيل العرض (الحفظ)
export const recordPresentation = async (studentId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const studentData = docSnap.data();
    
    // التحقق من أن الطالب ينتمي للمستخدم الحالي
    if (studentData.userId !== currentUser.uid) {
      return { success: false, error: 'غير مصرح لك بتسجيل العرض لهذا الطالب' };
    }

    // التحقق من أن الطالب غير مجمد
    if (studentData.isFrozen) {
      return { success: false, error: 'لا يمكن تسجيل العرض للطالب المجمد' };
    }
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay(); // 0 = الأحد، 1 = الاثنين، إلخ
    
    // التحقق من أن اليوم هو الأحد أو الثلاثاء أو الخميس (0, 2, 4)
    if (![0, 2, 4].includes(dayOfWeek)) {
      return { success: false, error: 'يمكن تسجيل الحفظ فقط في أيام الأحد والثلاثاء والخميس' };
    }
    
    // التحقق من عدم تسجيل العرض لنفس اليوم
    const existingPresentation = studentData.presentationHistory?.find(
      record => record.date === todayString
    );

    if (existingPresentation) {
      return { success: false, error: 'تم تسجيل الحفظ مسبقاً لهذا اليوم' };
    }

    const newPresentation = {
      date: todayString,
      timestamp: new Date(),
      points: 1 // نقطة واحدة للحفظ
    };
    
    const updatedPresentationHistory = [...(studentData.presentationHistory || []), newPresentation];
    const weeklyPoints = (studentData.weeklyPoints || 0) + 1;
    const dailyPoints = (studentData.dailyPoints || 0) + 1;
    const weeklyRating = Math.min(10, (studentData.weeklyRating || 0) + 0.5);
    const stars = Math.floor(weeklyRating / 2);
    
    // تحديث بيانات الأسبوع
    const currentWeek = getWeekNumber(today);
    const updatedWeeklyData = updateWeeklyData(studentData.weeklyData || [], currentWeek, dailyPoints);
    
    await updateDoc(docRef, {
      presentationHistory: updatedPresentationHistory,
      weeklyPoints: weeklyPoints,
      dailyPoints: dailyPoints,
      weeklyRating: weeklyRating,
      stars: stars,
      weeklyData: updatedWeeklyData,
      updatedAt: new Date()
    });

    return { 
      success: true, 
      weeklyPoints: weeklyPoints,
      dailyPoints: dailyPoints,
      weeklyRating: weeklyRating,
      stars: stars
    };
  } catch (error) {
    console.error('خطأ في تسجيل العرض:', error);
    return { success: false, error: error.message };
  }
};

// خصم نقاط للطالب
export const deductPoints = async (studentId, points, reason) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const studentData = docSnap.data();
    
    // التحقق من أن الطالب ينتمي للمستخدم الحالي
    if (studentData.userId !== currentUser.uid) {
      return { success: false, error: 'غير مصرح لك بخصم نقاط لهذا الطالب' };
    }

    const newDeduction = {
      points: -points,
      reason: reason,
      date: new Date(),
      timestamp: new Date()
    };
    
    const updatedDeductions = [...(studentData.deductions || []), newDeduction];
    const weeklyPoints = Math.max(0, (studentData.weeklyPoints || 0) - points);
    const dailyPoints = Math.max(0, (studentData.dailyPoints || 0) - points);

    await updateDoc(docRef, {
      deductions: updatedDeductions,
      weeklyPoints: weeklyPoints,
      dailyPoints: dailyPoints,
      updatedAt: new Date()
    });

    return { 
      success: true, 
      weeklyPoints: weeklyPoints,
      dailyPoints: dailyPoints
    };
  } catch (error) {
    console.error('خطأ في خصم النقاط:', error);
    return { success: false, error: error.message };
  }
};

// إضافة ملاحظة للطالب
export const addStudentNote = async (studentId, noteText) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }

    const studentData = docSnap.data();
    
    // التحقق من أن الطالب ينتمي للمستخدم الحالي
    if (studentData.userId !== currentUser.uid) {
      return { success: false, error: 'غير مصرح لك بإضافة ملاحظة لهذا الطالب' };
    }
    
    const newNote = {
      id: Date.now().toString(), // معرف فريد للملاحظة
      text: noteText,
      date: new Date(),
      timestamp: new Date()
    };

    const updatedNotes = [...(studentData.notes || []), newNote];

    await updateDoc(docRef, {
      notes: updatedNotes,
      updatedAt: new Date()
    });

    return { success: true, notes: updatedNotes };
  } catch (error) {
    console.error('خطأ في إضافة الملاحظة:', error);
    return { success: false, error: error.message };
  }
};

// حذف ملاحظة للطالب
export const deleteStudentNote = async (studentId, noteId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    const docRef = doc(db, 'students', studentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'الطالب غير موجود' };
    }
    
    const studentData = docSnap.data();
    
    // التحقق من أن الطالب ينتمي للمستخدم الحالي
    if (studentData.userId !== currentUser.uid) {
      return { success: false, error: 'غير مصرح لك بحذف ملاحظة لهذا الطالب' };
    }
    
    const updatedNotes = (studentData.notes || []).filter(note => note.id !== noteId);
    
    await updateDoc(docRef, {
      notes: updatedNotes,
      updatedAt: new Date()
    });
    
    return { success: true, notes: updatedNotes };
  } catch (error) {
    console.error('خطأ في حذف الملاحظة:', error);
    return { success: false, error: error.message };
  }
};

// إدارة بيانات المدرسة
export const getSchoolData = async (userId) => {
  try {
    const docRef = doc(db, 'schools', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, schoolData: docSnap.data() };
    } else {
      return { success: false, error: 'بيانات المدرسة غير موجودة' };
    }
  } catch (error) {
    console.error('خطأ في جلب بيانات المدرسة:', error);
    return { success: false, error: error.message };
  }
};

export const createSchoolData = async (userId, schoolData) => {
  try {
    const docRef = doc(db, 'schools', userId);
    // استخدم setDoc مع merge لضمان الإنشاء/التحديث في نفس المستند
    await setDoc(docRef, schoolData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('خطأ في إنشاء/تحديث بيانات المدرسة:', error);
    return { success: false, error: error.message };
  }
}; 

// دوال مساعدة
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function updateWeeklyData(weeklyData, weekNumber, dailyPoints) {
  const existingWeek = weeklyData.find(week => week.week === weekNumber);
  
  if (existingWeek) {
    existingWeek.points += dailyPoints;
    existingWeek.rating = Math.min(10, existingWeek.points / 3); // 3 نقاط كحد أقصى يومياً
  } else {
    weeklyData.push({
      week: weekNumber,
      points: dailyPoints,
      rating: Math.min(10, dailyPoints / 3)
    });
  }
  
  return weeklyData;
} 