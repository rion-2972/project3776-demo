import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const EffectContext = createContext();

export const useEffectContext = () => {
    const context = useContext(EffectContext);
    if (!context) {
        throw new Error('useEffectContext must be used within an EffectProvider');
    }
    return context;
};

export const EffectProvider = ({ children }) => {
    const { user } = useAuth();
    const [effect, setEffect] = useState('burning'); // デフォルトは「燃焼」
    const [loading, setLoading] = useState(true);

    // Firestoreからエフェクト設定を読み込む
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadEffect = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().effect) {
                    setEffect(userDoc.data().effect);
                }
            } catch (error) {
                console.error('Error loading effect:', error);
            } finally {
                setLoading(false);
            }
        };

        loadEffect();
    }, [user]);

    // エフェクトを変更してFirestoreに保存
    const changeEffect = async (newEffect) => {
        if (!user) return;

        try {
            await setDoc(
                doc(db, 'users', user.uid),
                { effect: newEffect },
                { merge: true }
            );
            setEffect(newEffect);
        } catch (error) {
            console.error('Error saving effect:', error);
            throw error;
        }
    };

    const value = {
        effect,
        changeEffect,
        loading
    };

    return (
        <EffectContext.Provider value={value}>
            {children}
        </EffectContext.Provider>
    );
};
