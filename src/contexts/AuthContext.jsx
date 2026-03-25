import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { createInitialProfile, isProfileComplete } from '../utils/userUtils';

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
        
        // Sanitize legacy subjects (remove standard/advanced labels)
        if (userData.subjects && Array.isArray(userData.subjects)) {
          userData.subjects = Array.from(new Set(userData.subjects.map(s => s.replace(/（.*?）/, ''))));
        }

        setProfile(userData);
        // type・subjects が未設定の場合は ProfileSetup へ誘導する
        if (!isProfileComplete(userData)) {
          setNeedsProfileSetup(true);
        } else {
          setNeedsProfileSetup(false);
        }
      } else {
        // 新規ユーザー：初期プロファイルは type/subjects が空なので ProfileSetup へ
        const initialProfile = createInitialProfile(firebaseUser);
        await setDoc(userDocRef, initialProfile);
        setProfile(initialProfile);
        setNeedsProfileSetup(true);
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
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setProfile(updatedProfile);
      
      if (isProfileComplete(updatedProfile)) {
        setNeedsProfileSetup(false);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
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
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};