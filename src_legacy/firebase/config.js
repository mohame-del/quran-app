import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// تكوين Firebase - بيانات المشروع الحقيقية
const firebaseConfig = {
  apiKey: "AIzaSyDslXONuAvOv3Q-bNXdroE2YtVNXKwUj-0",
  authDomain: "quran-school-app-61584.firebaseapp.com",
  projectId: "quran-school-app-61584",
  storageBucket: "quran-school-app-61584.firebasestorage.app",
  messagingSenderId: "115630985241",
  appId: "1:115630985241:web:37dc889d59385a7e419a88",
  measurementId: "G-L3MYTVJQLZ"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تصدير الخدمات
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app; 