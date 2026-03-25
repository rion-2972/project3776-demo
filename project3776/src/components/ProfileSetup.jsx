// src/components/ProfileSetup.jsx
import React, { useState } from 'react';
import { Users, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECT_GROUPS, LEVEL_SUBJECTS, getDefaultSubjects } from '../utils/constants';

const ProfileSetup = () => {
  const { profile, updateProfile } = useAuth();
  const [role, setRole] = useState(profile?.role || 'student');
  const [type, setType] = useState(profile?.type || 'riken');
  const [subjects, setSubjects] = useState(profile?.subjects || getDefaultSubjects('riken'));
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    const defaultSubjects = getDefaultSubjects(newType);
    setSubjects(defaultSubjects);
  };

  const toggleSubject = (subject) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const handleHistoryChoice = (choice) => {
    const otherChoice = choice === '日本史' ? '世界史' : '日本史';
    const newSubjects = subjects.filter(s => s !== otherChoice);
    if (!newSubjects.includes(choice)) {
      newSubjects.push(choice);
    }
    setSubjects(newSubjects);
  };

  const handleScienceChoice = (choice) => {
    const otherChoice = choice === '物理' ? '生物' : '物理';
    const newSubjects = subjects.filter(s => s !== otherChoice);
    if (!newSubjects.includes(choice)) {
      newSubjects.push(choice);
    }
    setSubjects(newSubjects);
  };

  const handleMathLevelChange = (level) => {
    const newSubjects = subjects.filter(s => !s.startsWith('数学'));
    newSubjects.push(level);
    setSubjects(newSubjects);
  };

  const handleEnglishLevelChange = (level) => {
    const newSubjects = subjects.filter(s => !s.startsWith('英語'));
    newSubjects.push(level);
    setSubjects(newSubjects);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updateProfile({
      role,
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">プロファイル設定</h2>
          <p className="text-sm text-gray-600">
            あなたの役割と学習科目を設定してください
          </p>
        </div>

        {/* 役割選択 */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            役割
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole('student')}
              className={`py-3 rounded-lg font-medium transition ${role === 'student'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              生徒
            </button>
            <button
              onClick={() => setRole('teacher')}
              className={`py-3 rounded-lg font-medium transition ${role === 'teacher'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              教員
            </button>
          </div>
        </div>

        {/* 生徒の場合のみ科目選択を表示 */}
        {role === 'student' && (
          <>
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

            {/* Math and English Level Selection */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                数学・英語のレベル選択
              </h3>

              {/* Math Level */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">数学</h4>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_SUBJECTS.math.map(level => (
                    <button
                      key={level}
                      onClick={() => handleMathLevelChange(level)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${subjects.includes(level)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* English Level */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">英語</h4>
                <div className="grid grid-cols-2 gap-2">
                  {LEVEL_SUBJECTS.english.map(level => (
                    <button
                      key={level}
                      onClick={() => handleEnglishLevelChange(level)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${subjects.includes(level)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 共通科目 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                共通科目（全員必須）
              </h4>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    文系科目
                  </h4>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    選択：日本史 or 世界史
                  </h4>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    理系科目
                  </h4>
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    選択：物理 or 生物
                  </h4>
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
          </>
        )}

        {/* 保存ボタン */}
        <div className="mt-6 pt-6 border-t">
          <div className="bg-indigo-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-indigo-800">
              <strong>設定内容:</strong> {role === 'teacher' ? '教員' : '生徒'} /
              {role === 'student' && ` ${type === 'bunken' ? '文系' : '理系'} / ${subjects.length}科目選択`}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || (role === 'student' && subjects.length === 0)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;