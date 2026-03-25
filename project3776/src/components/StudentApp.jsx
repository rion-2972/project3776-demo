import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PenTool, Home, Clock, Menu, Play } from 'lucide-react';
import RecordView from './student/RecordView';
import HomeView from './student/HomeView';
import TimelineView from './student/TimelineView';
import Sidebar from './student/Sidebar';
import StatisticsView from './student/StatisticsView';
import SettingsView from './student/SettingsView';
import LanguageSettings from './student/LanguageSettings';
import ReferenceBooksList from './student/ReferenceBooksList';
import PastAssignmentsList from './student/PastAssignmentsList';
import ClassSelectionSettings from './student/ClassSelectionSettings';
import EffectSettings from './student/EffectSettings';
import VersionHistoryView from './shared/VersionHistoryView';
import UserGuideView from './student/UserGuideView';
import StudyGoalSettingsView from './student/StudyGoalSettingsView';
import { TourProvider } from '../contexts/TourContext';
import CoachMark from './shared/CoachMark';

const StudentApp = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home'); // record | home | timeline
  const [activeView, setActiveView] = useState(null);
  const [preFillData, setPreFillData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 学習目標が一度も設定されていない場合 true
  const isGoalUnset = !profile?.studyGoals;

  // TourContext からのタブ切り替え要求をハンドル
  const handleTourTabChange = (tab) => {
    setActiveTab(tab);
    setActiveView(null); // サイドバー画面を閉じてメインタブに戻す
  };

  const handleAssignmentClick = (assignment) => {
    let subjectToRecord = assignment.subject;

    // If assignment is '英論', map it to user's English level
    if (assignment.subject === '英論') {
      const userEnglish = profile?.subjects?.find(s => s.startsWith('英語'));
      subjectToRecord = userEnglish || '英語（標準）';
    }

    setPreFillData({
      subject: subjectToRecord,
      task: '課題', // Fixed task type
      contentDetails: assignment.content,
      mode: 'stopwatch'
    });
    setActiveTab('record');
  };

  const clearPreFillData = () => {
    setPreFillData(null);
  };

  const handleSidebarNavigation = (view) => {
    setActiveView(view);
    setActiveTab(null); // Clear tab when viewing sidebar screens
  };

  const handleBackToHome = () => {
    setActiveView(null);
    setActiveTab('home');
  };

  // 日課・マイプランの▶ボタンからストップウォッチを起動
  const handleStartTimer = (taskInfo) => {
    const subject = taskInfo.subject || '';
    setPreFillData({
      subject,
      task: '',
      contentDetails: taskInfo.content || '',
      mode: 'stopwatch'
    });
    setActiveTab('record');
  };

  const handleSettingsNavigation = (view) => {
    setActiveView(view);
  };

  const handleBackToSettings = () => {
    setActiveView('settings');
  };

  // Render appropriate view
  const renderContent = () => {
    // Sidebar views take precedence
    if (activeView === 'statistics') {
      return <StatisticsView onBack={handleBackToHome} />;
    }
    if (activeView === 'settings') {
      return <SettingsView onBack={handleBackToHome} onNavigate={handleSettingsNavigation} />;
    }
    if (activeView === 'language') {
      return <LanguageSettings onBack={handleBackToSettings} />;
    }
    if (activeView === 'books') {
      return <ReferenceBooksList onBack={handleBackToSettings} />;
    }
    if (activeView === 'pastAssignments') {
      return <PastAssignmentsList onBack={handleBackToSettings} />;
    }
    if (activeView === 'classSelection') {
      return <ClassSelectionSettings onBack={handleBackToSettings} />;
    }
    if (activeView === 'effect') {
      return <EffectSettings onBack={handleBackToSettings} />;
    }
    if (activeView === 'versionHistory') {
      return <VersionHistoryView onBack={handleBackToSettings} />;
    }
    if (activeView === 'studyGoals') {
      return <StudyGoalSettingsView onBack={handleBackToSettings} />;
    }
    if (activeView === 'userGuide') {
      return <UserGuideView onBack={handleBackToHome} />;
    }

    // Tab views
    if (activeTab === 'record') {
      return <RecordView preFillData={preFillData} onPreFillApplied={clearPreFillData} />;
    }
    if (activeTab === 'home') {
      return <HomeView onAssignmentClick={handleAssignmentClick} onStartTimer={handleStartTimer} />;
    }
    if (activeTab === 'timeline') {
      return <TimelineView />;
    }

    return null;
  };

  const showHeader = !activeView; // Hide header when in sidebar views
  const showBottomNav = !activeView; // Hide bottom nav when in sidebar views

  return (
    <TourProvider onTabChange={handleTourTabChange}>
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar - Mobile: Modal, Desktop: Always visible */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={profile?.displayName}
          onNavigate={handleSidebarNavigation}
          activeView={activeView}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isGoalUnset={isGoalUnset}
        />

        {/* Header - only show for main tabs, hidden on desktop */}
        {showHeader && (
          <header className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
              {/* Left: Hamburger with goal-unset badge */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Menu className="w-6 h-6 text-gray-700" />
                {isGoalUnset && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {/* Center: Logo only */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
                <img src="/Project3776.png" alt="Project 3776" className="w-8 h-8 rounded-lg" />
              </div>

              {/* Right: Empty space for balance */}
              <div className="w-10"></div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 w-full ${showBottomNav ? 'max-w-md mx-auto md:max-w-none p-4 pb-24 md:pb-4' : 'md:p-8'}`}>
          {renderContent()}
        </main>

        {/* Bottom Tab Navigation - only show for main tabs on mobile */}
        {showBottomNav && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe md:hidden">
            <div className="max-w-md mx-auto flex justify-around">
              <button
                onClick={() => setActiveTab('record')}
                className={`flex flex-col items-center justify-center w-full py-3 ${activeTab === 'record' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <PenTool className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">{t('navRecord')}</span>
              </button>

              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center justify-center w-full py-3 ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Home className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">{t('navHome')}</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex flex-col items-center justify-center w-full py-3 ${activeTab === 'timeline' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Clock className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">{t('navTimeline')}</span>
              </button>
            </div>
          </div>
        )}

        {/* FAB - クイック記録開始ボタン */}
        {showBottomNav && activeTab !== 'record' && (
          <button
            onClick={() => setActiveTab('record')}
            className="fixed z-30 right-5 bottom-24 md:bottom-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
            title="勉強を記録する"
          >
            <Play className="w-6 h-6 text-white ml-0.5" />
          </button>
        )}

        {/* コーチマークオーバーレイ */}
        <CoachMark />
      </div>
    </TourProvider>
  );
};

export default StudentApp;
