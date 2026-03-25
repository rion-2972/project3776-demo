import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, BarChart3, Settings, PenTool, Home, Clock, HelpCircle } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, userName, onNavigate, activeView, activeTab, onTabChange, isGoalUnset }) => {
    const { t } = useLanguage();

    const handleNavigation = (view) => {
        onNavigate(view);
        onClose();
    };

    const handleTabClick = (tab) => {
        onTabChange(tab);
        onClose();
    };

    return (
        <>
            {/* Backdrop - Mobile only */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed md:static top-0 left-0 h-full w-72 bg-white shadow-2xl md:shadow-none md:border-r md:border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">{t('sidebarWelcome')}</div>
                            <div className="text-lg font-bold text-gray-900">{userName}</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition md:hidden"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <nav className="space-y-2">
                            {/* Desktop Navigation Tabs */}
                            <div className="hidden md:block mb-4">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    メインメニュー
                                </div>
                                <button
                                    onClick={() => handleTabClick('home')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'home' && !activeView
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Home className="w-5 h-5" />
                                    <span className="text-sm font-medium">{t('navHome')}</span>
                                </button>
                                <button
                                    onClick={() => handleTabClick('record')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'record' && !activeView
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <PenTool className="w-5 h-5" />
                                    <span className="text-sm font-medium">{t('navRecord')}</span>
                                </button>
                                <button
                                    onClick={() => handleTabClick('timeline')}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'timeline' && !activeView
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Clock className="w-5 h-5" />
                                    <span className="text-sm font-medium">{t('navTimeline')}</span>
                                </button>
                            </div>

                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 md:mt-4">
                                その他
                            </div>

                            <button
                                onClick={() => handleNavigation('statistics')}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition ${activeView === 'statistics'
                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50'
                                    : 'bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100'
                                    } group`}
                            >
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className="text-sm font-bold text-gray-900">{t('sidebarStatistics')}</span>
                            </button>

                            {/* 目標未設定の吹き出し */}
                            {isGoalUnset && (
                                <div className="mb-1 mx-1">
                                    <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl relative shadow-md">
                                        🎯 学習目標を設定しましょう！
                                        {/* 下向き三角 */}
                                        <div className="absolute -bottom-1.5 left-6 w-3 h-2 overflow-hidden">
                                            <div className="bg-indigo-600 w-2 h-2 rotate-45 translate-x-0.5" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => handleNavigation('settings')}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition ${activeView === 'settings'
                                    ? 'bg-gradient-to-r from-gray-50 to-slate-50'
                                    : 'bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100'
                                    } group`}
                            >
                                <div className="relative p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                    {isGoalUnset && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                    )}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{t('sidebarSettings')}</span>
                            </button>

                            <button
                                onClick={() => handleNavigation('userGuide')}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition ${activeView === 'userGuide'
                                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50'
                                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100'
                                    } group`}
                            >
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition">
                                    <HelpCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-sm font-bold text-gray-900">{t('sidebarUserGuide')}</span>
                            </button>
                        </nav>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="text-xs text-gray-400 text-center">
                            {t('appName')}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
