import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config.js';
import { auth } from './config.js';

export const setVacationMode = async (isVacation) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    const docRef = doc(db, 'vacation', currentUser.uid);
    await setDoc(docRef, { isVacation }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getVacationMode = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    const docRef = doc(db, 'vacation', currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, isVacation: !!docSnap.data().isVacation };
    } else {
      return { success: true, isVacation: false };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
