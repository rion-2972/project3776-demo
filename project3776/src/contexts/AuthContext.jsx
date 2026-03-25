// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getDefaultSubjects } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setNeedsProfileSetup(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (firebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // レガシーデータのサニタイズ（標準/発展ラベルを除去）
        if (userData.subjects && Array.isArray(userData.subjects)) {
          userData.subjects = Array.from(
            new Set(userData.subjects.map(s => s.replace(/（.*?）/, '')))
          );
        }

        setProfile(userData);
        setNeedsProfileSetup(false);
      } else {
        // 新規ユーザー：localStorage から役割・名前を取得して初期プロフィールを作成
        const demoRole = localStorage.getItem('demo_role') || 'student';
        const demoName = localStorage.getItem('demo_name') || '生徒';

        const initialProfile = {
          uid: firebaseUser.uid,
          displayName: demoName,
          role: demoRole,
          // 生徒の場合は理系をデフォルトに設定（あとで変更可能）
          type: demoRole === 'teacher' ? null : 'riken',
          subjects: demoRole === 'teacher' ? [] : getDefaultSubjects('riken'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, initialProfile);
        setProfile(initialProfile);

        // 教員はプロファイルセットアップ不要、生徒も即時利用可能
        setNeedsProfileSetup(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, updatedProfile, { merge: true });
      setProfile(updatedProfile);

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // localStorage のデモ用データを削除
      localStorage.removeItem('demo_role');
      localStorage.removeItem('demo_name');
      setUser(null);
      setProfile(null);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    needsProfileSetup,
    updateProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};