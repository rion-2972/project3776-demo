import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Home, Clock, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnalyticsView from './teacher/AnalyticsView';
import TeacherHomeView from './teacher/TeacherHomeView';
import TeacherSidebar from './teacher/TeacherSidebar';
import TeacherSettingsView from './teacher/TeacherSettingsView';
import TeacherUserGuideView from './teacher/TeacherUserGuideView';
import VersionHistoryView from './shared/VersionHistoryView';
import TimelineView from './student/TimelineView';
import { TeacherTourProvider } from '../contexts/TeacherTourContext';
import { ToastProvider } from '../contexts/ToastContext';
import CoachMarkTeacher from './shared/CoachMarkTeacher';

const TeacherApp = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('home'); // analytics | home | timeline
  const [activeView, setActiveView] = useState(null); // settings
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarNavigation = (view) => {
    setActiveView(view);
    setActiveTab(null);
  };

  const handleBackToHome = () => {
    setActiveView(null);
    setActiveTab('home');
  };

  const handleTabChange = useCallback((tab) => {
    setActiveView(null);
    setActiveTab(tab);
  }, []);

  const handleBackToSettings = () => {
    setActiveView('settings');
  };

  // 表示切り替えロジック
  const renderContent = () => {
    if (activeView === 'settings') {
      return <TeacherSettingsView onBack={handleBackToHome} onNavigate={handleSidebarNavigation} />;
    }
    if (activeView === 'versionHistory') {
      return <VersionHistoryView onBack={handleBackToSettings} />;
    }
    if (activeView === 'userGuide') {
      return <TeacherUserGuideView onBack={handleBackToHome} />;
    }

    if (activeTab === 'analytics') return <AnalyticsView />;
    if (activeTab === 'home') return <TeacherHomeView />;
    if (activeTab === 'timeline') return <TimelineView />;

    return null;
  };

  const showHeader = !activeView;
  const showBottomNav = !activeView;

  const tabs = [
    { key: 'analytics', label: '分析', icon: BarChart3 },
    { key: 'home', label: 'ホーム', icon: Home },
    { key: 'timeline', label: 'タイムライン', icon: Clock },
  ];

  return (
    <TeacherTourProvider onTabChange={handleTabChange}>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
          {/* サイドバー */}
          <TeacherSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            profile={profile}
            activeTab={activeTab}
            activeView={activeView}
            onTabChange={handleTabChange}
            onNavigate={handleSidebarNavigation}
          />

          {/* モバイルヘッダー */}
          {showHeader && (
            <header className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
              <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <Menu className="w-6 h-6 text-gray-700" />
                </button>

                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                  <img src="/Project3776.png" alt="Project 3776" className="w-8 h-8 rounded-lg" />
                  <h1 className="text-lg font-bold text-gray-900">Project 3776</h1>
                </div>

                <div className="w-10"></div>
              </div>
            </header>
          )}

          {/* メインコンテンツ */}
          <main className={`flex-1 w-full ${showBottomNav ? 'max-w-md mx-auto md:max-w-none md:p-8 p-4 pb-24 md:pb-4' : 'md:p-8'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab ?? activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* ボトムタブナビゲーション - モバイルのみ */}
          {showBottomNav && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 pb-safe md:hidden"
              style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}
            >
              <div className="max-w-4xl mx-auto flex justify-around">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 ${activeTab === key ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <motion.div
                      animate={{ scale: activeTab === key ? 1.15 : 1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                    </motion.div>
                    <span className={`text-[10px] font-bold transition-all ${activeTab === key ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {activeTab === key && (
                      <motion.div
                        layoutId="teacher-tab-indicator"
                        className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 教員向けコーチマーク */}
          <CoachMarkTeacher />
        </div>
      </ToastProvider>
    </TeacherTourProvider>
  );
};

export default TeacherApp;