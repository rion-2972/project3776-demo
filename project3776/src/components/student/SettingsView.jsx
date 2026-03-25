import React from 'react';
import { ArrowLeft, Globe, BookOpen, ClipboardList, LogOut, GraduationCap, Sparkles, History, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const SettingsView = ({ onBack, onNavigate }) => {
    const { signOut } = useAuth();
    const { t } = useLanguage();

    const menuItems = [
        {
            id: 'classSelection',
            label: 'クラス選択',
            icon: GraduationCap,
            onClick: () => onNavigate('classSelection')
        },
        {
            id: 'effect',
            label: 'エフェクト',
            icon: Sparkles,
            onClick: () => onNavigate('effect')
        },
        {
            id: 'language',
            label: t('languageSettings'),
            icon: Globe,
            onClick: () => onNavigate('language')
        },
        {
            id: 'books',
            label: t('referenceBooks'),
            icon: BookOpen,
            onClick: () => onNavigate('books')
        },
        {
            id: 'pastAssignments',
            label: t('pastAssignmentsList'),
            icon: ClipboardList,
            onClick: () => onNavigate('pastAssignments')
        },
        {
            id: 'studyGoals',
            label: '学習目標の設定',
            icon: Target,
            onClick: () => onNavigate('studyGoals')
        },
        {
            id: 'versionHistory',
            label: 'バージョン履歴',
            icon: History,
            onClick: () => onNavigate('versionHistory')
        }
    ];

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
                    <h1 className="text-lg font-bold text-gray-900">{t('settingsTitle')}</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 pt-4">
                {/* Menu Items */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition ${index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <item.icon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="flex-1 text-left text-sm font-medium text-gray-900">
                                {item.label}
                            </span>
                            <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}
                </div>

                {/* Logout Button */}
                <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 hover:border-red-200 transition group"
                >
                    <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition" />
                    <span className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition">
                        {t('logout')}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
