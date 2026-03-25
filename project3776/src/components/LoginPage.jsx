// src/components/LoginPage.jsx
// URLパラメータ（?role=student / ?role=teacher）を利用した匿名ログイン画面
import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { Mountain } from 'lucide-react';
import { auth } from '../firebase';

const LoginPage = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URLクエリパラメータから役割を取得
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role'); // 'student' | 'teacher' | null

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // 生徒の場合は名前が必要
    if (role !== 'teacher' && !name.trim()) {
      setError('名前を入力してください。');
      return;
    }

    setLoading(true);
    try {
      // 役割と名前を localStorage に保存（AuthContext で参照）
      localStorage.setItem('demo_role', role === 'teacher' ? 'teacher' : 'student');
      localStorage.setItem('demo_name', role === 'teacher' ? '先生' : name.trim());

      await signInAnonymously(auth);
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('ログインに失敗しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  // ===== 教員用画面 =====
  if (role === 'teacher') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Mountain className="w-10 h-10 text-indigo-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Project 3776</h2>
              <p className="text-xs text-gray-600">富士山の標高を目指す学習記録</p>
            </div>
          </div>

          <p className="text-center text-gray-600 mb-2 font-medium">教員用ダッシュボード</p>
          <p className="text-center text-sm text-gray-400 mb-6">教員としてシステムにアクセスします</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '読み込み中...' : '教員ダッシュボードを開く'}
          </button>
        </div>
      </div>
    );
  }

  // ===== 生徒用画面（?role=student またはパラメータなし） =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Mountain className="w-10 h-10 text-indigo-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Project 3776</h2>
            <p className="text-xs text-gray-600">富士山の標高を目指す学習記録</p>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-2 font-medium">生徒用ログイン</p>
        <p className="text-center text-sm text-gray-400 mb-6">名前を入力して学習を始めましょう</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例：富士 太郎"
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '読み込み中...' : '学習を始める'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
