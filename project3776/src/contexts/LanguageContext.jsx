import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const { user } = useAuth();
    const [language, setLanguage] = useState('ja'); // Default to Japanese
    const [loading, setLoading] = useState(true);

    // Load language preference from Firestore
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadLanguage = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().language) {
                    setLanguage(userDoc.data().language);
                }
            } catch (error) {
                console.error('Error loading language:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLanguage();
    }, [user]);

    // Change language and save to Firestore
    const changeLanguage = async (newLanguage) => {
        if (!user) return;

        try {
            await setDoc(
                doc(db, 'users', user.uid),
                { language: newLanguage },
                { merge: true }
            );
            setLanguage(newLanguage);
        } catch (error) {
            console.error('Error saving language:', error);
            throw error;
        }
    };

    // Get translated text
    const t = (key) => {
        return translations[language]?.[key] || translations.ja[key] || key;
    };

    const value = {
        language,
        changeLanguage,
        t,
        loading
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
