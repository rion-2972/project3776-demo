import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, Check } from 'lucide-react';

const LanguageSettings = ({ onBack }) => {
    const { language: currentLanguage, changeLanguage, t, loading } = useLanguage();

    const languages = [
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'en', name: 'English', nativeName: 'English' }
    ];

    const handleLanguageChange = async (languageCode) => {
        try {
            await changeLanguage(languageCode);
        } catch (error) {
            console.error('Error updating language:', error);
            alert(t('languageUpdateFailed'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">{t('loading')}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">{t('languageSettingsTitle')}</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {languages.map((lang, index) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition ${index < languages.length - 1 ? 'border-b border-gray-100' : ''
                                } ${currentLanguage === lang.code ? 'bg-indigo-50' : ''}`}
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-gray-900">
                                    {lang.nativeName}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {lang.name}
                                </span>
                            </div>
                            {currentLanguage === lang.code && (
                                <Check className="w-5 h-5 text-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguageSettings;
