// src/components/ProfileSetup.jsx
import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECT_GROUPS, getDefaultSubjects } from '../utils/constants';

const ProfileSetup = () => {
  const { profile, updateProfile } = useAuth();
  const [type, setType] = useState(profile?.type || 'riken');
  const [subjects, setSubjects] = useState(profile?.subjects?.length > 0 ? profile.subjects : getDefaultSubjects('riken'));
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    // 系統が切り替わったらデフォルト科目でリセット
    setSubjects(getDefaultSubjects(newType));
  };

  const toggleSubject = (subject) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const handleHistoryChoice = (choice) => {
    const other = choice === '日本史' ? '世界史' : '日本史';
    const updated = subjects.filter(s => s !== other);
    if (!updated.includes(choice)) updated.push(choice);
    setSubjects(updated);
  };

  const handleScienceChoice = (choice) => {
    const other = choice === '物理' ? '生物' : '物理';
    const updated = subjects.filter(s => s !== other);
    if (!updated.includes(choice)) updated.push(choice);
    setSubjects(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updateProfile({
      role: profile?.role || 'student', // 役割は Auth.jsx で決定済みのものを維持
      type,
      subjects
    });
    setSaving(false);
    if (!success) {
      alert('設定の保存に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
        {/* ウェルカムヘッダー */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {profile?.displayName}さん、ようこそ！
          </h2>
          <p className="text-sm text-gray-600">
            学習科目を設定してください。あとから変更することもできます。
          </p>
        </div>

        {/* 文系・理系選択 */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            文系 / 理系
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleTypeChange('bunken')}
              className={`py-3 rounded-lg font-medium transition ${type === 'bunken'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              文系
            </button>
            <button
              onClick={() => handleTypeChange('riken')}
              className={`py-3 rounded-lg font-medium transition ${type === 'riken'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              理系
            </button>
          </div>
        </div>

        {/* 共通科目（変更不可ラベル） */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">共通科目（全員必須）</h4>
          <div className="grid grid-cols-3 gap-2">
            {SUBJECT_GROUPS.common.map(subject => (
              <div
                key={subject}
                className="py-2 px-3 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 text-center"
              >
                {subject}
              </div>
            ))}
          </div>
        </div>

        {/* 文系科目 */}
        {type === 'bunken' && (
          <>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">文系科目</h4>
              <div className="grid grid-cols-3 gap-2">
                {SUBJECT_GROUPS.bunken.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${subjects.includes(subject)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">選択：日本史 or 世界史</h4>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECT_GROUPS.bunkenHistory.map(subject => (
                  <button
                    key={subject}
                    onClick={() => handleHistoryChoice(subject)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${subjects.includes(subject)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 理系科目 */}
        {type === 'riken' && (
          <>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">理系科目</h4>
              <div className="grid grid-cols-3 gap-2">
                {SUBJECT_GROUPS.riken.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${subjects.includes(subject)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">選択：物理 or 生物</h4>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECT_GROUPS.rikenScience.map(subject => (
                  <button
                    key={subject}
                    onClick={() => handleScienceChoice(subject)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${subjects.includes(subject)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 保存ボタン */}
        <div className="mt-6 pt-6 border-t">
          <div className="bg-indigo-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-indigo-800">
              <strong>設定内容:</strong>{' '}
              {type === 'bunken' ? '文系' : '理系'} / {subjects.length}科目選択
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || subjects.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {saving ? '保存中...' : '設定を保存して始める'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;