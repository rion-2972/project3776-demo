// src/App.js
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { EffectProvider } from './contexts/EffectContext';
import Auth from './components/Auth';
import ProfileSetup from './components/ProfileSetup';
import StudentApp from './components/StudentApp';
import TeacherApp from './components/TeacherApp';

const AppContent = () => {
  const { user, profile, loading, needsProfileSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600 mb-2">
            Project 3776
          </div>
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return <Auth />;
  }

  // プロファイル未設定
  if (needsProfileSetup) {
    return <ProfileSetup />;
  }

  // 役割に応じて画面を表示
  if (profile?.role === 'teacher') {
    return <TeacherApp />;
  }

  return <StudentApp />;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <EffectProvider>
          <AppContent />
        </EffectProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

