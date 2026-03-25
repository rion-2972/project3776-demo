import React from 'react';
import { X, Home, BarChart3, Clock, Settings, HelpCircle } from 'lucide-react';

const TeacherSidebar = ({ isOpen, onClose, profile, activeTab, activeView, onTabChange, onNavigate }) => {

    const handleTabClick = (tab) => {
        onTabChange(tab);
        onClose();
    };

    const handleNavigation = (view) => {
        onNavigate(view);
        onClose();
    };

    return (
        <>
            {/* バックドロップ - モバイルのみ */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden"
                    onClick={onClose}
                />
            )}

            {/* サイドバー */}
            <div
                className={`fixed md:static top-0 left-0 h-full w-72 bg-white shadow-2xl md:shadow-none md:border-r md:border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* ヘッダー */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <img src="/Project3776.png" alt="Project 3776" className="w-8 h-8 rounded-lg" />
                                <h1 className="text-lg font-bold text-gray-900">Project 3776</h1>
                            </div>
                            <div className="text-sm font-medium text-gray-700">{profile?.displayName}先生</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition md:hidden"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* メニュー */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <nav className="space-y-2">
                            {/* メインメニュー */}
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                メニュー
                            </div>
                            <button
                                onClick={() => handleTabClick('home')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'home' && !activeView
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Home className="w-5 h-5" />
                                <span className="text-sm font-medium">ホーム</span>
                            </button>
                            <button
                                onClick={() => handleTabClick('analytics')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'analytics' && !activeView
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <BarChart3 className="w-5 h-5" />
                                <span className="text-sm font-medium">分析</span>
                            </button>
                            <button
                                onClick={() => handleTabClick('timeline')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'timeline' && !activeView
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Clock className="w-5 h-5" />
                                <span className="text-sm font-medium">タイムライン</span>
                            </button>

                            {/* その他 */}
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                                その他
                            </div>

                            <button
                                onClick={() => handleNavigation('settings')}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition ${activeView === 'settings'
                                    ? 'bg-gradient-to-r from-gray-50 to-slate-50'
                                    : 'bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100'
                                    } group`}
                            >
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                </div>
                                <span className="text-sm font-bold text-gray-900">設定</span>
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
                                <span className="text-sm font-bold text-gray-900">使い方ガイド</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TeacherSidebar;
